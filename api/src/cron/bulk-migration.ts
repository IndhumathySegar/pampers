import { schedule } from "node-cron";
import * as unzipper from "unzipper";

import { Types } from "mongoose";
import { CsvUploadHistoryModel } from "../entities";
import azure from "azure-storage";
import { get } from "lodash";
import { BulkMigration } from "../lib";
import * as XLSX from "xlsx";
const CONTENTFUL_MIGRATION_STORAGE_CONN_STRING = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_CONN_STRING"
)!;
// Initialize Azure Blob Service Client
const blobService = azure.createBlobService(
  CONTENTFUL_MIGRATION_STORAGE_CONN_STRING
);

// Schedule the batch job to run every 2 minutes
module.exports = () => {
  schedule("0 */2 * * * *", async () => {
    console.log("Process starts: Bulk migration");
    const processMigration = async (migration) => {
      migration.status = "Started";
      migration.isLocked = true;
      await migration.save();
      await retriveDocuments(migration);
    };

    try {
      const startedMigration = await CsvUploadHistoryModel.findOne({
        status: "Started",
        isLocked: false,
      })
        .sort({ createdAt: 1 })
        .exec();

      if (startedMigration) {
        console.log("Process starts: processCsvFile with startedMigration");
        await processMigration(startedMigration);
      } else {
        const pendingMigration = await CsvUploadHistoryModel.findOne({
          status: "Pending",
          isLocked: false,
        })
          .sort({ createdAt: 1 })
          .exec();

        if (pendingMigration) {
          console.log("Process starts: processCsvFile with pendingMigration");
          await processMigration(pendingMigration);
        }
      }

      console.log("Process finished: Bulk migration");
    } catch (ex) {
      console.error("[BULK MIGRATION CRON FAILURE]", ex);
    }
  });
};

// Process upload documents
const retriveDocuments = async (migrationEntry) => {
  try {
    console.log(
      "Process starts: createContentModelProperties",
      migrationEntry?._id
    );
    const filePath = migrationEntry.csvPath;
    const folderPath = migrationEntry.mediaPath;

    console.log("Process starts: parseAzureBlobPath", migrationEntry?._id);
    const [containerName, blobName] = parseAzureBlobPath(filePath);
    (async () => {
      console.log("Process starts: processMediaFile", migrationEntry?._id);
      const contentAssets = await processMediaFile(folderPath, migrationEntry);

      const blobStream = blobService.createReadStream(
        containerName,
        blobName,
        (error) => {
          if (error) {
            console.log("Error downloading blob:", error);
          }
        }
      );

      await processContentDocument(migrationEntry, contentAssets, blobStream);
    })();
  } catch (error) {
    console.log("Error processing Excel file:", error);
  }
};

const processContentDocument = async (migrationEntry, contentAssets, blobStream) => {
  const chunks: any = [];
  
  blobStream
    .on("data", (chunk) => chunks.push(chunk))
    .on("end", async () => {
      const workbook = parseWorkbookFromChunks(chunks);
      const modelsLength = migrationEntry.contentModels.length;

      let processedModelsCount = 0;
      for (const currentModel of migrationEntry.contentModels) {
        await processModel(migrationEntry, contentAssets, workbook, currentModel);
        processedModelsCount++;
        if (processedModelsCount === modelsLength) {
          await updateMigrationStatus(currentModel, migrationEntry);
        }
      }
    });
};

/**
 * Parse the workbook from the accumulated data chunks.
 */
const parseWorkbookFromChunks = (chunks) => {
  const buffer = Buffer.concat(chunks);
  return XLSX.read(buffer, { type: "buffer" });
};

/**
 * Process each model from the workbook and update the migration entry accordingly.
 */
const processModel = async (migrationEntry, contentAssets, workbook, currentModel) => {
  const modelName: string = currentModel.replace(/_/g, " ");
  const worksheet: any = XLSX.utils.sheet_to_json(workbook.Sheets[modelName], { header: 1 });

  if (worksheet.length > 0) {
    const currentModelHeaders: string[] = worksheet[0];
    const hasLocale = currentModelHeaders.some((header) => header.toLowerCase() === "locale");

    if (hasLocale) {
      const currentModelContents = extractDocumentData(worksheet, currentModelHeaders);
      const getContentFields = await BulkMigration.createContentModelProperties(modelName);
      await updateMigrationEntry(
        migrationEntry,
        getContentFields,
        currentModel,
        currentModelHeaders,
        currentModelContents,
      );
  
      await processModelEntries(
        migrationEntry,
        getContentFields,
        contentAssets,
        currentModel,
        currentModelContents,
      );
      return true;
    } else {
      await handleWorksheetError(
        migrationEntry,
        currentModel,
        null,
        "Locale column not found",
        "NotFound",
        "Please add locale column in the sheet"
      );
      return false;
    }
   
  } else {
    await handleWorksheetError(
      migrationEntry,
      currentModel,
      null,
      "Sheet not found",
      "NotFound",
      "Please upload the correct file for the selected model"
    );
    return false;
  }
};

