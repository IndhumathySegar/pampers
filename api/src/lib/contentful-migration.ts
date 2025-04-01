import axios from "axios";
import * as contentful from "contentful-management";
import { get, isArray } from "lodash";
import { createBlobService } from "azure-storage";
import contentfulExport from "contentful-export";
import contentfulImport from "contentful-import";
import fetch from "node-fetch";
import moment from "moment";
import { Types } from "mongoose";
import { v4 as uuid } from "uuid";
import contentfulHelper from "../components/ContentfulController/contentful.helper";


import Contentful from "./contentful";
import contentModelUtil from "../utils/content-migration-util";

// entities
import ContentfulMigrationModel from "../entities/contentful-migration";

// interfaces
import {
  IExport,
  IExportOpt,
  IImport,
  IContent,
} from "../interfaces/iContentful";
import { IContentfulMigration } from "../entities/interfaces/iContentfulMigration";


const CONTENTFUL_MIGRATION_STORAGE_CONN_STRING = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_CONN_STRING"
)!;
const CONTENTFUL_MIGRATION_STORAGE_CONTAINER = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_CONTAINER"
)!;

const CONTENTFUL_BACKUP_SAS_KEY = get(
  process.env,
  "CONTENTFUL_BACKUP_SAS_KEY"
)!;

const CONTENTFUL_MIGRATION_BACKUP_STORAGE_CONTAINER = get(
  process.env,
  "CONTENTFUL_MIGRATION_BACKUP_STORAGE_CONTAINER"
)!;
const CONTENTFUL_MIGRATION_STORAGE_BASE_URL = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_BASE_URL"
)!;
const CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY = get(
  process.env,
  "CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY"
)!;
const CONTENTFUL_MAX_ALLOWED_LIMIT = get(
  process.env,
  "CONTENTFUL_MAX_ALLOWED_LIMIT",
  1000
);

const CONTENTFUL_INCLUDE_DRAFT_CONTENT = get(
  process.env,
  "CONTENTFUL_INCLUDE_DRAFT_CONTENT"
)!;
const CONTENTFUL_INCLUDE_ARCHIVED_CONTENT = get(
  process.env,
  "CONTENTFUL_INCLUDE_ARCHIVED_CONTENT"
)!;

const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const blobService = createBlobService(CONTENTFUL_MIGRATION_STORAGE_CONN_STRING);

const client = contentful.createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
});

class ContentfulMigration extends Contentful {
  constructor() {
    super();
  }

