import { createClient } from "contentful-management";
import { get } from "lodash";
import { Types } from "mongoose";
import moment from "moment";
import axios from "axios";
// entities
import {
  AuditModel,
  ContentfulMigrationModel,
  UserModel,
  UserRoleModel,
} from "../../entities";
import { htmlToRichText } from "html-to-richtext-contentful";
import {
  ContentfulMigration as Contentful,
  Nodemailer,
  NewMarketContentful,
} from "../../lib";
import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";

// interfaces
import { IContentfulMigration } from "../../entities/interfaces/iContentfulMigration";

const CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;
const CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "CONTENTFUL_ENVIRONMENT_BACKUP"
)!;
const IS_COUNTRY = get(process.env, "IS_COUNTRY")!;
const CRM_SIT = get(process.env, "CRM_SIT")!;
const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP"
)!;

const US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

const US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const SAATCHI_API = process.env.SAATCHI_API;
const APIKEY = process.env.SAATCHI_KEY;

const headers = {
  Accept: "application/json",
  "x-gen-ai-translation-api-key": APIKEY,
  "Content-Type": "application/json",
};

let genAIToken = null;
let genAITokenDate;
const COGNITIVE_SERVICES:any = process.env.GEN_AI_COGNITIVE_SERVICES;
const tenantId:any = process.env.GEN_AI_TENANT_ID;
const clientId:any = process.env.GEN_AI_CLIENT_ID;
const clientSecret:any = process.env.GEN_AI_CLIENT_SECRET;

class ContentfulHelper {
  private client;
  private regexSt;
  private usClient;