/**
 * Process each entry in the model and handle errors individually.
 */
const processModelEntries = async (
  migrationEntry,
  getContentFields,
  contentAssets,
  currentModel,
  currentModelContents,
) => {
  const lastProcessedIndex = migrationEntry.lastProcessed[currentModel] || 0;

  for (let i = lastProcessedIndex; i < currentModelContents.length; i++) {
    const currentEntry = formatEntry(currentModelContents[i]);

    try {
      if (currentEntry.locale) {
        await processEntry(
          migrationEntry,
          getContentFields,
          contentAssets,
          currentModel,
          currentEntry
        );
        migrationEntry.lastProcessed.set(currentModel, i + 1);
        migrationEntry.updatedAt = new Date();
        await migrationEntry.save();
      } else {
        await handleWorksheetError(
          migrationEntry,
          currentModel,
          currentEntry,
          "Locale not found",
          "NotFound",
          "Locale value is missed"
        );
      }
    } catch (error) {
      logEntryError(migrationEntry, currentModel, currentEntry?.locale, error);
      break;
    }
  }
};

/**
 * Format an entry by ensuring no undefined or null values.
 */
const formatEntry = (entry) => {
  for (const [key, value] of Object.entries(entry)) {
    entry[key] = value ?? "";
  }
  return entry;
};
/**
 * Handle cases for various errors in the worksheet for a model.
 */
const handleWorksheetError = async (
  migrationEntry,
  model,
  entry,
  errorType,
  errorName,
  errorMessage
) => {
  const modelName: string = model.replace(/_/g, " ");
  console.log(`${errorMessage} for model:`, modelName);

  migrationEntry.updatedAt = new Date();

  migrationEntry.errorLog.set(model, [
    ...(migrationEntry.errorLog.get(model) || []),
    {
      model: modelName,
      name: errorName,
      type: errorType,
      message: errorMessage,
      ...(entry ? { entryName: entry.name || entry.key } : {}),
    },
  ]);

  await migrationEntry.save();
};

/**
 * Log an error for a specific entry and update the migration entry.
 */
const logEntryError = async (migrationEntry, model, currentLocale, error) => {
  migrationEntry.errorLog.set(model, [
    ...(migrationEntry.errorLog.get(model) || []),
    {
      locale: currentLocale,
      error,
    },
  ]);
  migrationEntry.updatedAt = new Date();
  await migrationEntry.save();
};

// Determine migration status
const updateMigrationStatus = async (modelName, migrationEntry) => {
  const updatedEntry: any = await CsvUploadHistoryModel.findOne({
    _id: Types.ObjectId(migrationEntry._id),
  });

  console.log("Process finished for model:", modelName);

  updatedEntry.status = determineStatus(updatedEntry);
  updatedEntry.isLocked = false;
  updatedEntry.updatedAt = new Date();
  await updatedEntry.save();
};

// update migration entry
const updateMigrationEntry = async (
  migrationEntry,
  getContentFields,
  currentModel,
  currentModelHeaders,
  currentModelContents,
) => {
  const contentFields = new Set(
    getContentFields.fields.map((field) => field.id.toLowerCase().trim())
  );

  const localeCounts = currentModelContents.reduce((acc, item) => {
    const localeKey = item.locale || "Not defined";
    acc[localeKey] = (acc[localeKey] || 0) + 1;
    return acc;
  }, {});

  
  migrationEntry.totalEntryinCsv[currentModel] = localeCounts;

  const skippedFields = currentModelHeaders.filter(
    (key) =>
      key.toLowerCase().trim() !== "locale" && 
      !contentFields.has(key.toLowerCase().trim())
  );

  const modelSkippedFields = migrationEntry.skippedFields.get(currentModel) || [];
  migrationEntry.skippedFields.set(currentModel, [
    ...modelSkippedFields,
    ...skippedFields,
  ]);
  migrationEntry.markModified("totalEntryinCsv");


  return migrationEntry.save();
};