  /**
   * Migrate content from one environment to another.
   * @param {IContentfulMigration} task Migration task data.
   * @returns {Promise<void>} Promise that resolves when migration is complete.
   */
  async migrate(task: IContentfulMigration): Promise<void> {
    const { _id, spaceId, managementToken, from, to, query, isRollBack } = task;
    const currentTime = moment.now();

    try {
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "content type syncing" } }
      ).exec();

      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "content exporting" } }
      ).exec();

      // Export source
      const contents: any = await this.export({
        _id,
        spaceId,
        env: from,
        managementToken,
        query,
        currentTime,
        envType: "source",
      });

      const contentData: any = await this.getContent(contents[0].exportContent);

      // 2. Extract content IDs from the fetched content
      const contentIdsToMigrate = contentData.entries.map(
        (content) => content.sys.id
      );
      // 3. Backup the destination content that matches the IDs to be migrated

      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "content fetching" } }
      ).exec();

      // Import source to destination
      await this.import({
        _id,
        spaceId,
        env: to,
        source: from,
        managementToken,
        contents: contentData,
        currentTime,
        contentModels: task.contentModels,
        localesToMigrate: task.localesToMigrate,
        contentIdsToMigrate,
        isRollBack,
        query,
      });

      // Change status to success
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "success" } }
      ).exec();
    } catch (ex: any) {
      try {
        console.log(ex, "error");

        await ContentfulMigrationModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status: "failed", error: ex.message || "Unknown error" } }
        ).exec();
      } catch (_: any) {}
    }
  }

  /**
   * Migrate content from one environment to another.
   * @param {IContentfulMigration} task Migration task data.
   * @returns {Promise<void>} Promise that resolves when migration is complete.
   */
  async migrateBackupRestore(task: IContentfulMigration): Promise<void> {
    const {
      _id,
      spaceId,
      managementToken,
      from,
      to,
      backupFilePath = "",
      sourceExport = [],
    } = task;
    const currentTime = moment.now();

    try {
      task.environmentId = to;

      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { rollbackStatus: "content exporting" } }
      ).exec();

      // Export source
      const contents: any = await this.getContent(
        `${backupFilePath}${CONTENTFUL_BACKUP_SAS_KEY}`
      );

      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { rollbackStatus: "content importing" } }
      ).exec();

      // Import source to destination
      await this.destinationImport({
        _id,
        spaceId,
        env: to,
        source: from,
        managementToken,
        contents,
        currentTime,
        contentModels: task.contentModels,
        localesToMigrate: task.localesToMigrate,
      });

      // Export source
      const fromData: any = await this.getContent(
        `${sourceExport[0]?.exportContent}${CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY}`
      );

      const toEnvironment = await this.getEnvironment({
        spaceId,
        environmentId: to,
      });

      for (const item of fromData.entries) {
        const existRecord = contents.entries.find(
          (data) => data.sys.id === item.sys.id
        );

        if (!existRecord) {
          try {
            const entryData = await toEnvironment.getEntry(item.sys.id);
            await entryData.unpublish();
          } catch (error) {
            console.error(`Error unpublishing entry ${item.sys.id}:`, error);
          }
        }
      }

      // Change status to success
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { rollBackStatus: "success" } }
      ).exec();
    } catch (ex: any) {
      try {
        console.log(ex, "error");

        await ContentfulMigrationModel.updateOne(
          { _id: Types.ObjectId(_id) },
          {
            $set: {
              rollBackStatus: "failed",
            },
          }
        ).exec();
      } catch (_: any) {}
    }
  }
  /**
   * Read a blob's content as text from Azure Blob Storage.
   * @param {string} containerName The name of the container.
   * @param {string} blobName The name of the blob.
   * @returns {Promise<string>} Promise that resolves to the blob's content.
   */
  readBlobUsingPath(containerName: string, blobPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Read the blob content as text
      blobService.getBlobToText(
        containerName,
        blobPath,
        (error, result, response) => {
          if (!error) {
            console.log("Blob content read successfully");
            resolve(result);
          } else {
            console.error("Error reading blob content:", error);
            reject(error);
          }
        }
      );
    });
  }
  /**
   * Backup only the content that will be modified in the destination environment.
   * @param {IContentfulMigration} task Migration task data.
   * @param {Array<string>} contentIds List of content IDs that will be modified.
   * @returns {Promise<IContent[]>} Promise that resolves to an array of backed-up content.
   */
  async backupChangedContent(
    task,
    contentIds: string[],
    filteredContentTypes,
    destinationEntries,
    query,
    contentModels
  ): Promise<any> {
    const { spaceId, env = "dev-master-content", _id } = task;
    try {
      // Fetch the content from the destination that matches the IDs of the content to be migrated
      // Utility function to add a delay

      const backupContent: any = [];

      contentIds.forEach((contentId) => {
        let backupData;
        if (query.includeTags || query.excludeTags) {
          backupData = destinationEntries.find(
            (item) => item.sys.id === contentId
          );
        } else {
          backupData = destinationEntries.find(
            (item) =>
              item.sys.id === contentId &&
              contentModels.some(
                (modelId) => modelId === item.sys.contentType.sys.id
              )
          );
        }

        if (backupData) {
          backupContent.push(backupData);
        }
      });

      const currentTime = moment.now();

      const backupFilePath = `backup/${spaceId}/${env}/${_id}/${currentTime}/backup/${uuid()}.json`;
      // Save the backup to a file
      const backupFileURL = await this.saveBackupToFile(backupFilePath, {
        contentTypes: filteredContentTypes,
        entries: backupContent,
      });

      console.log(
        `Backup of changed content completed. Stored at ${backupFilePath}`
      );
      return backupFileURL;
    } catch (error) {
      console.error("Backup of changed content failed", error);
      throw new Error("Failed to backup changed content");
    }
  }
  /**
   * Fetch content from the destination environment by content ID.
   * @param {string} spaceId Contentful space ID.
   * @param {string} env Contentful environment.
   * @param {string} contentId ID of the content to fetch.
   * @param {string} managementToken Contentful management token.
   * @returns {Promise<IContent>} Promise that resolves to the fetched content.
   */
  async fetchContentFromDestination(
    spaceId: string,
    environment,
    contentId: string,
    managementToken: string
  ): Promise<any> {
    try {
      // Fetch the entry or asset from the destination
      const content = await environment.getEntry(contentId);
      return content;
    } catch (error) {
      console.error(
        `Failed to fetch content with ID ${contentId} from destination`,
        error
      );
      throw new Error(`Failed to fetch content with ID ${contentId}`);
    }
  }
  /**
   * Save the backup content to a file.
   * @param {string} filePath Path where the backup will be saved.
   * @param {IContent[]} backupContent Array of content to be backed up.
   * @returns {Promise<void>} Promise that resolves when the backup is saved.
   */
  async saveBackupToFile(filePath: string, backupContent): Promise<any> {
    const file = await this.pushToBlob(
      filePath,
      backupContent,
      CONTENTFUL_MIGRATION_BACKUP_STORAGE_CONTAINER
    );
    console.log(`Backup saved to ${filePath}`);
    return file;
  }

  /**
   * Fetch all locales for a given environment.
   * @param {task} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to an array of locales.
   */
  async fetchAllEntryLocales(spaceId, environmentId, accessToken) {
    const baseUrl = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/locales?limit=1000`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const url = baseUrl;

    const response = await fetch(url, { headers });
    const data = await response.json();
    return data.items.map(locale => locale.code);

  }

  /**
   * Fetch all locales for a given environment.
   * @param {task} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to an array of locales.
   */
  async fetchAllLocales(task, localeToEntryIdMap) {
    task.environmentId = task.source;
    const environment: any = await this.getEnvironment(task);

    const query: any = {
      content_type: "region",
      order: "fields.name", // Assuming "name" is the field you want to order by
      "sys.archivedAt[exists]": false,
      "sys.publishedAt[exists]": true,
      limit: 1000,
    };

    const { items } = await environment.getEntries(query);

    // Filter out entries with empty fields
    const filteredRegionItems = items.filter((region) => {
      const name = region.fields?.name?.["en-US"];
      const code = region.fields?.code?.["en-US"];

      return name !== undefined && code !== undefined;
    });

    console.log("filteredRegionItems", filteredRegionItems);

    return filteredRegionItems.map((region) => {
      const locale = region.fields.code["en-US"];
      const id = region.sys.id;
      localeToEntryIdMap.set(locale, id);
      return region.fields.code["en-US"];
    });
  }

  /**
   * Fetch all locales for a given environment.
   * @param {task} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to an array of locales.
   */
  async fetchAllCountries(task) {
    task.environmentId = task.source;
    const countryEntryMap = new Map<string, string>();

    const environment: any = await this.getEnvironment(task);

    const query: any = {
      content_type: "country",
      order: "fields.code", // Assuming "name" is the field you want to order by
      "sys.archivedAt[exists]": false,
      "sys.publishedAt[exists]": true,
      limit: 1000,
    };

    const { items } = await environment.getEntries(query);

    items.map((countryData) => {
      const code = countryData.fields.code["en-US"];
      const id = countryData.sys.id;
      countryEntryMap.set(code, id);
    });

    return { countryEntryMap, allCountries: items };
  }

  /**
   * Retrieve a Contentful environment.
   * @param {task} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to the environment.
   */
  async getEnvironment(task) {
    const { spaceId, environmentId } = task;
    const space = await client.getSpace(spaceId);
    const environment = await space.getEnvironment(environmentId);
    return environment;
  }

  /**
   * Fetch all entries from a Contentful environment, handling pagination.
   * @param {any} environment Contentful environment instance.
   * @returns {Promise<any[]>} Promise that resolves to an array of all entries.
   */
  async getAllEntries(environment: any): Promise<any[]> {
    const entries: any = [];
    let skip = 0;
    const limit = 100;

    while (true) {
      const response: any = await environment.getEntries({
        skip,
        limit,
      });

      entries.push(...response.items);

      if (response.items.length < limit) {
        break; // Exit loop when there are no more entries to fetch
      }

      skip += limit;
    }

    return entries;
  }

  /**
   * Fetch entry IDs for 'region' content type by locale.
   * @param {any} environment Contentful environment instance.
   * @param {string[]} locales Locales to fetch region entries for.
   * @returns {Promise<Map<string, string>>} A map of locale to entry ID.
   */
  async fetchRegionEntriesByLocale(
    environment: any,
    locales: string[]
  ): Promise<Map<string, string>> {
    const localeToEntryIdMap = new Map<string, string>();

    for (const locale of locales) {
      try {
        const response = await environment.getEntries({
          content_type: "region", // Assuming the content type ID is 'region'
          "fields.code": locale, // Adjust field name if necessary
          limit: 1,
        });

        if (response.items.length > 0) {
          const entryId = response.items[0].sys.id;
          localeToEntryIdMap.set(locale, entryId);
          console.log(
            `Locale ${locale} is mapped to region entry ID: ${entryId}`
          );
        } else {
          console.log(`No region entry found for locale ${locale}`);
        }
      } catch (error) {
        console.error(
          `Error fetching region entry for locale ${locale}:`,
          error
        );
      }
    }

    return localeToEntryIdMap;
  }

  /**
   * Filter content for migration.
   * @param {content} content Exported content data.
   * @param {string[]} contentTypesToMigrate List of content types to migrate.
   * @param {task} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to filtered content.
   */
  async filterContent(content, contentTypesToMigrate, task) {
    let filteredContent: any = {
      contentTypes: [],
      entries: [],
      assets: content.assets,
      locales: content.locales,
      webhooks: content.webhooks,
      roles: content.roles,
      tags: content.tags,
      editorInterfaces: content.editorInterfaces,
    };

    let entriesToInclude = new Set();
    const processedContentTypes = new Set(contentTypesToMigrate);

    const { source } = task;
    task.environmentId = source;
    const environment = await this.getEnvironment(task);

    // Recursively find linked content types and add them to the list
    const findLinkedContentTypes = async (entry, depth = 0) => {
      let linkedContentTypes = new Set();
      for (const fieldValue of Object.values(entry.fields)) {
        if (typeof fieldValue === "object" && fieldValue !== null) {
          for (const localeValue of Object.values(fieldValue)) {
            linkedContentTypes = await localeSelection(
              linkedContentTypes,
              localeValue,
              depth
            );
          }
        }
      }
      return linkedContentTypes;
    };

    const localeSelection = async (linkedContentTypes, localeValue, depth) => {
      if (Array.isArray(localeValue)) {
        for (const link of localeValue) {
          if (
            link.sys &&
            link.sys.type === "Link" &&
            link.sys.linkType === "Entry"
          ) {
            const linkedEntry = await environment
              .getEntry(link.sys.id)
              .catch(() => null);
            if (
              linkedEntry &&
              !processedContentTypes.has(linkedEntry.sys.contentType.sys.id)
            ) {
              linkedContentTypes.add(linkedEntry.sys.contentType.sys.id);
              processedContentTypes.add(linkedEntry.sys.contentType.sys.id);
              console.log(
                `Added linked content type at depth ${depth}: ${linkedEntry.sys.contentType.sys.id}`
              );
              const nestedLinkedContentTypes = await findLinkedContentTypes(
                linkedEntry,
                depth + 1
              );
              nestedLinkedContentTypes.forEach((ct) =>
                linkedContentTypes.add(ct)
              );
            }
          }
        }
      }
      return linkedContentTypes;
    };

    // Process initial entries and find linked content types
    const processEntries = async () => {
      const initialEntries = content.entries.filter((entry) =>
        contentTypesToMigrate.includes(entry.sys.contentType.sys.id)
      );

      const { filterNewData, entriesValue } = await rearrangeEntries(
        initialEntries
      );

      filteredContent = filterNewData;

      entriesToInclude = entriesValue;

      // Filter content types based on the updated contentTypesToMigrate array
      filteredContent.contentTypes = content.contentTypes.filter((ct) =>
        contentTypesToMigrate.includes(ct.sys.id)
      );

      // Include linked entries

      filteredContent.entries.forEach(findLinkedEntries);

      return filteredContent;
    };

    const rearrangeEntries = async (initialEntries) => {
      for (const entry of initialEntries) {
        filteredContent.entries.push(entry);
        entriesToInclude.add(entry.sys.id);
        const linkedContentTypes = await findLinkedContentTypes(entry);
        linkedContentTypes.forEach((linkedContentType) => {
          if (!contentTypesToMigrate.includes(linkedContentType)) {
            contentTypesToMigrate.push(linkedContentType);
            console.log(`Added linked content type: ${linkedContentType}`);
          }
        });
      }
      return { filterNewData: filteredContent, entriesValue: entriesToInclude };
    };

    const findLinkedEntries = (entry) => {
      Object.values(entry.fields).forEach((fieldValue) => {
        if (typeof fieldValue === "object" && fieldValue !== null) {
          Object.values(fieldValue).forEach((localeValue) => {
            if (Array.isArray(localeValue)) {
              localeValue.forEach((link) => {
                separteLocale(link);
              });
            }
          });
        }
      });
    };

    const separteLocale = (link) => {
      if (
        link.sys &&
        link.sys.type === "Link" &&
        link.sys.linkType === "Entry" &&
        !entriesToInclude.has(link.sys.id)
      ) {
        const linkedEntry = content.entries.find(
          (e) => e.sys.id === link.sys.id
        );
        if (linkedEntry) {
          filteredContent.entries.push(linkedEntry);
          entriesToInclude.add(linkedEntry.sys.id);
          findLinkedEntries(linkedEntry);
        }
      }
    };

    return processEntries();
  }

  /**
   * Export content from a Contentful environment.
   * @param {IExport} task Export task data.
   * @returns {Promise<IContent[]>} Promise that resolves to an array of exported content.
   */
  async export(task: IExport): Promise<IContent[]> {
    const { _id, spaceId, env, managementToken, currentTime, query } = task;

    const queryBuilder = () => {
      const queryArr: string[] = [];

      if (query.lastMigration) {
        queryArr.push(`sys.updatedAt[gte]=${query.lastMigration}`);
      }

      if (query.includeTags) {
        queryArr.push(`metadata.tags.sys.id[in]=${query.includeTags}`);
      }

      if (query.excludeTags) {
        queryArr.push(`metadata.tags.sys.id[nin]=${query.excludeTags}`);
      }

      return queryArr;
    };

    // export/backup options
    const exportOpts: IExportOpt = {
      spaceId,
      managementToken,
      queryEntries: queryBuilder(),
      environmentId: env,
      saveFile: false,
      errorLogFile: `./contentful-error-logs/${uuid()}.json`,
      skipContentModel: false,
      queryAssets: queryBuilder(),
      maxAllowedLimit: Number(CONTENTFUL_MAX_ALLOWED_LIMIT),
      includeDrafts: Boolean(CONTENTFUL_INCLUDE_DRAFT_CONTENT),
      includeArchived: Boolean(CONTENTFUL_INCLUDE_ARCHIVED_CONTENT),
    };

    const files: IContent[] = []; // exported contents
    const errors: any[] = []; // error logs

    try {
      const expContent = await contentfulExport(exportOpts);
      if (!query.includeTags && !query.excludeTags) {
        expContent.assets = [];
      }
      const filepath = `export/${spaceId}/${env}/${_id}/${currentTime}/content/${uuid()}.json`;

      const file = await this.pushToBlob(
        filepath,
        expContent,
        CONTENTFUL_MIGRATION_STORAGE_CONTAINER
      );
      files.push({
        exportContent: `${file}${CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY}`,
      });
    } catch (error: any) {
      console.log(error, "something went wrong");

      if (error.errors) {
        const jsonError = JSON.parse(JSON.stringify(error.errors));
        const filepath = `export/${spaceId}/${env}/${_id}/${currentTime}/error/${uuid()}.json`;

        await this.pushToBlob(
          filepath,
          jsonError,
          CONTENTFUL_MIGRATION_STORAGE_CONTAINER
        );

        // update error
        await ContentfulMigrationModel.updateOne(
          { _id: Types.ObjectId(_id) },
          {
            $set: {
              contentfulErrorLogs: errors,
            },
          }
        ).exec();

        console.log(
          "Oh no! Some errors occurred!",
          JSON.parse(JSON.stringify(error.errors))
        );
        throw new Error(`Contentful failure on exports`);
      }
      throw error;
    }
    return files;
  }

  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  filteredData({
    filteredContent,
    allLocales,
    regionEntryMap,
    destinationEntryMap,
    locales,
    countryEntryMap,
  }) {
    return filteredContent.entries.map((entry) => {
      let newFields = {};

      for (const [fieldKey, fieldValue] of Object.entries(entry.fields)) {
        if (fieldValue && typeof fieldValue === "object") {
          newFields = this.processLocales({
            fieldValue,
            entry,
            fieldKey,
            locales,
            destinationEntryMap,
            allLocales,
            newFields,
            regionEntryMap,
            countryEntryMap,
          });
        }
      }

      return { ...entry, fields: newFields };
    });
  }

  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  processLocales({
    fieldValue,
    entry,
    fieldKey,
    locales,
    destinationEntryMap,
    allLocales,
    newFields,
    regionEntryMap,
    countryEntryMap,
  }) {
    for (const locale of allLocales) {
      const value = fieldValue[locale];
      if (!newFields[fieldKey]) {
        newFields[fieldKey] = {};
      }
      if (locales.includes(locale) && fieldKey === "region") {
        const regions: any = regionEntryMap.get(locale);
        newFields = this.processInnerLocales({
          entry,
          fieldKey,
          destinationEntryMap,
          newFields,
          regions,
        });
      } else if (locales.includes(locale) && fieldKey === "country") {
        const regions: any = countryEntryMap.get(locale);
        newFields = this.processInnerLocales({
          entry,
          fieldKey,
          destinationEntryMap,
          newFields,
          regions,
        });
      } else if (fieldKey !== "region") {
        newFields = this.gettingFieldLocales({
          entry,
          fieldKey,
          destinationEntryMap,
          newFields,
          locale,
          locales,
          value,
        });
      }
    }

    return newFields;
  }

  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  processInnerLocales({
    entry,
    fieldKey,
    destinationEntryMap,
    newFields,
    regions,
  }) {
    if (
      destinationEntryMap.has(entry.sys.id) &&
      destinationEntryMap.get(entry.sys.id).fields[fieldKey]
    ) {
      const destContentData = destinationEntryMap.get(entry.sys.id).fields[
        fieldKey
      ]["en-US"];

      const alreadyLinked: any = destContentData.some(
        (link) => link.sys.id === regions
      );
     const newDestData =  newFields[
        fieldKey
      ]["en-US"];
      let newlyLinked: any; 
      if(newDestData && newDestData.length) {
        newlyLinked = newDestData.some(
          (link) => link.sys.id === regions
        );
      }      
      if (!alreadyLinked && !newlyLinked) {
        destContentData.push({
          sys: {
            type: "Link",
            linkType: "Entry",
            id: regions,
          },
        });
      }

      newFields[fieldKey]["en-US"] = destContentData;
    } else {
      if (!newFields[fieldKey]["en-US"]) {
        newFields[fieldKey]["en-US"] = [];
      }
      newFields[fieldKey]["en-US"].push({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: regions,
        },
      });
    }

    return newFields;
  }



  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  gettingFieldLocales({
    entry,
    fieldKey,
    destinationEntryMap,
    newFields,
    locale,
    locales,
    value,
  }) {
    if (locale === "en-US" && !locales.includes(locale)) {
      if (
        destinationEntryMap.has(entry.sys.id) &&
        destinationEntryMap.get(entry.sys.id).fields[fieldKey]
      ) {
        newFields[fieldKey][locale] = destinationEntryMap.get(
          entry.sys.id
        ).fields[fieldKey][locale];
      } else {
        newFields[fieldKey][locale] = value;
      }
    } else if (locales.includes(locale)) {
      newFields[fieldKey][locale] = value;
    } else if (
      destinationEntryMap.has(entry.sys.id) &&
      destinationEntryMap.get(entry.sys.id).fields[fieldKey] &&
      destinationEntryMap.get(entry.sys.id).fields[fieldKey][locale]
    ) {
      newFields[fieldKey][locale] = destinationEntryMap.get(
        entry.sys.id
      ).fields[fieldKey][locale];
    }

    return newFields;
  }

  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  async import(task: IImport): Promise<void> {
    const {
      _id,
      spaceId,
      env,
      managementToken,
      currentTime,
      contents,
      localesToMigrate,
      contentModels = [],
      source,
      contentIdsToMigrate = [],
      isRollBack = false,
      query,
    } = task;

    const files: any = [];

    const contentData: any = contents;

    let allLocales: any = [];

    let locales: any = localesToMigrate;
    const localeToEntryIdMap = new Map<string, string>();
    // Usage example:
    (async () => {
      const environmentId = env; // Replace with your Environment ID
      const accessToken = managementToken; // Replace with your Access Token

      try {
         allLocales = await this.fetchAllEntryLocales(
          spaceId,
          environmentId,
          accessToken
        );
        console.log("Total locales fetched:", locales.length);
        console.log("Locales:", locales);
      } catch (error) {
        console.error("Error fetching locales:", error);
      }
    })();

    await this.fetchAllLocales(
      task,
      localeToEntryIdMap
    );

    const { countryEntryMap } = await contentfulHelper.fetchUserRegion();

    if (localesToMigrate.length === 0) {
      locales = allLocales;
    }
    let filteredContent = contentData;

    // Filter content
    if (contentModels.length > 0) {
      filteredContent = await this.filterContent(
        contentData,
        contentModels,
        task
      );
    } else {
      contentData.contentTypes = [];
    }

    task.environmentId = env;

    const environment = await this.getEnvironment(task);

    const contentTypes = await environment.getContentTypes();

    // Extract the ids from filteredContent
    const filteredIds = filteredContent.contentTypes.map((fc) => fc.sys.id);

    // Filter contentTypes based on the ids from filteredContent
    const filteredContentTypes = contentTypes.items.filter((ct) =>
      filteredIds.includes(ct.sys.id)
    );
    const destinationEntries = await this.getAllEntries(environment);

    if (isRollBack) {
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "content backup" } }
      ).exec();

      const filePath = await this.backupChangedContent(
        task,
        contentIdsToMigrate,
        filteredContentTypes,
        destinationEntries,
        query,
        contentModels
      );
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { backupFilePath: filePath, status: "content importing" } }
      ).exec();
    } else {
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "content importing" } }
      ).exec();
    }

    const destinationEntryMap: any = new Map(
      destinationEntries.map((entry) => [entry.sys.id, entry])
    );

    // Fetch region entries by locale
    const regionEntryMap: any = localeToEntryIdMap;
    filteredContent.entries = this.filteredData({
      filteredContent,
      allLocales,
      regionEntryMap,
      destinationEntryMap,
      locales,
      countryEntryMap,
    });

    const fileNewPath = `export/${spaceId}/${env}/${_id}/${currentTime}/content/${uuid()}_filtered.json`;

    const fileNew = await this.pushToBlob(
      fileNewPath,
      filteredContent,
      CONTENTFUL_MIGRATION_STORAGE_CONTAINER
    );
    files.push({
      exportContent: `${fileNew}${CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY}`,
    });

    await ContentfulMigrationModel.updateOne(
      { _id: Types.ObjectId(_id) },
      {
        $set: {
          sourceExport: [
            {
              exportContent: fileNew,
            },
          ],
        },
      }
    ).exec();
    await this.syncContentTypes(environment, filteredContent.contentTypes);

    const importOpts: any = {
      spaceId,
      managementToken,
      skipContentModel: false,
      environmentId: env,
      errorLogFile: `./contentful-error-logs/${uuid()}.json`,
      content: "",
      includeDrafts: Boolean(CONTENTFUL_INCLUDE_DRAFT_CONTENT),
      includeArchived: Boolean(CONTENTFUL_INCLUDE_ARCHIVED_CONTENT),
    };

    const migration: IContentfulMigration | null =
      await ContentfulMigrationModel.findById(_id).exec();

    try {
      importOpts.content = await this.getContent(files[0].exportContent);

      await contentfulImport(importOpts);
    } catch (error: any) {
      const newError = await this.throwError({
        error,
        _id,
        migration,
        spaceId,
        env,
        currentTime,
      });

      throw newError;
    }
  }

  /**
   * Throw error
   * @param {any} environment Contentful environment instance.
   * @param {any[]} contentTypes Array of content types to sync.
   * @returns {Promise<void>} Promise that resolves when content types are synced.
   */
  async throwError({ error, _id, migration, spaceId, env, currentTime }) {
    const uniqueErrors: any[] = Object.values(
      error.errors.reduce((acc, curr) => {
        if (curr.error && curr.error.name && !acc[curr.error.name]) {
          acc[curr.error.name] = curr.error;
        }
        return acc;
      }, {})
    );

    if (
      uniqueErrors.length === 1 &&
      uniqueErrors[0]?.name === "VersionMismatch"
    ) {
      // Change status to success
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "success" } }
      ).exec();
    } else {
      if (error.errors) {
        const errors: any[] = [];
        const jsonError = JSON.parse(JSON.stringify(error.errors));
        const filepath = `import/${spaceId}/${env}/${_id}/${currentTime}/error/${uuid()}.json`;
        const file = await this.pushToBlob(
          filepath,
          jsonError,
          CONTENTFUL_MIGRATION_STORAGE_CONTAINER
        );

        errors.push({
          importContent: `${file}${CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY}`,
        });

        const errorLogs = migration?.contentfulErrorLogs?.concat(errors);
        if (migration) {
          migration.contentfulErrorLogs = errorLogs;
        }

        await migration?.save();
        console.log(
          "Oh no! Some errors occurred!",
          JSON.parse(JSON.stringify(error.errors))
        );
        if (isArray(error?.errors)) {
          await contentModelUtil.errorDetails(error.errors, _id);
        }

        return new Error(
          error.errors[0].error?.name ||
            error.errors[0].error?.originalError?.name ||
            "unknown error"
        );
      }
      return error;
    }
  }

  /**
   * Import content into a Contentful environment.
   * @param {IImport} task Import task data.
   * @returns {Promise<void>} Promise that resolves when import is complete.
   */
  async destinationImport(task: IImport): Promise<void> {
    const { _id, spaceId, env, managementToken, currentTime, contents } = task;

    const files: any = [];

    const importOpts: any = {
      spaceId,
      managementToken,
      skipContentModel: false,
      environmentId: env,
      errorLogFile: `./contentful-error-logs/${uuid()}.json`,
      content: "",
      includeDrafts: Boolean(CONTENTFUL_INCLUDE_DRAFT_CONTENT),
      includeArchived: Boolean(CONTENTFUL_INCLUDE_ARCHIVED_CONTENT),
    };

    const migration: IContentfulMigration | null =
      await ContentfulMigrationModel.findById(_id).exec();

    try {
      importOpts.content = contents;

      await contentfulImport(importOpts);
    } catch (error: any) {
      const uniqueErrors: any[] = Object.values(
        error.errors.reduce((acc, curr) => {
          if (curr.error && curr.error.name && !acc[curr.error.name]) {
            acc[curr.error.name] = curr.error;
          }
          return acc;
        }, {})
      );

      if (
        uniqueErrors.length === 1 &&
        uniqueErrors[0]?.name === "VersionMismatch"
      ) {
        // Change status to success
        await ContentfulMigrationModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status: "success", rollBackStatus: "success" } }
        ).exec();
      } else {
        await this.handleCatchErr({
          error,
          spaceId,
          env,
          _id,
          currentTime,
          migration,
          errorKey: "rollBackError",
        });
      }
    }
  }

  /**
   * Handle error.
   * @param {any} environment Contentful environment instance.
   * @param {any[]} contentTypes Array of content types to sync.
   */
  async handleCatchErr({
    error,
    spaceId,
    env,
    _id,
    currentTime,
    migration,
    errorKey = "errorDetails",
  }) {
    if (error.errors) {
      const errors: any[] = [];
      const jsonError = JSON.parse(JSON.stringify(error.errors));
      const filepath = `import/${spaceId}/${env}/${_id}/${currentTime}/error/${uuid()}.json`;
      const file = await this.pushToBlob(
        filepath,
        jsonError,
        CONTENTFUL_MIGRATION_STORAGE_CONTAINER
      );

      errors.push({
        importContent: `${file}${CONTENTFUL_MIGRATION_STORAGE_READ_SAS_KEY}`,
      });

      const errorLogs = migration?.contentfulErrorLogs?.concat(errors);
      if (migration) {
        migration.contentfulErrorLogs = errorLogs;
      }

      await migration?.save();
      console.log(
        "Oh no! Some errors occurred!",
        JSON.parse(JSON.stringify(error.errors))
      );
      if (isArray(error?.errors)) {
        await contentModelUtil.errorDetails(error.errors, _id, errorKey);
      }

      throw new Error(
        error.errors[0].error?.name ||
          error.errors[0].error?.originalError?.name ||
          "unknown error"
      );
    }
    throw error;
  }

  /**
   * Sync content types between environments.
   * @param {any} environment Contentful environment instance.
   * @param {any[]} contentTypes Array of content types to sync.
   * @returns {Promise<void>} Promise that resolves when content types are synced.
   */
  async syncContentTypes(environment, contentTypes) {
    for (const contentType of contentTypes) {
      try {
        const existingContentType = await environment
          .getContentType(contentType.sys.id)
          .catch(() => null);
        if (existingContentType) {
          // Update existing content type
          existingContentType.fields = contentType.fields;
          await existingContentType.update();
          const latestContentType = await environment.getContentType(
            existingContentType.sys.id
          );
          await latestContentType.publish();
          console.log(
            `Updated and published content type ${contentType.sys.id}`
          );
        } else {
          // Create new content type
          const newContentType = await environment.createContentTypeWithId(
            contentType.sys.id,
            {
              name: contentType.name,
              fields: contentType.fields,
            }
          );
          await newContentType.publish();
          console.log(
            `Created and published content type ${contentType.sys.id}`
          );
        }
      } catch (err) {
        console.error(`Error syncing content type ${contentType.sys.id}:`, err);
      }
    }
  }

  /**
   * Fetch content from a given URL.
   * @param {string} url Axios request URL.
   * @returns {Promise<string>} Promise that resolves to the content data.
   */
  async getContent(url: string): Promise<string> {
    try {
      console.log("urlll", url);
      const { data } = await axios(url);

      return data;
    } catch (ex: any) {
      console.log(ex);
      throw new Error(ex.response.data);
    }
  }

  /**
   * Push content to Azure Blob Storage.
   * @param {string} path File path in the blob.
   * @param {string} content Content to be pushed to the blob.
   * @returns {Promise<string>} Promise that resolves to the file path URL.
   */
  async pushToBlob(
    path: string,
    content: string,
    containerName
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      blobService.createBlockBlobFromText(
        containerName,
        path,
        JSON.stringify(content),
        {
          contentSettings: {
            contentType: "application/json",
          },
        },
        (err: any) => {
          if (err) {
            return reject(err.message);
          }

          resolve(
            `${CONTENTFUL_MIGRATION_STORAGE_BASE_URL}/${containerName}/${path}`
          );
        }
      );
    });
  }
}

export default new ContentfulMigration();
