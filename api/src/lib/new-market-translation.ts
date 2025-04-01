import { createClient } from "contentful-management";
import { get } from "lodash";
import axios from "axios";
import moment from "moment";

import { htmlToRichText } from "html-to-richtext-contentful";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import contentfulHelper from "../components/ContentfulController/contentful.helper";
import MarketReviewHelper from "../components/MarketReviewController/market-review.helper";

import { TransactionHistoryModel } from "../entities";

const CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "CONTENTFUL_ENVIRONMENT_BACKUP"
)!;

const IS_COUNTRY = get(
  process.env,
  "IS_COUNTRY"
)!;

const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const GEN_API = process.env.GEN_API;
const USER_ID = process.env.GEN_API_USER_ID;
const GEN_API_PROJECT_NAME = process.env.GEN_API_PROJECT_NAME;

const headers: any = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

class NewMarketContentful {
  private client;

  constructor() {
    this.client = createClient({
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
    });
  }

  /**
   * translate or clone to required destination locale
   */
  async beginMarketTranslation(transaction) {
    const { content_type, sourceLocale, cloned, targetLocale } = transaction;

    const response: any = await this.contentModelEntries(
      content_type,
      sourceLocale.regionCode
    );

    const entries = response?.entries;
    const isRegionPresent = response?.isRegionPresent;

    if (!entries || entries.length === 0) {
      console.log("error comes here....");

      await TransactionHistoryModel.updateOne(
        { _id: transaction._id },
        {
          $set: {
            status: "error",
            error: {
              message:
                "No translation is present for the selected source locale",
            },
          },
        }
      );
    } else {
      const jobStartDate = new Date();
      // Update the database entries for this transaction
      await TransactionHistoryModel.findByIdAndUpdate(transaction._id, {
        entries: entries.map((item) => {
          return {
            entryId: item.entryId,
            time_taken: null,
            completed: false,
          };
        }),
        status: "started",
        jobStartDate,
        total_entries: entries.length,
        remaining_entries: entries.length,
      });

      await this.translateAndUpdate(
        entries,
        sourceLocale,
        targetLocale,
        transaction._id,
        isRegionPresent,
        cloned,
        jobStartDate
      );

    }
  }
  /**
   * checking contentModel properties and mapping entries.
   */
  async entriesWithModelProperties(
    contentType,
    sourceLocale,
    entriesToProcess,
    id
  ) {
    try {
      let isRegionPresent = false;
      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(
        CONTENTFUL_ENVIRONMENT_BACKUP
      );
      const contentModel = await environment.getContentType(contentType);
      const localizedFields = contentModel.fields.filter(
        (field) => field.localized
      );

      const regionFields = contentModel.fields.filter(
        (field) =>
          field.items &&
          field.items.type === "Link" &&
          field.items.linkType === "Entry" &&
          field.items.validations &&
          field.items.validations.some(
            (validation) =>
              validation.linkContentType &&
              validation.linkContentType.includes("region")
          )
      );

      if (regionFields && regionFields?.length > 0) {
        isRegionPresent = true;
      }

      const entries: any = [];
      entries.push(
        ...entriesToProcess
          .filter((entry) =>
            localizedFields.some((field) => {
              if (entry.fields[field.id]) {
                return entry.fields[field.id][sourceLocale];
              }
            })
          )
          .map((entry) => {
            const localizedFieldValues = {};

            localizedFields.forEach((field) => {
              localizedFieldValues[field.id] = {
                value: entry.fields[field.id],
                validations: field.validations,
              };
            });

            return {
              entryId: entry.sys.id,
              localizedFields: JSON.stringify(localizedFieldValues),
              contentModelName: contentModel.name,
            };
          })
      );


      return { isRegionPresent, entries };
    } catch (error) {
      console.log(error, "mapping error");
      await TransactionHistoryModel.findByIdAndUpdate(id, {
        status: "stopped",
        error: {
          statusCode: error?.statusCode,
          message: error?.message,
          statusText: error?.statusText,
        },
      });
    }
  }

  /**
   * seperate entries of each content model.
   */
  async groupEntriesByModel(entries) {
    const modelEntries = {};
    for (const entry of entries) {
      const modelId = entry.sys.contentType.sys.id;

      if (modelEntries[modelId]) {
        modelEntries[modelId].push(entry);
      } else {
        modelEntries[modelId] = [entry];
      }
    }

    return modelEntries;
  }