const extractDocumentData = (worksheet, headers) => {
  const normalizedHeaders = headers.map((header) =>
    header?.toLowerCase() === "locale" ? "locale" : header
  );

  return worksheet
    .slice(1)
    .map((row) =>
      normalizedHeaders.reduce((obj, header, index) => {
        const cellValue = row[index];
        if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
          obj[header] = cellValue;
        }
        return obj;
      }, {})
    )
    .filter((row) => Object.keys(row).length > 0);
};

const determineStatus = (entry) => {
  console.log("Process init: determineStatus", entry?._id);

  const {
    skippedFields,
    contentModels,
    errorLog,
  } = entry;

  const uploadCount: any = entry.uploadCount;
  const totalEntryinCsv: any = entry.totalEntryinCsv;


  let totalUploadCount = 0;
  let totalEntries = 0;
  let totalSkippedFields = 0;
  let totalErrorLogEntries = 0;

  for (const modelName of contentModels) {
    totalUploadCount += Object.values(uploadCount[modelName] || {}).reduce(
    (sum: number, count: any) => sum + count,
    0
  );
    totalEntries += Object.values(totalEntryinCsv[modelName] || {}).reduce(
      (sum: number, count: any) => sum + count,
      0
    );
    totalSkippedFields += (skippedFields.get(modelName) || []).length;
    totalErrorLogEntries += (errorLog.get(modelName) || []).length;
  }

  const allUploaded = totalUploadCount === totalEntries && totalEntries > 0;
  const anyProcessed = totalUploadCount > 0 || totalSkippedFields > 0;
  
  if (allUploaded) {
    return totalErrorLogEntries > 0 || totalSkippedFields > 0 ? "Partially completed" : "Completed";
  }
  return anyProcessed ? "Partially completed" : "Failed";
};