  constructor() {
    this.client = createClient({
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.usClient = createClient({
      accessToken: US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.regexSt = /^(?:\s+|\s+)$/g;
  }

  /**
   * Call chatGPT for text translation
   * @param openaiConf
   * @param message
   */
  async runCompletion(openai, message) {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: message,
      temperature: 0.7,
      max_tokens: 200,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const generatedText = completion.data.choices[0].text.replace(
      new RegExp(this.regexSt),
      ""
    );

    const formattedText = generatedText.replace(/\n/g, "");

    return formattedText;
  }
  /**
   * Get space
   * @param spaceId
   * @returns Response
   */
  async reviewerUpdate(input, email, user) {
    const { data, sourceLocale, destLocale, isCRM } = input;
    const moduleName = isCRM ? "CRM reviewer record" : "reviewer record";
    const submoduleName = isCRM ? "CRM reviewer record" : "reviewer record";

    const auditRecord: any = await AuditModel.findOne({
      module: moduleName,
      "data.destLocale": destLocale,
    });
    const reviewerArray: any = [];

    if (auditRecord) {
      data.forEach((item) => {
        const existRecord = auditRecord.data.content.find(
          (auditContent) =>
            auditContent.entryId === item.entryId &&
            auditContent.key === item.key
        );
        if (!existRecord) {
          reviewerArray.push(item);
        }
      });

      await AuditModel.updateOne(
        { _id: Types.ObjectId(auditRecord._id) },
        { $push: { "data.content": { $each: reviewerArray } } }
      );
      const roleList: any = await UserRoleModel.find({
        "permissions.uniqueResourceName": "contentManagement",
        "permissions.subResources.uniqueSubResourceName":
          "contentManagement:reviewer",
        "permissions.subResources.services.uniqueServiceName":
          "contentManagement:reviewer:createTranslation",
      });

      const roleNames = roleList
        .filter((role) => role.name !== "Admin")
        .map((role) => role.name);

      const reviewerList: any = await UserModel.find({
        role: { $in: roleNames },
        locales: { $elemMatch: { $eq: destLocale } },
      });
      if (reviewerList.length > 0) {
        const emailArray = reviewerList.map((entry) => entry.email);
        await Nodemailer.sendEmail(emailArray, destLocale);
      }
    } else {
      const payload = {
        email,
        action: "Reviewer update",
        module: moduleName,
        type: moduleName,
        data: {
          status: "success",
          destLocale,
          sourceLocale,
          content: data,
        },
        submodule: submoduleName,
        user,
        status: "Success",
        actionDetails: `Submitted to reviewer from locale ${sourceLocale} to ${destLocale}`,
        reqPayload: input,
      };
      await AdminPanelHelper.createAuditTrail(payload);
    }
  }

  /**
   * Get space
   * @param spaceId
   * @returns Response
   */
  async getSpace(spaceId) {
    let contentfulSpaceId = CONTENTFUL_SPACE_ID;
    let contentfulBackup = CONTENTFUL_ENVIRONMENT;
    let space = await this.client.getSpace(contentfulSpaceId);
    if (spaceId === US_WEBSITE_CONTENTFUL_SPACE_ID) {
      contentfulSpaceId = US_WEBSITE_CONTENTFUL_SPACE_ID;
      contentfulBackup = US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP;
      space = await this.usClient.getSpace(contentfulSpaceId);
    }

    return { space, contentfulBackup };
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */

  async updateEntry(
    // NOSONAR
    {
      entryId,
      translatedValue,
      locale,
      isCRM,
      spaceId,
      key,
      type,
      details,
      isReviewPage,
      sourceValue,
    }
  ) {
    // NOSONAR

    const { space, contentfulBackup }: any = await this.getSpace(spaceId);
    const currentEnv = contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);

    // Fetch entry by ID
    const entry = await environment.getEntry(entryId);

    const contentType = await environment.getContentType(
      entry.sys.contentType.sys.id
    );

    const sameEntry = details.filter((item) => item.entryId === entryId);
    const singleUpdate = entry;
    const count = 0;
    if (sameEntry.length > 1) {
      return this.sameEntryChecking({
        sameEntry,
        isReviewPage,
        count,
        singleUpdate,
        contentType,
        locale,
        sourceValue,
        entry,
      });
    } else {
      if (type === "RichText") {
        const documentValue = htmlToRichText(translatedValue);
        entry.fields[key][locale] = documentValue;
      } else {
        entry.fields[key][locale] = translatedValue;
        const fieldValue = contentType.fields.find((types) => types.id === key);

        if (NewMarketContentful.checkValidations(fieldValue.validations)) {
          entry.fields[key][locale] = sourceValue;
        }
      }

      return this.updateToContentful(entry);
    }
  }

  /**
   * fetching region entries from contentful
   */
  async fetchUserRegion(regionMapping?) {
    const contentfulSpaceId = CONTENTFUL_SPACE_ID;
    const contentfulBackup = CONTENTFUL_ENVIRONMENT;
    const space = await this.client.getSpace(contentfulSpaceId);
    const currentEnv = contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);
    const query: any = {
      content_type: "country",
      order: "fields.title", // Assuming "name" is the field you want to order by
      "sys.archivedAt[exists]": false,
      "sys.publishedAt[exists]": true,
      limit: 1000,
    };

    const { items } = await environment.getEntries(query);
    const regionData: any = [];
    const localeToEntryIdMap = new Map<string, string>();

    // Filter out entries with empty fields
    for (const [, contentData] of items.entries()) {
      const code = contentData.fields.code["en-US"];
      const title = contentData.fields.title["en-US"];
      const region = contentData.fields.regionCode["en-US"];
      const regionName = contentData.fields.regionName["en-US"];
      const locales = contentData.fields.locales["en-US"];
      let existRegionId = regionData.findIndex(
        (item) => item.regionCode === region
      );
      if (existRegionId === -1) {
        regionData.push({
          region: regionName,
          regionCode: region,
          markets: [],
        });
        existRegionId = regionData.length - 1;
      }
      let marketIndex = regionData[existRegionId].markets.findIndex(
        (item) => item.code === code
      );
      if (marketIndex === -1) {
        regionData[existRegionId].markets.push({
          code,
          name: title,
          id: contentData.sys.id,
        });
        marketIndex = regionData[existRegionId].markets.length - 1;
      }

      locales.forEach((data) => {
        if (!regionData[existRegionId].markets[marketIndex].locales) {
          regionData[existRegionId].markets[marketIndex].locales = [];
        }
        regionData[existRegionId].markets[marketIndex].locales.push({
          name: title,
          code: data,
        });
        if(regionMapping) {
          localeToEntryIdMap.set(contentData.fields.code["en-US"], contentData.sys.id);

        } else {
          localeToEntryIdMap.set(data, contentData.sys.id);

        }
      });
    }

    return { regionData, countryEntryMap: localeToEntryIdMap };
  }

  /**
   * createConversations
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async sameEntryChecking({
    sameEntry,
    isReviewPage,
    count,
    singleUpdate,
    contentType,
    locale,
    sourceValue,
    entry,
  }) {
    sameEntry.forEach((data) => {
      let translationValue = data.replaceValue
        ? data.replaceValue
        : data.translatedValue;

      if (isReviewPage && !translationValue) {
        translationValue = data.replacedValue
          ? data.replacedValue
          : data.translateValue;
      }

      if (data.translated) {
        count += 1;
      }
      const { updateValue, dataNew, countValue } = this.dataChecking({
        data,
        translationValue,
        singleUpdate,
        locale,
        contentType,
        sourceValue,
        count,
      });

      singleUpdate = updateValue;
      data = dataNew;
      count = countValue;
      data.translated = true;
    });
    return count === 0 ? this.updateToContentful(singleUpdate) : entry;
  }

  /**
   * createConversations
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  dataChecking({
    data,
    translationValue,
    singleUpdate,
    locale,
    contentType,
    sourceValue,
    count,
  }) {
    if (data.translated) {
      count += 1;
    }
    if (data.type === "RichText") {
      const documentValue = htmlToRichText(translationValue);
      singleUpdate.fields[data.key][locale] = documentValue;
    } else {
      singleUpdate.fields[data.key][locale] = translationValue;
      const fieldValue = contentType.fields.find(
        (types) => types.id === data.key
      );
      if (NewMarketContentful.checkValidations(fieldValue.validations)) {
        singleUpdate.fields[data.key][locale] = sourceValue;
      }
    }
    return { updateValue: singleUpdate, dataNew: data, countValue: count };
  }

  /**
   * createConversations
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async createConversations(entries, destLocale) {
    const conversations: any = [];
    await Promise.all(
      entries.map(async (entry) => {
        const response = await axios.post(
          `${SAATCHI_API}conversations`,
          {
            targetLocale: destLocale,
            messages: [{ content: entry.value }],
          },
          { headers }
        );
        const { conversationId } = response.data;

        conversations.push({
          conversationId,
          replacedValue: entry.replaceValue
            ? entry.replaceValue
            : entry.translateValue,
          initialValue: entry.value,
        });
      })
    );

    return conversations;
  }

  /**
   * Function to perform getConversation
   * @param {string} conversationId
   */
  async getConversation(conversationId) {
    // return translatedContent;
    return axios
      .get(`${SAATCHI_API}conversations/${conversationId}`, { headers })
      .then((saatchiResponse) => {
        // Check condition in response
        if (!saatchiResponse.data.messages) {
          throw new Error("Condition not met");
        }

        const translatedContent = saatchiResponse.data.messages.find(
          (data) => data.isUserMessage === false
        );
        if (!translatedContent) {
          throw new Error("Condition not met");
        }
        if (translatedContent) {
          return translatedContent; // Resolve with response data if condition met
        } else {
          throw new Error("Condition not met"); // Throw error to trigger retry
        }
      })
      .catch((error) => {
        // Retry the Axios call recursively
        return this.getConversation(conversationId);
      });
  }

  /**
   * createMessages
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async createMessages(conversations) {
    const approveMessages: any = [];
    await Promise.all(
      conversations.map(async (conversation) => {
        const response: any = await axios.post(
          `${SAATCHI_API}conversations/${conversation.conversationId}/messages`,
          {
            content: conversation.replacedValue,
          },
          { headers }
        );
        approveMessages.push({
          conversationId: response.data.conversationId,
          messageId: response.data.messageId,
        });
      })
    );

    return approveMessages;
  }

  /**
   * createMessages
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async approveMessages(messages, conversations) {
    const approvedMessages: any = [];
    await Promise.all(
      messages.map(async (message) => {
        const response: any = await axios.patch(
          `${SAATCHI_API}conversations/${message.conversationId}`,
          {
            approvedMessageId: message.messageId,
          },
          { headers }
        );
        const originalMessage = conversations.find(
          (item) => item.conversationId === message.conversationId
        );
        approvedMessages.push({
          replaceValue: originalMessage.replacedValue,
          initialValue: originalMessage.initialValue,
          conversationId: message.conversationId,
          approvedMessageId: response.data.messageId,
        });
      })
    );

    return approvedMessages;
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
  async updateToContentful(entry) {
    try {
      if (!entry.isArchived()) {
        const updatedEntry = await entry.update();
        // Publish updated entry
        return updatedEntry.publish();
      } else {
        return entry;
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  /**
   * convertTags.
   * @param contentTypeId
   * @param spaceId
   * @param envId
   * @param payload
   * @returns {Promise<Response>} Response
   */
  convertTags(tags: string[], totalLength) {
    if (tags.length - 1 === totalLength) {
      tags = tags.slice(1);
    }

    const promoCode = JSON.stringify(tags);

    return promoCode.replace(/[\[\]"]+/g, "");
  }

  /**
   * create entry in contentful.
   * @param contentTypeId
   * @param spaceId
   * @param envId
   * @param payload
   * @returns {Promise<Response>} Response
   */
  async createEntry(
    contentTypeId: string,
    spaceId: string,
    envId: string,
    payload: any,
    entryId: any = null
  ): Promise<any> {
    try {
      const { space } = await this.getSpace(spaceId);
      const environment = await space.getEnvironment(envId);
      if (entryId && entryId.length) {
        const createdEntryWithId = await environment.createEntryWithId(
          contentTypeId,
          entryId,
          payload
        );
        return createdEntryWithId.publish();
      }
      const createdEntry = await environment.createEntry(
        contentTypeId,
        payload
      );

      return createdEntry.publish();
    } catch (err) {
      console.log("==error====", err);
    }
  }

  /**
   * fetch translation key value
   * @param {string} contentType
   * @param {number} pageIndex
   */
  async fetchEntries(
    contentType,
    pageIndex,
    pageSize,
    isCRM?,
    auditRecord?,
    isReviewPage?,
    spaceId?
  ) {
    const { space, contentfulBackup }: any = await this.getSpace(spaceId);
    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);
    let condition;
    if (isReviewPage) {
      const entryIds = auditRecord.data.content.map((item) => item.entryId);
      condition = {
        content_type: contentType,
        "sys.id[in]": entryIds.join(","),
        select: "sys.id,fields.key,fields.value",
        limit: pageSize,
        skip: pageIndex * pageSize,
      };
    } else {
      condition = {
        content_type: contentType,
        select: "sys.id,fields.key,fields.value",
        limit: pageSize,
        skip: pageIndex * pageSize,
      };
    }

    const response = await environment.getEntries(condition);

    const entries = response.items.map((entry) => ({
      entryId: entry.sys.id,
      fields: entry.fields,
    }));

    const totalEntries = response.total;

    return { entries, totalEntries };
  }

  /**
   * search translation key value
   * @param {string} contentType
   * @param {string} value
   * @param {number} pageIndex
   */
  async searchEntries({
    contentType,
    value,
    pageIndex,
    pageSize,
    isCRM,
    auditRecord,
    isReviewPage,
    spaceId,
    locale,
  }) {
    const { space, contentfulBackup }: any = await this.getSpace(spaceId);

    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);

    let query: any = {
      content_type: contentType,
      "fields.key[match]": `.*${value}.*`,
      "fields.key[options]": "i", // Case-insensitive search
      limit: pageSize,
      skip: pageIndex * pageSize,
    };

    if (isReviewPage) {
      const entryIds = auditRecord.data.content.map((item) => item.entryId);
      query = {
        content_type: contentType,
        "sys.id[in]": entryIds.join(","),
        "fields.value[match]": `.*${value}.*`,
        "fields.value[options]": "i", // Case-insensitive search
        limit: pageSize,
        skip: pageIndex * pageSize,
      };
    }

    const response = await environment.getEntries(query);

    const entries = response.items.map((entry) => ({
      entryId: entry.sys.id,
      fields: entry.fields,
    }));

    const totalEntries = response.total;
    return { entries, totalEntries };
  }

  /**
   * fetch All contentmodels
   */
  async fetchContentModel(isCRM?, spaceId?) {
    const { space, contentfulBackup }: any = await this.getSpace(spaceId);

    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);

    const contentModels = await environment.getContentTypes({ limit: 1000 });
    const contentModelData = contentModels.items.map((contentType) => {
      return {
        modelName: contentType.name,
        modelId: contentType.sys.id,
        fields: contentType.fields,
      };
    });

    return contentModelData;
  }

  /**
   * fetch All contentmodels
   */
  async fetchMigrationModel(envId?, spaceId?) {
    const { space }: any = await this.getSpace(spaceId);

    const currentEnv = envId;
    const environment = await space.getEnvironment(currentEnv);

    const contentModels = await environment.getContentTypes({ limit: 1000 });
    const contentModelData = contentModels.items.map((contentType) => {
      return {
        modelName: contentType.name,
        modelId: contentType.sys.id,
      };
    });

    return contentModelData;
  }

  /**
   * fetching region entries from contentful
   */
  async fetchRegion(market, isCRM, spaceId, isReviewPage) {
    const { space, contentfulBackup }: any = await this.getSpace(spaceId);
    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);
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

    const regionFields = filteredRegionItems.map((region) => {
      return {
        regionSysId: region.sys.id,
        regionName: region.fields.name["en-US"],
        regionCode: region.fields.code["en-US"],
      };
    });
    return regionFields;
  }

  /**
   * fetching region entries from contentful
   */
  async fetchCountry(market, isCRM, spaceId, isReviewPage) {
    const { space, contentfulBackup }: any = await this.getSpace(spaceId);
    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;
    const environment = await space.getEnvironment(currentEnv);
    const query: any = {
      content_type: "country",
      order: "fields.title", // Assuming "name" is the field you want to order by
      "sys.archivedAt[exists]": false,
      "sys.publishedAt[exists]": true,
      limit: 1000,
    };

    const { items } = await environment.getEntries(query);
    const regionData: any = [];

    // Filter out entries with empty fields
    items.map((region) => {
      region.fields.locales["en-US"].forEach((data) => {
        regionData.push({
          regionSysId: region.sys.id,
          regionName: region.fields.title["en-US"],
          regionCode: data,
        });
      });
    });

    return regionData;
  }

  /**
   * getContentModelData
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getContentModelData() {
    const contentStatus: IContentfulMigration | null =
      await ContentfulMigrationModel.findOne({
        $or: [
          { rollBackStatus: "pending" },
          { rollBackStatus: "content type syncing" },
          { rollBackStatus: "content exporting" },
          { rollBackStatus: "content importing" },
          { status: "pending" },
          { status: "content type syncing" },
          { status: "content exporting" },
          { status: "content fetching" },
          { status: "content backup" },
          { status: "content importing" },
        ],
      }).exec();

    return contentStatus;
  }

  /**
   * fetching region entries from contentful
   */
  async fetchMigrationRegion(market, envId, spaceId, isReviewPage) {
    const { space }: any = await this.getSpace(spaceId);
    const currentEnv = envId;
    const environment = await space.getEnvironment(currentEnv);
    const queryData: any = {
      content_type: "region",
      order: "fields.name", // Assuming "name" is the field you want to order by
      "sys.archivedAt[exists]": false,
      "sys.publishedAt[exists]": true,
      limit: 1000,
    };
    const { items } = await environment.getEntries(queryData);
    const filteredRegionItems = items.filter((region) => {
      const name = region.fields?.name?.["en-US"];
      const code = region.fields?.code?.["en-US"];
      return name !== undefined && code !== undefined;
    });
    const locales = filteredRegionItems.map((region) => {
      return region.fields.code["en-US"];
    });
    return locales;
  }

  /**
   * creating new locale in contentful environments.
   */
  async createLocale(
    spaceId: string,
    environmentIds: string[],
    code: string,
    language: string,
    market: any,
    region,
    regionName
  ) {
    let results: any = [];
    const sortEnvs = await this.getSortedEnvironments(environmentIds);

    let sortedEnv = sortEnvs;
    if (IS_COUNTRY === "TRUE") {
      sortedEnv = sortEnvs.filter((item) => !item.includes("crm"));
    }

    let entryId;

    for (const envId of sortedEnv) {
      try {
        const { space } = await this.getSpace(spaceId);

        const environment = await space.getEnvironment(envId);

        let response;
        let matchingEntry;

        if (IS_COUNTRY === "TRUE") {
          const countryResponse = await this.countryMapping(
            environment,
            market,
            envId,
            code,
            results
          );
          if(!entryId) {
            entryId = countryResponse.entryId;

          }


          response = countryResponse.response;
          matchingEntry = countryResponse.matchingEntry;
          results = countryResponse.results;
          console.log("results checking above", results);
        } else {
          const resultNew = await this.fetchExistLocale({
            language,
            code,
            results,
            envId,
            market,
            spaceId,
          });
  
          results = resultNew;
        }

       

        if (IS_COUNTRY === "TRUE" && !matchingEntry) {
          console.log("env id", envId);
          console.log("entryId", entryId);

          entryId = await this.createAndUpdateEntry({
            envId,
            entryId,
            spaceId,
            market,
            code,
            entries: response.items[0],
            environment,
            region,
            regionName,
            language,
            results
          });
        } else if (IS_COUNTRY === "FALSE") {
          entryId = await this.createAndUpdateRegionEntry(
            envId,
            entryId,
            spaceId,
            market,
            language,
            code
          );
        }
      } catch (error) {
        console.log("errrrr", error);
        this.errorMapping(results, envId, error);
      }
    }

    return results;
  }

  /**
   * creating new locale in contentful environments.
   */
  async errorMapping(results, envId, error) {
    const existLocaleError = results.find((c) => c.envId === envId);
    if (!existLocaleError) {
      results.push({ envId, type: "error", error });
    }
  }

  /**
   * creating new locale in contentful environments.
   */
  async countryMapping(environment, market, envId, code, results) {
    let entryId;
    let response;
    let matchingEntry;
    try {
      const query = {
        content_type: "country",
        [`fields.code[match]`]: market,
      };

      response = await environment.getEntries(query);
      if (response.items.length > 0) {
        entryId = response.items[0].sys.id;
        const targetLocales = [code];
        matchingEntry = response.items.find((entry) => {
          const existingLocales = entry.fields.locales?.["en-US"] || [];
          return targetLocales.every((locale) =>
            existingLocales.includes(locale)
          );
        });
        if (matchingEntry) {
          console.log("Locales already exist in entry:", matchingEntry.sys.id);
          results.push({
            envId,
            type: "existing",
            alreadyExists: matchingEntry,
          });
        }
      }
    } catch (error) {
      this.errorMapping(results, envId, error);
    }
    return {
      entryId,
      response,
      matchingEntry,
      results,
    };
  }

  /**
   * creating new locale in contentful environments.
   */
  async fetchExistLocale({ language, code, results, envId, market, spaceId }) {
    try {
      const fetchExisting = async () => {
        return Contentful.request({
          name: `/spaces/${spaceId}/environments/${envId}/locales?limit=1000`,
          method: "GET",
          data: null,
          auth: true,
          spaceId,
        });
      };

      const existingRateLocales = await this.handleRateLimitError(
        fetchExisting
      );

      const alreadyExists = existingRateLocales.items.find(
        (item: any) => item.code === code
      );

      if (alreadyExists && !results.some((a) => a.envId === envId)) {
        results.push({ envId, type: "existing", alreadyExists });
      }
      let name = `${language}`;
      if (IS_COUNTRY !== "TRUE") {
        if (market.name) {
          name = `${language} (${market.name})`;
        }
      }
      if (!alreadyExists) {
        try {
          const contentfulRequest = async () => {
            return Contentful.request({
              name: `spaces/${spaceId}/environments/${envId}/locales`,
              data: {
                code,
                name,
                optional: true,
              },
              method: "POST",
              auth: true,
              sendJSON: true,
              spaceId,
            });
          };
          const localeCreated = await this.handleRateLimitError(
            contentfulRequest
          );
          const existLocaleSuccess = results.find((b) => b.envId === envId);
          if (!existLocaleSuccess) {
            results.push({ envId, type: "created", localeCreated });
          }
        } catch (error) {
          this.errorMapping(results, envId, error);
        }
      }
      return results;
    } catch (error) {
      this.errorMapping(results, envId, error);
    }
  }

  /**
   * getFieldValidations.
   */
  async handleRateLimitError(
    fetchFn: () => Promise<any>,
    retries = 3,
    delay = 1000
  ) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetchFn(); // Try the request
      } catch (error: any) {
        if (
          error.response &&
          error.response.status === 429 &&
          i < retries - 1
        ) {
          const retryAfter = error.response.headers["retry-after"] || delay;
          console.log(`Rate limit hit. Retrying after ${retryAfter}ms...`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * getSortedEnvironments.
   */
  async getSortedEnvironments(environmentIds) {
    // We need to process CONTENTFUL_ENVIRONMENT_BACKUP environment first.
    const sortedEnvironments = [...environmentIds].sort((a, b) => {
      if (a === CONTENTFUL_ENVIRONMENT_BACKUP) {
        return -1;
      }
      if (b === CONTENTFUL_ENVIRONMENT_BACKUP) {
        return 1;
      }
      return 0;
    });
    const sortEnvs = [...new Set(sortedEnvironments)];
    return sortEnvs;
  }

  /**
   * createAndUpdateEntry.
   */
  async createAndUpdateEntry({
    envId,
    entryId,
    spaceId,
    market,
    code,
    entries,
    environment,
    region,
    regionName,
    language,
    results
  }) {
    let localeCreated;
    if (!entryId) {
      const createdEntry = await this.createEntry("country", spaceId, envId, {
        fields: {
          title: { "en-US": language },
          locales: { "en-US": [code] },
          code: { "en-US": market },
          regionCode: { "en-US": region },
          regionName: { "en-US": regionName },
        },
      });
      console.log("created entry", createdEntry);
      localeCreated =  createdEntry;

      entryId = createdEntry.sys.id;
    } else if (entryId) {
      if(entries) {
        const locales = entries.fields.locales["en-US"];
        locales.push(code);
        try {
          // Update the existing entry
          entries.fields = {
            title: { "en-US": `${language}` },
            locales: { "en-US": locales },
            code: { "en-US": market },
            regionCode: { "en-US": entries.fields.regionCode["en-US"] },
            regionName: { "en-US": entries.fields.regionName["en-US"] },
          };
          const updatedEntry = await entries.update();
          // Publish the entry
          await updatedEntry.publish();
          localeCreated =  updatedEntry;
          console.log("Entry updated successfully!");
        } catch (error) {
          if (error.name === "NotFound") {
            // Entry does not exist, so create a new one
            await environment.createEntryWithId("country", entryId, {
              fields: {
                title: { "en-US": `${language}` },
                locales: { "en-US": locales },
                code: { "en-US": `${market}` },
                regionCode: entries.fields.regionCode["en-US"],
              },
            });
            console.log("Entry created successfully!");
          } else {
            console.error("Error occurred:", error);
          }
        }
      } else {
        const updateEntry = await this.createEntry(
          "country",
          spaceId,
          envId,
          {
            fields: {
              title: { "en-US": language },
              locales: { "en-US": [code] },
              code: { "en-US": market },
              regionCode: { "en-US": region },
              regionName: { "en-US": regionName },
            },
          },
          entryId
        );
        localeCreated =  updateEntry;

      }
     
    }
    results = results.push({ envId, type: "created", localeCreated });
    console.log("resultssss checking", results);

    return entryId;
  }

  /**
   * createAndUpdateEntry.
   */
  async createAndUpdateRegionEntry(
    envId,
    entryId,
    spaceId,
    market,
    language,
    code
  ) {
    if (!entryId) {
      const createdEntry = await this.createEntry("region", spaceId, envId, {
        fields: {
          name: {
            "en-US": `${market.name} - ${language}`,
          },
          code: {
            "en-US": code,
          },
        },
      });
      entryId = createdEntry.sys.id;
    } else if (entryId) {
      await this.createEntry(
        "region",
        spaceId,
        envId,
        {
          fields: {
            name: {
              "en-US": `${market.name} - ${language}`,
            },
            code: {
              "en-US": code,
            },
          },
        },
        entryId
      );
    }
    return entryId;
  }

  /**
   * getFieldValidations.
   */

  async getFieldValidations(entryId, fieldId, spaceId) {
    try {
      const { space, contentfulBackup }: any = await this.getSpace(spaceId);
      const currentEnv = contentfulBackup;
      const environment = await space.getEnvironment(currentEnv);
      // Fetch the entry using its ID
      const entry = await environment.getEntry(entryId);

      // Extract the content type ID from the entry's sys property
      const contentTypeId = entry.sys.contentType.sys.id;

      // Fetch the content type definition
      const contentType = await environment.getContentType(contentTypeId);

      // Find the field definition within the content type
      const fieldDefinition = contentType.fields.find(
        (field) => field.id === fieldId
      );

      if (!fieldDefinition) {
        throw new Error(
          `Field with ID ${fieldId} not found in content type ${contentTypeId}`
        );
      }

      // Extract the validations from the field definition
      const validations = fieldDefinition.validations;

      // Find and return the character limit validation, if it exists
      const charLimitValidation = validations.find(
        (validation) => validation.size
      );

      if (charLimitValidation) {
        if (!charLimitValidation.size.max) {
          return this.getOverallLimit(fieldDefinition);
        }
        return charLimitValidation.size.max;
      }
      return this.getOverallLimit(fieldDefinition);
    } catch (error) {
      console.error(`Error fetching validations: ${error.message}`);
    }
  }
  /**
   * getOverallLimit.
   */

  getOverallLimit(fieldDefinition) {
    if (fieldDefinition.type === "RichText") {
      return 200000;
    }
    if (fieldDefinition.type === "Text") {
      return 50000;
    } else {
      return 256;
    }
  }

  /**
   * update payload.
   */
  updateTranslationPayload(entry, translatedValue, isReviewPage) {
    const update = {
      "data.content.$[transl].initialValue": entry.initialValue,
      "data.content.$[transl].existingValue": entry.existingValue,
      "data.content.$[transl].value": translatedValue,
      "data.content.$[transl].replaceValue": entry.replaceValue
        ? entry.replaceValue
        : entry.replacedValue,
      "data.content.$[transl].translateValue": entry.translateValue,
      "data.content.$[transl].contentModelName": entry.contentModelName,
    };

    if (isReviewPage) {
      update["data.content.$[transl].isUploaded"] = true;
    }
    return update;
  }

  /**
   * get module name.
   */
  getModuleName(req) {
    return req.query.isCRM === "true"
      ? "CRM Translation"
      : "Content Translation";
  }

  /**
   * get module name.
   */
  getReviewerModuleName(isReviewPage) {
    return isReviewPage ? "Reviewer Translation" : "Content Translation";
  }
  /**
   * getConversationstatus
   * @param {Request} req Request Object
   * @param res
   */

  getConversationStatus(translatedContent) {
    return translatedContent?.content ? "Success" : "pending";
  }

  /**
   * getConversationData
   * @param {Request} req Request Object
   * @param res
   */
  async getConversationData({ entry, auditValue, translated }) {
    if (!entry.orr.translatedValue) {
      const response = await axios.get(
        `${SAATCHI_API}conversations/${entry.conversationId}`,
        { headers }
      );
      console.log(JSON.stringify(response.data.messages));

      const translatedContent = response.data.messages.find(
        (data) => data.isUserMessage === false
      );
      const getConStatus = await this.getConversationStatus(translatedContent);
      if (translatedContent) {
        await AuditModel.updateOne(
          {
            _id: Types.ObjectId(auditValue._id),
            "data.translated.conversationId": translatedContent.conversationId,
          },
          {
            $set: {
              "data.translated.$[transl].orr.translatedValue":
                translatedContent.content,
              "data.translated.$[transl].status": getConStatus,
            },
          },
          {
            arrayFilters: [
              {
                "transl.conversationId": translatedContent.conversationId,
              },
            ],
          }
        );

        entry.translatedValue = translatedContent.content;

        translated.push({
          key: entry.key,
          value: entry.translatedValue,
          status: getConStatus,
          orr: entry,
          conversationId: translatedContent.conversationId,
        });
      }
    } else {
      await AuditModel.updateOne(
        {
          _id: Types.ObjectId(auditValue._id),
          "data.translated.conversationId": entry.conversationId,
        },
        {
          $set: {
            "data.translated.$[transl].status": "Success",
          },
        },
        {
          arrayFilters: [
            {
              "transl.conversationId": entry.conversationId,
            },
          ],
        }
      );
      translated.push({
        key: entry.key,
        value: entry.orr.translatedValue,
        orr: entry,
        status: "Success",
        conversationId: entry.conversationId,
      });
    }
    return translated;
  }

  /**
   * To format the file name
   * @param url - url to file
   * @returns string - file name
   */
  formatZipURL(url: string) {
    const regex = /\/([^/]*_assets)/;
    const match = url?.match(regex);
    if (match && match[1]) {
      const newFilename = `${match[1]}`;
      return newFilename;
    } else {
      return "";
    }
  }

  /**
   * getTableData
   * @param migrationHistory - Migration record from database
   * @returns formatted migration history
   */
  formatHistoryTableData(migrationHistory) {
    const formattedData = migrationHistory.map((record) => {
      const modelNames = record.contentModels || [];
      const totalProcessedCount = Object.values(
        record.totalEntryinCsv || {}
      ).reduce(
        (outerSum: number, modelCounts: any) =>
          outerSum +
          Object.values(modelCounts || {}).reduce(
            (innerSum: number, count: any) => innerSum + count,
            0
          ),
        0
      );
      const lastProcessedCount = Object.values(
        record.lastProcessed || {}
      ).reduce((sum: number, count: any) => sum + count, 0);
      const overAllStatus = `${lastProcessedCount} / ${totalProcessedCount}`;

      const formattedStatusData = this.formatStatusLog(modelNames, record);
      const formattedErrorLog = this.formatErrorLog(record);

      delete record?.errorLog;
      record.contentModels = record?.contentModels?.map((model) =>
        model.replace(/_/g, " ")
      );

      return {
        ...record,
        formatedCsvName: `${record.filename}.xlsx`,
        formatedZipName: record.mediaPath
          ? `${this.formatZipURL(record.mediaPath)}.zip`
          : "",
        formatedmediaFile: record.mediaPath
          ? this.formatZipURL(record.mediaPath)
          : " ",
        createdAt: record.createdAt || "",
        overAllStatus,
        formattedStatusData,
        formattedErrorLog,
      };
    });

    return formattedData;
  }

  /**
   * format status log
   * @param modelNames - list of model names
   * @param record - migration record
   * @returns formatted status
   */
  formatStatusLog(modelNames, record) {
    const formattedStatusData = modelNames?.flatMap((modelName) => {
      const uploadCountsByLocale =
        typeof record.uploadCount === "object" && record.uploadCount[modelName]
          ? record.uploadCount[modelName]
          : {};

      const totalEntriesByLocale =
        typeof record.totalEntryinCsv === "object" &&
        record.totalEntryinCsv[modelName]
          ? record.totalEntryinCsv[modelName]
          : {};

      const skippedFieldsByModel = Array.isArray(
        record.skippedFields?.[modelName]
      )
        ? record.skippedFields[modelName]
        : [];

      const status = record.status || "Unknown";

      return Object.keys(totalEntriesByLocale).map((locale) => {
        const uploadCount = uploadCountsByLocale[locale] || 0;
        const totalEntries = totalEntriesByLocale[locale] || 0;

        const failedCount =
          status !== "Pending" && status !== "Started" && totalEntries
            ? totalEntries - uploadCount
            : 0;

        const skippedColumns = skippedFieldsByModel.length
          ? skippedFieldsByModel.join(", ")
          : "-";

        return {
          modelName: modelName.replace(/_/g, " "),
          totalRecord: totalEntries,
          uploadCount,
          failedCount,
          skippedColumns,
          locale,
        };
      });
    });

    return formattedStatusData;
  }

  /**
   * Format the error log for a migration record.
   * @param record - Migration record.
   * @returns Formatted errors.
   */
  formatErrorLog(record) {
    if (!this.isValidErrorLog(record.errorLog)) {
      return [];
    }

    const formattedErrorLog: any = [];
    Object.entries(record.errorLog).forEach(([modelName, modelErrors]) => {
      if (Array.isArray(modelErrors)) {
        modelErrors.forEach((log) => {
          formattedErrorLog.push(...this.processLogEntry(log, modelName));
        });
      }
    });

    return formattedErrorLog;
  }

  /**
   * Check if the error log is valid.
   * @param errorLog - The error log to check.
   * @returns True if error log is valid; otherwise, false.
   */
  isValidErrorLog(errorLog) {
    return errorLog && typeof errorLog === "object" && !Array.isArray(errorLog);
  }

  /**
   * Process an individual log entry.
   * @param log - The log entry to process.
   * @param modelName - The model name associated with the log entry.
   * @returns An array of formatted errors.
   */
  processLogEntry(log, modelName) {
    try {
      if (log.name === "InvalidEntry" || log.name === "ValidationFailed") {
        return this.parseInvalidEntry(log, modelName);
      }
      return [log];
    } catch (e) {
      console.warn("Failed to parse error message:", e);
      return [];
    }
  }

  /**
   * Parse an "InvalidEntry" log entry.
   * @param log - The log entry to parse.
   * @param modelName - The model name associated with the log entry.
   * @returns An array of formatted errors.
   */
  parseInvalidEntry(log, modelName) {
    const tempLog = JSON.parse(log?.message);
    if (!tempLog) {
      return [];
    }

    const uniqueErrors = tempLog.details.errors.filter(
      (error, index, self) =>
        error?.message?.startsWith("Invalid field locale code") &&
        self.findIndex((e) => e.message === error.message) === index
    );

    return tempLog.details.errors
      .filter(
        (error) =>
          !error.message?.startsWith("Invalid field locale code") ||
          uniqueErrors.includes(error)
      )
      .map((error) => this.formatError(error, log, modelName))
      .filter(Boolean);
  }

  /**
   * Parse an "InvalidEntry" log entry.
   * @param log - The log entry to parse.
   * @param modelName - The model name associated with the log entry.
   * @returns An array of formatted errors.
   */
  formatError(error, log, modelName) {
    const commonProps = {
      model: modelName.replace(/_/g, " "),
      location: error?.path?.[1] || "",
      entryName: log?.entryName,
      locale: log?.locale,
    };

    if (error?.message?.startsWith("Invalid field locale code")) {
      return {
        ...commonProps,
        type: "Invalid locale",
        locale: "Invalid",
        location: "Locale",
        message: error.details,
      };
    }

    const message = this.generateErrorMessage(error);
    if (!message) {
      return null;
    }

    return {
      ...commonProps,
      type: error?.type === "Symbol" ? "Character Limit" : "Invalid Input",
      message,
    };
  }

  /**
   * Generate error messages based on error type and details.
   */
  generateErrorMessage(error) {
    if (error?.name === "type") {
      if (error?.type === "Symbol") {
        return `Field cannot exceed ${
          +error?.details?.match(/\d+/g) + 1
        } characters`;
      }
      if (error?.type === "Boolean") {
        return error.details;
      }
    } else if (error?.name === "in") {
      return `The value is incorrect, expected value: ${error.expected.join(
        ", "
      )}`;
    }
    return "";
  }
  

  /**
   * get Gen AI token.
   * @param clientId - clientID.
   * @returns token.
   */
  async getGenAIToken() {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: COGNITIVE_SERVICES,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Access Token:", response.data.access_token);
    genAIToken = response.data.access_token;

    return genAIToken;
  }

  /**
   * fetch Gen AI token.
   * @param clientId - clientID.
   * @returns token.
   */
  async fetchAItoken() {
    let isTokenExpired = false;
    if (genAITokenDate) {
      isTokenExpired = this.checkTokenDate();
    }

    if (!genAIToken || isTokenExpired) {
      await this.getGenAIToken();
      genAITokenDate = new Date();
    }
    return genAIToken;
  }

  /**
   * fetch Gen AI token.
   * @param clientId - clientID.
   * @returns token.
   */
  checkTokenDate() {
    const condition = moment().diff(moment(genAITokenDate), "minutes") >= 50;
    return condition;
  }

  /**
   * handle error
   * @param clientId - clientID.
   * @returns token.
   */
  handleTranslateErr(e, errorData) {
    if(e && e.response?.data?.detail?.length && e.response.data.detail[0].type === "enum"){
      errorData = "Selected locale is not supported by GEN AI";
    }
    else{
      errorData = "Some Contents got failed..";
    }
    return errorData;    
  }

  /**
   * check crm 
   * @param clientId - clientID.
   * @returns token.
   */
  checkCRM(req) {
    return req.query.isCRM === "true" ? "crm" : "";    
  }

  /**
   * get translated value
   * @param clientId - clientID.
   * @returns token.
   */
  getTranslatedValue(entry, isReviewPage) {
    let translatedValue = entry.replaceValue || entry.translatedValue;


    if (isReviewPage && !translatedValue) {
      translatedValue = entry.replacedValue ?? entry.translateValue;
    }
    
    return translatedValue;
  }

  /**
   * remove tranlated date
   * @param clientId - clientID.
   * @returns token.
   */
    async removeContentfulTranslatedData(contentModel) {
      try {
        const contentfulSpaceId = CONTENTFUL_SPACE_ID;
        const contentfulBackup = CONTENTFUL_ENVIRONMENT;
        const space = await this.client.getSpace(contentfulSpaceId);
        const environment = await space.getEnvironment(contentfulBackup);
        let skip = 0;
        const limit = 100; // Max limit per request
        let entries;
     
        do {
          entries = await environment.getEntries({content_type: contentModel,  skip, limit });
          
          for (const entry of entries.items) {
            let updated = false;
     
            for (const field in entry.fields) {
              if (Object.prototype.hasOwnProperty.call(entry.fields, field)) {
                const fieldLocales = entry.fields[field];
            
                // Keep only 'en-US' and remove other locales
                entry.fields[field] = { "en-US": fieldLocales["en-US"] };
            
                updated = true;
              }
            }
     
            if (updated) {
              const updateEntry = await entry.update();
              updateEntry.publish();
              console.log(`Updated entry: ${entry.sys.id}`);
            }
          }
     
          skip += limit;
        } while (entries.items.length > 0);
        // return entries;
        console.log("All locales except en-US have been removed.");
      } catch (error) {
        console.error("Error removing locales:", error);
      }
    }
}


export default new ContentfulHelper();