  /**
   * translate or clone to required destination locale based on selected tags
   */
  async beginMarketTranslationByTags(config) {
    try {
      const {
        includedTags,
        excludedTags,
        sourceLocale,
        targetLocale,
        cloned,
        models,
      }: any = config;
      const { items: entriesToProcess } = await this.fetchEntriesByTags(
        includedTags,
        excludedTags,
        models
      );

      let totalEta = config.eta;

      if (Array.isArray(entriesToProcess) && entriesToProcess.length) {
        await TransactionHistoryModel.findByIdAndUpdate(config._id, {
          entries: [],
          status: "started",
          total_entries: entriesToProcess.length,
          remaining_entries: entriesToProcess.length,
          jobStartDate: new Date(),
          error: {},
        });
      }

      const modelEntries = await this.groupEntriesByModel(entriesToProcess);
      // for each model repeat same steps.
      let processed: any[] = [];
      let totalTime = 0;

      await TransactionHistoryModel.findByIdAndUpdate(config._id, {
        total_entries: entriesToProcess.length,
      });

      for (const type of Object.keys(modelEntries)) {
        try {
          const configData: any = await TransactionHistoryModel.findById(
            config._id
          ).exec();
          if (configData.status === "stopped") {
            break;
          }
          const response: any = await this.entriesWithModelProperties(
            type,
            sourceLocale.regionCode,
            modelEntries[type],
            config._id
          );

          const entries = response?.entries;
          const isRegionPresent = response?.isRegionPresent;
          if (entries?.length) {
            const translateResponse: any =
              await this.translateAndPushToContentful({
                entries,
                sourceLocale,
                destLocale: targetLocale,
                isRegionPresent,
                clone: cloned,
                config,
                totalItems: entriesToProcess.length,
                totalEta,
              });

            const { logs, totalProcessingTime } = translateResponse;

            totalEta = translateResponse?.totalEta;

            processed = [...processed, ...logs];
            totalTime += totalProcessingTime;

          }
        } catch (e) {
          console.log("error comes here", e);
          await TransactionHistoryModel.findByIdAndUpdate(config._id, {
            status: "error",
            error: {
              statusCode: e?.statusCode,
              message: e?.message,
              statusText: e?.statusText,
            },
          });
        }
      }

      let status = "completed";

      const history: any = await TransactionHistoryModel.findById(
        config._id
      ).exec();

      if (history.status === "stopped") {
        status = "stopped";
      } else if (history.error) {
        if (
          Object.keys(history.error).length > 0 &&
          history.error?.message !==
            "Some entries might not be published due to validation error"
        ) {
          status = "error";
        }
      }

      await this.updateTransactionHistory(
        config._id,
        history.jobStartDate,
        status
      );
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * fetch entries by including and excluding tags
   */
  async fetchEntriesByTags(includedTags, excludedTags, models) {
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment(
      CONTENTFUL_ENVIRONMENT_BACKUP
    );

    let query = {};
    if (Array.isArray(includedTags) && includedTags.length) {
      query = { ...query, "metadata.tags.sys.id[in]": includedTags.join(",") };
    }

    if (Array.isArray(excludedTags) && excludedTags.length) {
      query = { ...query, "metadata.tags.sys.id[nin]": excludedTags.join(",") };
    }
    if (Array.isArray(models) && models.length) {
      query = { ...query, "content_type[in]": models.join(",") };
    }

    const limit = 100;
    let skip = 0;
    let allEntries: any = [];

    do {
      const paginatedQuery = {
        ...query,
        "sys.archivedAt[exists]": false,
        "sys.publishedAt[exists]": true,
        limit,
        skip,
      };
      const contentEntries = await environment.getEntries(paginatedQuery);

      if (contentEntries.items.length === 0) {
        break;
      }

      allEntries = allEntries.concat(contentEntries.items);
      skip += limit;
    } while (true);

    return { items: allEntries };
  }

  /**
   * translates and updates the entries in contenful
   */
  async translateAndPushToContentful({
    entries,
    sourceLocale,
    destLocale,
    isRegionPresent,
    clone,
    config,
    totalItems,
    totalEta,
  }) {
    const totalProcessingTime = 0;
    const logs: any = [];
    try {
      const reviewerData: any = [];
      for (let i = 0; i < entries.length; i++) {
        const configData: any = await TransactionHistoryModel.findById(
          config._id
        ).exec();
        if (configData.status === "stopped") {
          break;
        }
        const startTime = new Date();
        const localizedFields = JSON.parse(entries[i].localizedFields);

        const translatedFields: any = await this.translateEntryFields({
          localizedFields,
          sourceRegionCode : sourceLocale.regionCode,
          destRegionCode : destLocale.regionCode,
          clone,
          entryId : entries[i].entryId,
          reviewerData,
          contentModelName : entries[i].contentModelName,
          _id : config._id
      });
        if (Object.keys(translatedFields).length > 0) {
          const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
          const environment = await space.getEnvironment(
            CONTENTFUL_ENVIRONMENT_BACKUP
          );
          const contentfulEntry = await environment.getEntry(
            entries[i].entryId
          );
          if (isRegionPresent && IS_COUNTRY !== "TRUE") {
            this.updateRegionField(contentfulEntry, destLocale.regionSysId);
          } else if(IS_COUNTRY === "TRUE"){
            this.updateCountryField(contentfulEntry, destLocale.regionSysId);
          }

          this.updateTranslatedFields(contentfulEntry, translatedFields);
          await this.handleContentfulUpdate({
            contentfulEntry,
            config,
            totalItems,
            startTime,
            i,
            logs,
            totalEta,
            totalProcessingTime,
            entries}
          ); // NOSONAR
          await TransactionHistoryModel.findByIdAndUpdate(config._id, {
            remaining_entries: entries.length - i+1,
          });
        }

        await this.delay(1000);
      }
      if (reviewerData.length > 0 && !clone) {
        await contentfulHelper.reviewerUpdate(
          {
            data: reviewerData,
            sourceLocale: sourceLocale.regionCode,
            destLocale: destLocale.regionCode,
          },
          "", ""
        );
      }
    } catch (error) {
      await this.handleError(config._id, error);
      console.log(error);
    }

    return { logs, totalProcessingTime, totalEta };
  }

  /**
   *  Helper method to handle Contentful entry updates
   * @param {string} contentType
   * @param {string} sourceLocale
   */

  async handleContentfulUpdate({
    contentfulEntry,
    config,
    totalItems,
    startTime,
    i,
    logs,
    totalEta,
    totalProcessingTime,
    entries}
  ) {
    // NOSONAR
    try {
      await this.updateContentfulEntry(contentfulEntry);
      if (!totalEta) {
        const timeTaken = this.calculateTimeTaken(startTime);
        totalProcessingTime += timeTaken;

        const averageTimePerEntryInSeconds =
          totalProcessingTime / entries.length;
        const eta = Math.round(averageTimePerEntryInSeconds * entries.length);
        await TransactionHistoryModel.findByIdAndUpdate(config._id, {
          eta: eta * totalItems,
        });
        totalEta = eta * totalItems; // NOSONAR
      }

      logs.push({ entryId: entries[i].entryId, success: true, i });
    } catch (error) {
      console.log("error while updating to contentful", error);
      await TransactionHistoryModel.updateOne(
        { _id: config._id },
        {
          $set: {
            error: {
              message:
                "Some entries might not be published due to validation error",
            },
          },
        }
      );
      logs.push({ entryId: entries[i].entryId, success: false });
    }
  }

  /**
   * checking contentModel properties and fetching entries by filtering them based on source locale
   * @param {string} contentType
   * @param {string} sourceLocale
   */
  async contentModelEntries(contentType, sourceLocale) {
    try {
      let isRegionPresent = false;
      const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
      const environment = await space.getEnvironment(
        CONTENTFUL_ENVIRONMENT_BACKUP
      );
      const contentModel = await environment.getContentType(contentType);
      const localizedFields = contentModel.fields.filter(
        (field) => field.localized
      );

      const regionFields = contentModel.fields.filter(
        (field) =>
          field.items &&
          field.items.type === "Link" &&
          field.items.linkType === "Entry" &&
          field.items.validations &&
          field.items.validations.some(
            (validation) =>
              validation.linkContentType &&
              validation.linkContentType.includes("region")
          )
      );
      if (regionFields && regionFields.length > 0) {
        isRegionPresent = true;
      }

      let skip = 0;
      const limit = 100;
      const entries: any = [];

      while (true) {
        const contentEntries = await environment.getEntries({
          content_type: contentType,
          "sys.archivedAt[exists]": false,
          "sys.publishedAt[exists]": true,
          limit,
          skip,
        });
        // Process and append entries to allEntries
        entries.push(
          ...contentEntries.items
            .filter((entry) =>
              localizedFields.some(
                (field) => entry.fields[field.id][sourceLocale]
              )
            )
            .map((entry) => {
              const localizedFieldValues = {};

              localizedFields.forEach((field) => {
                localizedFieldValues[field.id] = {
                  value: entry.fields[field.id],
                  validations: field.validations,
                };
              });

              return {
                entryId: entry.sys.id,
                localizedFields: JSON.stringify(localizedFieldValues),
                contentModelName: contentModel.name,
              };
            })
        );

        // Break the loop if no more entries are returned
        if (contentEntries.items.length < limit) {
          break;
        }

        skip += limit;
      }

      return { isRegionPresent, entries };
    } catch (error) {
      return error;
    }
  }

  /**
   * translates and updates the entries in contenful
   * @param {string} entries
   * @param {string} sourceLocale
   * @param {string} condestLocaletentType
   * @param {string} openai
   * @param {string} _id
   * @param {string} isRegionPresent
   */
  async translateAndUpdate(
    entries,
    sourceLocale,
    destLocale,
    _id,
    isRegionPresent,
    clone,
    jobStartDate    
  ) {
    let totalProcessingTime = 0;

    try {
      const reviewerData: any = [];
      for (let i = 0; i < entries.length; i++) {
        const configData: any = await TransactionHistoryModel.findById(
          _id
        ).exec();
        if (configData && configData.status === "stopped") {
          break;
        }
        const startTime = new Date();
        const localizedFields = JSON.parse(entries[i].localizedFields);

        const translatedFields: any = await this.translateEntryFields({
          localizedFields,
          sourceRegionCode : sourceLocale.regionCode,
          destRegionCode : destLocale.regionCode,
          clone,
          entryId : entries[i].entryId,
          reviewerData,
          contentModelName : entries[i].contentModelName,
          _id
      });

        if (Object.keys(translatedFields).length > 0) {
          const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
          const environment = await space.getEnvironment(
            CONTENTFUL_ENVIRONMENT_BACKUP
          );

          const contentfulEntry = await environment.getEntry(
            entries[i].entryId
          );

          if (isRegionPresent && IS_COUNTRY !== "TRUE") {
            this.updateRegionField(contentfulEntry, destLocale.regionSysId);
          } else if(IS_COUNTRY === "TRUE"){
            this.updateCountryField(contentfulEntry, destLocale.regionSysId);
          }

          this.updateTranslatedFields(contentfulEntry, translatedFields);

          try {
            await this.updateContentfulEntry(contentfulEntry);
            const timeTaken = this.calculateTimeTaken(startTime);
            await this.updateDatabaseEntryTime(
              _id,
              entries[i].entryId,
              timeTaken
            );
            totalProcessingTime += timeTaken;
            await this.updateDatabaseAndLog(
              totalProcessingTime,
              _id,
              i,
              entries.length
            );
          } catch (error) {
            console.log("error while updating to contentful", error);
            await TransactionHistoryModel.updateOne(
              { _id },
              {
                $set: {
                  error: {
                    message:
                      "Some entries might not be published due to validation error",
                  },
                },
              }
            );
            console.log(error);
            continue;
          }
        }

        await this.delay(1000);
      }
      if (reviewerData.length > 0 && !clone) {
        await contentfulHelper.reviewerUpdate(
          {
            data: reviewerData,
            sourceLocale: sourceLocale.regionCode,
            destLocale: destLocale.regionCode,
          },
          "", ""
        );
      }
      await this.updateTransactionHistory(_id, jobStartDate, "completed");
    } catch (error) {
      await this.handleError(_id, error);
    }
  }

  /**
   * translate or clone to the destination locale
   * @param {any} localizedFields
   * @param {string} sourceRegionCode
   * @param {string} destRegionCode
   * @param {boolean} clone
   */
  async translateEntryFields({
    localizedFields,
    sourceRegionCode,
    destRegionCode,
    clone,
    entryId,
    reviewerData,
    contentModelName,
    _id
  }) {
    try {
      const translatedFields = {};
  
      for (const fieldName in localizedFields) {
        if (!localizedFields.hasOwnProperty(fieldName)) { continue; }
  
        try {
          await this.processField({
            fieldName,
            localizedFields,
            sourceRegionCode,
            destRegionCode,
            clone,
            entryId,
            reviewerData,
            contentModelName,
            translatedFields
        });
        } catch (error) {
          if(error.response?.data?.detail?.length && error.response.data.detail[0].type === "enum"){
            await this.handleError(_id, error.response.data.detail[0].msg);
            throw error;
          }else{
            console.error(`Error processing field ${fieldName} for entry ${entryId}:`, error);
          }
        }
      }
  
      return translatedFields;
    } catch (error) {
      console.error(`Error processing entry ${entryId}:`, error);
    }
  }

  /**
   * getTranslatedReviewerData
   * @param {any} validations
   * @param {boolean} true
   */
  async processField({
    fieldName,
    localizedFields,
    sourceRegionCode,
    destRegionCode,
    clone,
    entryId,
    reviewerData,
    contentModelName,
    translatedFields
  }) {
    const charLimit = await contentfulHelper.getFieldValidations(entryId, fieldName, "");
    const fieldValue = localizedFields[fieldName]?.value;
    if (!fieldValue) { return; }
  
    const originalText = fieldValue[sourceRegionCode];
    if (originalText?.nodeType === "document" && !clone) {
      await this.processRichText({
        fieldName,
        originalText,
        sourceRegionCode,
        destRegionCode,
        entryId,
        reviewerData,
        contentModelName,
        translatedFields
    });
    } else {
      translatedFields[fieldName] = await this.getTranslatedReviewerData({
        originalText,
        clone,
        localizedFields,
        fieldName,
        destRegionCode,
        charLimit,
        translatedFields,
        reviewerData,
        sourceRegionCode,
        entryId,
        contentModelName,
      });
    }
  }

  /**
   * getTranslatedReviewerData
   * @param {any} validations
   * @param {boolean} true
   */
  async processRichText({
    fieldName,
    originalText,
    sourceRegionCode,
    destRegionCode,
    entryId,
    reviewerData,
    contentModelName,
    translatedFields
  }) {
    try {
      const content = await documentToHtmlString(originalText);
      const translatedText = await this.translateText(content, destRegionCode, sourceRegionCode);
      translatedFields[fieldName] = { [destRegionCode]: htmlToRichText(translatedText) };
  
      reviewerData.push({
        locale: sourceRegionCode,
        type: "RichText",
        value: translatedText,
        existingValue: translatedText,
        translatedValue: translatedText,
        key: fieldName,
        entryId,
        contentModelName,
      });
    } catch (error) {
      console.error(`Error translating field ${fieldName} for entry ${entryId}:`, error);
    }
  }  

  /**
   * getTranslatedReviewerData
   * @param {any} validations
   * @param {boolean} true
   */
  async getTranslatedReviewerData({
    originalText,
    clone,
    localizedFields,
    fieldName,
    destRegionCode,
    charLimit,
    translatedFields,
    reviewerData,
    sourceRegionCode,
    entryId,
    contentModelName,
  }) {
    if (
      typeof originalText === "string" &&
      !clone &&
      !this.checkValidations(localizedFields[fieldName].validations) &&
      !MarketReviewHelper.isOnlyHyperlink(originalText) &&
      !MarketReviewHelper.isOnlyDeepLink(originalText)
    ) {
      const translatedText = await this.translateText(
        originalText,
        destRegionCode,
        sourceRegionCode,
        charLimit
      );

      if (translatedText) {
        translatedFields[fieldName] = { [destRegionCode]: translatedText };
      }
      reviewerData.push({
        locale: sourceRegionCode,
        existingValue: originalText,
        type: "Symbol",
        value: originalText,
        translatedValue: translatedText,
        key: fieldName,
        entryId,
        contentModelName,
      });
    } else {
      translatedFields[fieldName] = { [destRegionCode]: originalText };
    }
    return translatedFields[fieldName];
  }

  /**
   * checkValidations
   * @param {any} validations
   * @param {boolean} true
   */
  checkValidations(validations) {
    if (validations) {
      return validations.some((validation) => {
        if (validation.in) {
          return true;
        }
        // Add additional validation checks as needed
        return false;
      });
    }
    return false;
  }

  /**
   * updateRichTextWithTranslations
   * @param {any} contentArray
   * @param {string} destRegionCode
   */
  async updateRichTextWithTranslations(
    contentArray,
    destRegionCode,
    sourceRegionCode
  ) {
    await Promise.all(
      contentArray.map(async (node) => {
        switch (node.nodeType) {
          case "text":
            // Translate text node
            if (node.value) {
              const translatedValue = await this.translateText(
                node.value,
                destRegionCode,
                sourceRegionCode
              );
              node.value = translatedValue; // Update the text value with translated text
            }
            break;

          case "paragraph":
          case "heading-1":
          case "heading-2":
          case "heading-3":
          case "heading-4":
          case "heading-5":
          case "heading-6":
          case "blockquote":
          case "unordered-list":
          case "ordered-list":
          case "list-item":
            // Recursively update nested content for paragraphs, headings, and blockquotes, and list items
            if (node.content && Array.isArray(node.content)) {
              await this.updateRichTextWithTranslations(
                node.content,
                destRegionCode,
                sourceRegionCode
              );
            }
            break;

          case "embedded-entry-block":
          case "embedded-entry-inline":
            // Handle embedded entries (optional: implement translation logic)
            break;

          case "hyperlink":
            // Handle hyperlinks (optional: implement translation logic)
            break;

          case "asset-hyperlink":
          case "embedded-asset-block":
            // Handle linked assets (optional: implement translation logic)
            break;

          default:
            // Handle other node types as needed
            break;
        }
        // Handle other node types as needed
      })
    );

    // Return the updated contentArray after all nodes are processed
    return contentArray;
  }

  /**
   * updating region for the contentful entries
   * @param {any} contentfulEntry
   * @param {string} destRegionSysId
   */
  updateRegionField(contentfulEntry, destRegionSysId) {
    const regionFieldEnUS = contentfulEntry.fields.region?.["en-US"];

    if (regionFieldEnUS) {
      const isEntryAlreadyPresent = regionFieldEnUS.some(
        (item) => item.sys.id === destRegionSysId
      );

      if (!isEntryAlreadyPresent) {
        const updatedRegionField = [
          ...regionFieldEnUS,
          { sys: { type: "Link", linkType: "Entry", id: destRegionSysId } },
        ];
        contentfulEntry.fields.region["en-US"] = updatedRegionField;
      }
    }
  }

  /**
   * updating region for the contentful entries
   * @param {any} contentfulEntry
   * @param {string} destRegionSysId
   */
    updateCountryField(contentfulEntry, destRegionSysId) {
      const regionFieldEnUS = contentfulEntry.fields.country?.["en-US"];
   
      if (regionFieldEnUS) {
        const isEntryAlreadyPresent = regionFieldEnUS.some(
          (item) => item.sys.id === destRegionSysId
        );
   
        if (!isEntryAlreadyPresent) {
          const updatedRegionField = [
            ...regionFieldEnUS,
            { sys: { type: "Link", linkType: "Entry", id: destRegionSysId } },
          ];
          contentfulEntry.fields.country["en-US"] = updatedRegionField;
        }
      }
    }

  /**
   * updating each field of an entry
   * @param {any} contentfulEntry
   * @param {any} translatedFields
   */
  updateTranslatedFields(contentfulEntry, translatedFields) {
    for (const fieldName in translatedFields) {
      if (translatedFields.hasOwnProperty(fieldName)) {
        contentfulEntry.fields[fieldName] = {
          ...contentfulEntry.fields[fieldName],
          ...translatedFields[fieldName],
        };
      }
    }
  }

  /**
   * Updating and publishing entries in contentful
   * @param {any} contentfulEntry
   */
  async updateContentfulEntry(contentfulEntry) {
    // Adding translation tag to entry.
    contentfulEntry.metadata = {
      tags: [
        ...contentfulEntry.metadata.tags,
        {
          sys: {
            type: "Link",
            linkType: "Tag",
            id: "translatedFromJob",
          },
        },
      ],
    };

    const updatedEntry = await contentfulEntry.update();
    await updatedEntry.publish();
  }

  /**
   * calculating time taken for each entries
   * @param {string} startTime
   */
  calculateTimeTaken(startTime) {
    const endTime = new Date();
    return (endTime.getTime() - startTime.getTime()) / 1000;
  }

  /**
   * calculate and update remaining entries and time to DB
   * @param {number} totalProcessingTime
   * @param {string} _id
   * @param {number} i
   * @param {number} totalEntries
   */
  async updateDatabaseAndLog(totalProcessingTime, _id, i, totalEntries) {
    const averageTimePerEntryInSeconds = totalProcessingTime / (i + 1);

    const remainingEntries = totalEntries - i - 1;
    const remainingTimeInSeconds = Math.round(
      averageTimePerEntryInSeconds * remainingEntries
    );
    await TransactionHistoryModel.updateOne(
      { _id },
      {
        $set: {
          remaining_entries: remainingEntries,
          eta: remainingTimeInSeconds,
        },
      }
    );
  }

  /**
   * used to delay 1 sec after each update
   * @param {number} ms
   */
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * translates and updates the entries in contenful
   * @param {string} _id
   * @param {number} totalProcessingTimeInMinutes
   * @param {string} status
   */
  async updateTransactionHistory(_id, jobStartDate, status) {
    const endDate = moment();
    const startDate = moment(jobStartDate);
    // Calculate the difference
    const duration = moment.duration(endDate.diff(startDate));

    const minutes = Math.floor(duration.asMinutes()) % 60;

    let updateData: any = { status };

    if (minutes > 0) {
      updateData = { status, total_time_taken: minutes };
    }

    await TransactionHistoryModel.updateOne({ _id }, { $set: updateData });
  }

  /**
   * handles the errors and updates in DB
   * @param {string} _id
   * @param {object} error
   */
  async handleError(_id, error) {
    await TransactionHistoryModel.updateOne(
      { _id },
      {
        $set: {
          status: "error",
          error: {
            message: error?.message || "Unknown Error",
            statusCode: error?.response?.status,
            statusText: error?.response?.statusText,
          },
        },
      }
    );
  }

  /**
   * translate the text to destination locale
   * @param {string} text
   * @param {string} destLocale
   */
  async translateText(content, destLocale, sourceLocale, charLimit?) {
    try {
      const token = await contentfulHelper.fetchAItoken();
      headers.Authorization = `Bearer ${token}`;
      headers.userid = USER_ID;
      headers["project-name"] = GEN_API_PROJECT_NAME;
      let translatedContent;
      if (/^\d+$/.test(content)) {
        translatedContent = content;
      }else{
        const response = await axios.post(
          `${GEN_API}`,
          {
            target_language: destLocale.replace("-", "_").toLocaleLowerCase(),
            source_language: sourceLocale.replace("-", "_").toLocaleLowerCase(),
            max_output_length: charLimit,
            text_to_translate: content,
            model_name: "GPT-4O-2024-08-06",
            expected_tone: "Translate naturally and conversationally, avoiding literal or overly formal language. Adapt the text to the communication style of the target country and language. Do not translate word-for-word if a more natural phrasing works better. Use gender-neutral language for children, with a warm, supportive, and informative tone. Convert Fahrenheit to Celsius if the source is en_US. Replace Pampers word with Dodot if target language is es_ES.",
            list_of_terms: {},
          },
          { headers }
        );
         translatedContent = response.data.translation;
      }

      return translatedContent;
    } catch (error) {
      console.log("Error while translating (api)", error);
      throw error;
    }
  }



  /**
   * Function to update the database entry with the time taken
   * @param {string} _id
   * @param {string} entryId
   * @param {number} timeTaken
   */
  async updateDatabaseEntryTime(_id, entryId, timeTaken) {
    await TransactionHistoryModel.updateOne(
      { _id, "entries.entryId": entryId },
      {
        $set: {
          "entries.$.time_taken": timeTaken,
          "entries.$.completed": true,
        },
      }
    );
  }
}

export default new NewMarketContentful();