const processMediaFile = async (folderPath, migrationEntry) => {
  const [containerName, blobName] = parseAzureBlobPath(folderPath);

  return new Promise((resolve, reject) => {
    const contentAssets = [];
    const entryPromises: any = []; // Specify the type of the array elements

    // Download the file from Azure Blob Storage
    const blobStream = blobService.createReadStream(
      containerName,
      blobName,
      (error, result, response) => {
        if (error) {
          console.log("Error downloading blob:", error);
        }
      }
    );
    const fileNames: string[] = [];
    const fileContents: Buffer[] = [];
    blobStream
      .pipe(unzipper.Parse())
      .on("entry", (entry) => {
        const promise: any = new Promise(async (resolveEntry, rejectEntry) => {
          const fileName = entry.path.trim();
          const chunks: any = [];

          for await (const chunk of entry) {
            chunks.push(chunk);
          }

          const fileContent = Buffer.concat(chunks);

          fileNames.push(fileName);
          fileContents.push(fileContent);

          entry.autodrain();
          resolveEntry(undefined);
        });

        entryPromises.push(promise);
      })
      .on("finish", async () => {
        try {
          await Promise.all(entryPromises);

          await processImagesInChunks(
            fileNames,
            fileContents,
            contentAssets,
            migrationEntry
          );

          resolve(contentAssets);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

// Function to parse the Azure Blob Storage path for csv
const parseAzureBlobPath = (filePath) => {
  const url = new URL(filePath);
  const [containerName, ...blobPathParts] = url.pathname
    .split("/")
    .filter((part) => part);
  const blobName = blobPathParts.join("/");
  return [containerName, blobName];
};

// Helper function to get image fields map based on content model
const getDefaultFields = (assetContentFields, defaultFields) => {
  return assetContentFields.length
    ? assetContentFields.map((field) => field.id)
    : defaultFields;
};

const getImageFields = (contentModel, assetContentFields) => {
  const defaultFieldsMapping = {
    Email: { imageField: ["hero2imgUrls"], contentImageField: ["images"] },
    "In App Asset": { imageField: ["urls"], contentImageField: ["images"] },
    "Content Card Ex": {
      imageField: ["carouselCtaUrls"],
      contentImageField: ["images"],
    },
    "Home Feed KVPs": { imageField: ["url"], contentImageField: ["images"] },
    "Offer Card KVPs": { imageField: ["url"], contentImageField: ["images"] },
    "Testing Model": { imageField: ["url"], contentImageField: ["images"] }
  };

  const defaultFields = defaultFieldsMapping[contentModel] || {};
  return {
    imageField: getDefaultFields(
      assetContentFields,
      defaultFields.imageField || []
    ),
    contentImageField: getDefaultFields(
      assetContentFields,
      defaultFields.contentImageField || []
    ),
  };
};

// Helper function to create content payload
const processImagesInChunks = async (
  fileNames,
  fileContents,
  contentAssets,
  migrationEntry,
  chunkSize = 7
) => {
  // Split the arrays into chunks of size 7
  for (let i = 0; i < fileNames.length; i += chunkSize) {
    const chunk = fileNames.slice(i, i + chunkSize);
    const contentChunk = fileContents.slice(i, i + chunkSize);

    // Process the chunk in parallel
    await Promise.all(
      chunk.map(async (fileName, index) => {
        const fileContent = contentChunk[index];
        await processImageFields(
          fileName,
          fileContent,
          contentAssets,
          migrationEntry
        );
      })
    );

    // Delay between processing chunks to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
  }
};

// Helper function to process image fields
const processImageFields = async (
  fileName,
  buffer,
  contentAssets,
  migrationEntry
) => {
  const contentAsset = await BulkMigration.uploadImageToContentful(
    buffer,
    fileName,
    "en-US"
  );

  if (
    (contentAsset &&
      contentAsset.type === "error" &&
      contentAsset?.message?.response?.statusText !==
        "The specified blob does not exist.") ||
    !contentAsset
  ) {
    migrationEntry.updatedAt = new Date();
    migrationEntry.errorLog = contentAsset;
    return migrationEntry.save();
  }

  if (
    contentAsset !== "image" &&
    contentAsset?.message?.response?.statusText !==
      "The specified blob does not exist."
  ) {
    contentAssets.push(contentAsset);
  }
};

// Helper function to create content payload
const createContentPayload = async (
  contentFields,
  entry,
  getContentFields
) => {
  const payload = contentFields.reduce((acc, field) => {
    let newLocale = entry.locale;
    const csvFieldKey = Object.keys(entry).find(
      (key) => key.toLowerCase().trim() === field.toLowerCase().trim()
    );

    newLocale = getLocalization(getContentFields, field, newLocale);
    acc[field] = csvFieldKey
      ? { [newLocale]: entry[csvFieldKey] }
      : { [newLocale]: "" };
    return acc;
  }, {});

  return payload;
};
// getLocalization function
const getLocalization = (getContentFields, field, newLocale) => {
  const localizationEntry = getContentFields.fields.find(
    (item) => item.id === field
  );
  if (!localizationEntry.localized) {
    newLocale = "en-US";
  }
  return newLocale;
};

// Helper function to add image assets to content payload
const addImageAssetsToPayload = (
  contentPayload,
  contentImageFields,
  contentAssets,
  currentEntry,
  getContentFields
) => {
  for (const contentImageField of contentImageFields) {
    const updateAsset = contentAssets.find((item) => {
      const imageMap =
        item.fields?.file?.["en-US"]?.fileName?.split(".")[0] ===
        currentEntry[contentImageField]?.split(".")[0];

      return imageMap || "";
    });

    const entryField = getContentFields.fields.find(
      (item) => item.id === contentImageField
    );
    const assignLocale = entryField.localized ? currentEntry.locale : "en-US";
    if (updateAsset) {
      contentPayload[contentImageField] = {
        [assignLocale]: {
          sys: {
            type: "Link",
            linkType: "Asset",
            id: updateAsset.sys.id,
          },
        },
      };
    } else {
      delete contentPayload[contentImageField];
    }
  }
};

const processEntry = async (
  migrationEntry,
  getContentFields,
  contentAssets,
  currentModel,
  currentEntry,
) => {
  const currentModelName = currentModel.split("_").join(" ");
  console.log("Process entry started", currentModel);
  const keyFields = getContentFields.displayField;
  const assetContentFields = getContentFields.fields.filter(
    (field) => field.linkType === "Asset"
  );
  const entryField = getContentFields.fields.find(
    (item) => item.id === keyFields
  );

  const contentFields = getContentFields.fields.map((field) => field.id);

  const imageFieldsMap = getImageFields(currentModelName, assetContentFields);

  const contentPayload = await createContentPayload(
    contentFields,
    currentEntry,
    getContentFields
  );

  addImageAssetsToPayload(
    contentPayload,
    imageFieldsMap.contentImageField,
    contentAssets,
    currentEntry,
    getContentFields
  );

  let reqdEntry;
  const tempEntry = {};
  Object.keys(currentEntry).forEach((key) =>
    Object.assign(tempEntry, { [key.trim()]: currentEntry[key] })
  );
  currentEntry = tempEntry;

  for (const key in currentEntry) {
    if (key.toLowerCase() === keyFields.toLowerCase()) {
      reqdEntry = currentEntry[key];
    }
  }

  if (reqdEntry) {
    contentPayload[keyFields][currentEntry.locale] = reqdEntry;
    if (!entryField.localized) {
      contentPayload[keyFields]["en-US"] = reqdEntry;
    }
    const contentfulEntryData = await BulkMigration.checkEntryExists(
      keyFields,
      reqdEntry,
      getContentFields.sys.id
    );

    if (
      contentfulEntryData.type === "error" ||
      !contentfulEntryData ||
      contentfulEntryData?.length === 0
    ) {
      const createContentData = await BulkMigration.createEntry(
        currentModelName,
        contentPayload
      );

      await handleCreateEntryError(
        createContentData,
        migrationEntry,
        reqdEntry,
        currentModel,
        currentEntry.locale,
      );
    } else {
      await handleUpdateEntryError(
        contentPayload,
        migrationEntry,
        reqdEntry,
        getContentFields,
        contentfulEntryData,
        currentModel,
        currentEntry,
      );
    }
  } else {
    const createContentData = await BulkMigration.createEntry(
      currentModel,
      contentPayload
    );

    await handleCreateEntryError(
      createContentData,
      migrationEntry,
      reqdEntry,
      currentModel,
      currentEntry.locale,
    );
  }
  return migrationEntry;
};

const handleCreateEntryError = async (
  createContentData,
  migrationEntry,
  reqdEntry,
  currentModel,
  currentLocale,
) => {
  if (
    (createContentData && createContentData.type === "error") ||
    !createContentData
  ) {
    createContentData.message.entryName = reqdEntry;

    const tempError = createContentData.message || createContentData;
    migrationEntry.errorLog.set(currentModel, [
      ...(migrationEntry.errorLog.get(currentModel) || []),
      {locale: currentLocale, ...tempError},
    ]);

    migrationEntry.updatedAt = new Date();
    migrationEntry.comments = "Failed. Error in creating an entry in Contentful";

    migrationEntry.markModified("errorLog");
    return migrationEntry.save();
  } else {
    if (!migrationEntry.uploadCount) {
      migrationEntry.uploadCount = {};
  }
  
  if (!migrationEntry.uploadCount[currentModel]) {
      migrationEntry.uploadCount[currentModel] = {};
  }
  
  migrationEntry.uploadCount[currentModel][currentLocale] = 
      (migrationEntry.uploadCount[currentModel][currentLocale] || 0) + 1;
    migrationEntry.markModified("uploadCount");
  }
};

const handleUpdateEntryError = async (
  contentPayload,
  migrationEntry,
  reqdEntry,
  getContentFields,
  contentfulEntryData,
  currentModel,
  entry,
) => {
  const updateContentData = await BulkMigration.updateEntry(
    migrationEntry.contentModel,
    contentPayload,
    contentfulEntryData?.sys.id,
    getContentFields,
    entry.locale
  );
  if (
    (updateContentData && updateContentData.type === "error") ||
    !updateContentData
  ) {
    updateContentData.message.entryName = reqdEntry;
    const tempError = updateContentData.message || updateContentData;
    migrationEntry.errorLog.set(currentModel, [
      ...(migrationEntry.errorLog.get(currentModel) || []),
      {locale: entry.locale, ...tempError},
    ]);
    migrationEntry.updatedAt = new Date();
    migrationEntry.comments = "Failed. Error in creating an entry in Contentful";

    migrationEntry.markModified("errorLog");
    return migrationEntry.save();
  } else {
    if (!migrationEntry.uploadCount) {
      migrationEntry.uploadCount = {};
  }
  
  if (!migrationEntry.uploadCount[currentModel]) {
      migrationEntry.uploadCount[currentModel] = {};
  }
  
  migrationEntry.uploadCount[currentModel][entry.locale] = 
      (migrationEntry.uploadCount[currentModel][entry.locale] || 0) + 1;
    migrationEntry.markModified("uploadCount");

    return migrationEntry.save();
  }
};
