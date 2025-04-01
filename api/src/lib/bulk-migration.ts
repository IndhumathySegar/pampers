import { get } from "lodash";
import { createBlobService } from "azure-storage";
import { PassThrough, Readable } from "stream";
import unzipper from "unzipper";
import { createClient } from "contentful-management";

const CONTENTFUL_MIGRATION_STORAGE_CONN_STRING = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_CONN_STRING"
)!;
const CONTENTFUL_MIGRATION_STORAGE_CONTAINER = get(
  process.env,
  "BULK_MIGRATION_STORAGE_CONTAINER"
)!;

const CONTENTFUL_MIGRATION_STORAGE_BASE_URL = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_BASE_URL"
)!;
const CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY"
)!;

const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "CONTENTFUL_ENVIRONMENT_BACKUP"
)!;

const CRM_UAT = get(process.env, "CRM_UAT")!;

const blobService = createBlobService(CONTENTFUL_MIGRATION_STORAGE_CONN_STRING);

class BulkMigration {
  private client;

  constructor() {
    this.client = createClient({
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
      timeout: 300000,
    });
  }

  /**
   * push to blob
   * @param {string} path file path
   * @param {string} content content
   * @returns {Promise<string>} File path URL
   */
  async pushToBlob(path: string, content: Buffer, contentType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a readable stream from the provided content buffer
      const stream = new Readable({
        read() {
          this.push(content);
          this.push(null);
        },
      });
      // Upload the stream to the blob storage
      blobService.createBlockBlobFromStream(
        CONTENTFUL_MIGRATION_STORAGE_CONTAINER, // The container where the file will be stored
        path, // The path within the container
        stream, // The readable stream containing the file content
        content.length, // The length of the content
        {
          contentSettings: {
            // Set the content type based on the file extension
            contentType,
          },
        },
        (err: any) => {
          if (err) {
            return reject(err.message);
          }
          resolve(
            `${CONTENTFUL_MIGRATION_STORAGE_BASE_URL}/${CONTENTFUL_MIGRATION_STORAGE_CONTAINER}/${path}`
          );
        }
      );
    });
  }

  /**
   * extract the zip file
   * @param {Readable} zipStream zip file stream
   * @param {string} zipFileName name of the zip file
   * @returns {Promise<string>} Folder URL
   */
  async unzipAndPushToBlob(
    zipStream: Readable,
    zipFileName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadPromises: Promise<string>[] = [];

      zipStream
        .pipe(unzipper.Parse())
        .on("entry", (entry: any) => {
          const fileName = entry.path;
          const fileType = entry.type;

          if (fileType === "File") {
            const chunks: Buffer[] = [];

            entry.on("data", (chunk: Buffer) => {
              chunks.push(chunk);
            });

            entry.on("end", () => {
              const fileBuffer: any = Buffer.concat(chunks);
              const filePath = `${zipFileName}/${fileName}`;

              const uploadPromise = this.pushToBlob(filePath, fileBuffer, "image/png");

              uploadPromises.push(uploadPromise);
            });
          } else {
            entry.autodrain();
          }
        })
        .on("finish", () => {
          // Wait for all upload promises to complete before resolving
          Promise.all(uploadPromises)
            .then(() =>
              resolve(
                `${CONTENTFUL_MIGRATION_STORAGE_BASE_URL}/${CONTENTFUL_MIGRATION_STORAGE_CONTAINER}/${zipFileName}`
              )
            )
            .catch(reject);
        })
        .on("error", (err: any) => reject(err.message));
    });
  }

  /**
   * create contentModel properties.
   */
  async createContentModelProperties(contentTypeId) {
    try {
      const mapping = {
        Email: "email",
        "In App Asset": "inAppAsset",
        "Content Card Ex": "contentCardEx",
        "Home Feed KVPs": "contentCardForKvPs",
        "Offer Card KVPs": "offerCardKvPs",
        "Testing Model": "testingModel"
      };
      contentTypeId = mapping[contentTypeId] || contentTypeId;

      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(
        CRM_UAT
      );
      const contentModel = await environment.getContentTypes({
        "sys.id": contentTypeId,
      });

      const contentType = contentModel.items[0];
      const fieldIds = contentType;
      return fieldIds;
    } catch (error) {
      console.log(error, "mapping error");
    }
  }

  /**
   * Upload image to contentful
   */
  async uploadImageToContentful(entry, name, locale) {
    if (!name) { return "image"; }
  
    const retryDelay = 2000; // 2 seconds delay
    const maxRetries = 2; // maximum number of retries
  
    try {
      const [ fileName, fileType ] = name.split(".");
      const environment = await this.getContentfulEnvironment();
  
      let asset = await this.findExistingAsset(environment, name);
      if (!asset) {
        asset = await this.createAndProcessAsset(environment, entry, fileName, fileType, locale, retryDelay, maxRetries);
      }

      return await asset.publish();
    } catch (error) {
      console.log(error, "uploading error");
      return { type: "error", message: error.message };
    }
  }
  
  /**
   * Get contentful environment
   */
   
  async getContentfulEnvironment() {
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
    return space.getEnvironment(CRM_UAT);
  }
  
  /**
   * finds and returns if an asset already exists on the contentful
   * 
   * @param {any} environment contenful environment
   * @param {string} name file name
   * @returns {any[]} existing assets on contentful
   */
  async findExistingAsset(environment, name) {
    const assets = await environment.getAssets();
    return assets.items.find((item) => {
      const assetFile = item?.fields?.file?.["en-US"];
      return assetFile?.fileName.trim() === name.trim();
    });
  }

  /**
   * creates and processes the asset
   * 
   * @param environment contentful environment
   * @param entry entry to be uploaded
   * @param fileName filename of the asset
   * @param fileType file type of the asset
   * @param locale locale of the asset
   * @param retryDelay delay between the retries
   * @param maxRetries max number of retries to be performed
   * @returns published asset
   */
  
  async createAndProcessAsset(environment, entry, fileName, fileType, locale, retryDelay, maxRetries) {
    const upload = await this.uploadFile(environment, entry, fileName);
    const asset = await this.createAsset(environment, upload.sys.id, fileName, fileType, locale);
  
    await this.processAssetWithRetries(asset, retryDelay, maxRetries);
    return environment.getAsset(asset.sys.id);
  }
  
  /**
   * uploads the file to the given environment on contentful
   *  
   * @param environment contentful environment
   * @param entry entry to be uploaded
   * @param fileName file name of the asset
   * @returns 
   */
  async uploadFile(environment, entry, fileName) {
    return environment.createUpload({
      fileName,
      file: Buffer.from(entry, "binary"),
    });
  }
  
  /**
   * creates asset on the contentful with the provided data
   *  
   * @param environment contentful environment
   * @param uploadId id of the file to be uploaded
   * @param fileName file name
   * @param fileType file type 
   * @param locale locale
   * @returns created asset
   */
  async createAsset(environment, uploadId, fileName, fileType, locale) {
    const newPayload = this.createFilePayload(uploadId, fileName, fileType, locale);
    const title = this.createTitle(fileName, locale);
  
    return environment.createAsset({
      fields: {
        title,
        file: newPayload,
      },
    });
  }
  
  /**
   * creates payload for the file to be uploaded
   * 
   * @param uploadId id of the file to be uploaded
   * @param fileName file name
   * @param fileType file type
   * @param locale locale of the entry to be uploaded
   * @returns payload required for the upload
   */
  createFilePayload(uploadId, fileName, fileType, locale) {
    const payload = {
      [locale]: {
        contentType: `image/${fileType}`,
        fileName,
        uploadFrom: {
          sys: {
            type: "Link",
            linkType: "Upload",
            id: uploadId,
          },
        },
      },
    };
  
    if (locale !== "en-US") {
      payload["en-US"] = {
        contentType: `image/${fileType}`,
        fileName,
        uploadFrom: {
          sys: {
            type: "Link",
            linkType: "Upload",
            id: uploadId,
          },
        },
      };
    }
  
    return payload;
  }

  /**
   * Creates a title object for the file based on the provided locale.
   * 
   * @param {string} fileName name of the file to be uploaded
   * @param {string} locale locale of the entry
   * @returns {string} title of the file
   */
  
  createTitle(fileName, locale) {
    const title = { [locale]: fileName };
    if (locale !== "en-US") {
      title["en-US"] = fileName;
    }
    return title;
  }
  
  /**
   * processes the assets
   * 
   * @param asset asset to be uploaded
   * @param retryDelay delay time between the retries
   * @param maxRetries max number of retries
   * @returns 
   */

  async processAssetWithRetries(asset, retryDelay, maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await asset.processForAllLocales();
        return;
      } catch (error) {
        if (attempt === maxRetries) { throw error; }
        console.log(`Processing attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  

  /**
   * get Entry in contentful
   */

  async checkEntryExists(field, value, contentType) {
    try {
      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(
        // CONTENTFUL_ENVIRONMENT_BACKUP
        CRM_UAT
      );

      const response = await environment.getEntries({
        content_type: contentType,
        [`fields.${field}`]: value,
      });

      if (response.items.length > 0) {
        console.log("Entries found:");
        return response.items[0];
      } else {
        console.log("No entries found with the specified field value.");
        return [];
      }
    } catch (error) {
      console.error("Error in fetching entry:", error);
      return { type: "error", message: error };
    }
  }

  /**
   * Create Entry in contentful
   */
  async createEntry(contentType, payload) {
    try {
      const mapping = {
        Email: "email",
        "In App Asset": "inAppAsset",
        "Content Card Ex": "contentCardEx",
        "Home Feed KVPs": "contentCardForKvPs",
        "Offer Card KVPs": "offerCardKvPs",
        "Testing Model": "testingModel"
      };
      const mappedContentType  = mapping[contentType] || contentType;

      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(

        CRM_UAT

      );

      const entry = await environment.createEntry(mappedContentType , {
        fields: payload,
      });
      
      try {
        await entry.publish();
      } catch (publishError) {
        console.error("Error during publish:", publishError);
        return { type: "error",  message: publishError };
      }
      return await environment.getEntry(entry.sys.id);
    } catch (error) {
      return { type: "error",  message: error };
    }
  }

  /**
   * Update Entry in contentful
   */
  async updateEntry(contentType, payload, entryId, contentFields, locale) {
    try {
      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(

        CRM_UAT

      );
      const entry = await environment.getEntry(entryId);

      Object.keys(payload).forEach((field) => {
        const localizationEntry = contentFields.fields.find(
          (item) => item.id === field
        );
        if (payload[field] && entry.fields[field]) {
          if (localizationEntry.localized) {
            entry.fields[field][locale] = payload[field][locale];
          } else {
            entry.fields[field]["en-US"] = payload[field]["en-US"];
          }
        }
      });

      const updatedEntry = await entry.update();
      return await updatedEntry.publish();
    } catch (error) {
      return { type: "error", message: error };
    }
  }

  /**
   * Date format
   */
  async formatDate(date) {
    const pad = (data) => (data < 10 ? `0${data}` : data);

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are zero-indexed
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}-${month}-${year}-${hours}:${minutes}:${seconds}`;
  }

  /**
   * get folder file azure
   */
  async listFilesInFolder(file) {
    return new Promise((resolve, reject) => {
      let blobs = [];
      let continuationToken: any = null;

      const listBlobs = () => {
        blobService.listBlobsSegmentedWithPrefix(
          CONTENTFUL_MIGRATION_STORAGE_CONTAINER,
          file,
          continuationToken,
          (error, result: any) => {
            if (error) {
              console.error("Error listing blobs:", error);
              reject(error);
              return;
            }

            blobs = blobs.concat(result.entries.map((entry) => entry.name));
            continuationToken = result.continuationToken;

            if (continuationToken !== null) {
              listBlobs(); // Continue listing blobs recursively if there are more
            } else {
              resolve(blobs);
            }
          }
        );
      };

      listBlobs(); // Start listing blobs
    });
  }

  /**
   * get folder file azure
   */
  async processExcelFile(fileName: string, res: any) {
    try {
      blobService.getBlobProperties(CONTENTFUL_MIGRATION_STORAGE_CONTAINER, fileName, (error, properties) => {
        if (error) {
          console.error("Error checking blob properties:", error);
          return res.status(404).send("File not found");
        }
  
        res.status(200)
          .header("Content-Type", "application/octet-stream")
          .header("Content-Disposition", `attachment; filename=${fileName}`);
  
        const blobDownloadStream = blobService.createReadStream(CONTENTFUL_MIGRATION_STORAGE_CONTAINER, fileName, (streamError) => {
          if (streamError) {
            return res.status(404).send("Unexpected error occurred");
           }
        });
  
        blobDownloadStream.pipe(res);
      });
    } catch (catchError) {
      console.error("Unexpected error:", catchError);
      res.status(500).send("Unexpected error occurred");
    }
  }
  

  /**
   * get folder file azure
   */
  async processZipMediaFile  (folderDownloadPath)  {
    const [containerDownloadName, blobDownloadName] =  this.parseAzureBlobDownloadPath(folderDownloadPath);
  
    return new Promise((resolve, reject) => {
      const entryDownloadPromises: any = [];
  
      // Download the file from Azure Blob Storage
      const blobDownloadStream = blobService.createReadStream(
        containerDownloadName,
        blobDownloadName,
        (error, result, response) => {
          if (error) {
            console.log("Error downloading blob:", error);
          }
        }
      );
  
      const fileDownloadNames: string[] = [];
      const fileDownloadContents: Buffer[] = [];
  
      // Process ZIP entries
      blobDownloadStream
        .pipe(unzipper.Parse())
        .on("entry", (entryDownload) => {
          const promiseDownload: any = new Promise(async (resolveEntry, rejectEntry) => {
            const fileDownloadName = entryDownload.path.trim();
            const chunksDownload: any = [];
  
            for await (const chunk of entryDownload) {
              chunksDownload.push(chunk);
            }
  
            const fileDownloadContent = Buffer.concat(chunksDownload);
  
            // Accumulate file names and contents
            fileDownloadNames.push(fileDownloadName);
            fileDownloadContents.push(fileDownloadContent);
  
            entryDownload.autodrain();
            resolveEntry(undefined);
          });
  
          entryDownloadPromises.push(promiseDownload);
        })
        .on("finish", async () => {
          try {
            // Wait for all ZIP entries to be processed
            await Promise.all(entryDownloadPromises);
  
            // Convert file contents to Base64
            const filesDownload = fileDownloadNames.map((fileName, index) => ({
              fileName,
              content: fileDownloadContents[index].toString("base64"), // Convert to Base64
            }));
  
            resolve(filesDownload); // Resolve the main promise with Base64-encoded files
          } catch (error) {
            reject(error);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }
  /**
   * get folder file azure
   */
 parseAzureBlobDownloadPath (fileDownloadPath)  {
    const url = new URL(fileDownloadPath);
    const [containerName, ...blobPathParts] = url.pathname
      .split("/")
      .filter((part) => part);
    const blobName = blobPathParts.join("/");
    return [containerName, blobName];
  }

  /**
   * get folder file from azure
   */
  async getBlobContent(container, blobName) {
    return new Promise((resolve, reject) => {
      const passThroughStream = new PassThrough();

      blobService.getBlobToStream(
        container,
        blobName,
        passThroughStream,
        (error, result) => {
          if (error) {
            reject(error);
          }
        }
      );

      resolve(passThroughStream);
    });
  }
}

export default new BulkMigration();
