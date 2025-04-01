import { createClient } from "contentful-management";
import { htmlToRichText } from "html-to-richtext-contentful";
import { get } from "lodash";
import { NewMarketContentful } from "../../lib";
import axios from "axios";

const CRM_CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;
const CRM_CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "CONTENTFUL_ENVIRONMENT_BACKUP"
)!;
const MES_CRM_SIT = get(process.env, "CRM_SIT")!;
const CRM_CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CRM_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const CRM_US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP"
)!;
const CRM_US_WEBSITE_CONTENTFUL_ENVIRONMENT = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_ENVIRONMENT"
)!;

const CRM_US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;
const CRM_US_WEBSITE_CONTENTFUL_PROJECT_NAME = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_PROJECT_NAME"
)!;
const CRM_US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const CRM_SAATCHI_API = process.env.SAATCHI_API;
const CRMAPIKEY = process.env.SAATCHI_KEY;

const headers = {
  Accept: "application/json",
  "x-gen-ai-translation-api-key": CRMAPIKEY,
  "Content-Type": "application/json",
};
class CRMMigrationHelper {
  private client;
  private CRMregexSt;
  private usClient;

  constructor() {
    this.client = createClient({
      accessToken: CRM_CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.usClient = createClient({
      accessToken: CRM_US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.CRMregexSt = /^(?:\s+|\s+)$/g;
  }

  /**
   * Get space
   * @param spaceId
   * @returns Response
   */
  async getCRMSpace(spaceId) {
    let contentfulCRMSpaceId = CRM_CONTENTFUL_SPACE_ID;
    let contentfulBackup = CRM_CONTENTFUL_ENVIRONMENT;
    let space = await this.client.getSpace(contentfulCRMSpaceId);
    if (spaceId === CRM_US_WEBSITE_CONTENTFUL_SPACE_ID) {
      contentfulCRMSpaceId = CRM_US_WEBSITE_CONTENTFUL_SPACE_ID;
      contentfulBackup = CRM_US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP;
      space = await this.usClient.getSpace(contentfulCRMSpaceId);
    }

    return { space, contentfulBackup };
  }

  /**
   * convertTags.
   * @param contentTypeId
   * @param spaceId
   * @param envId
   * @param payload
   * @returns {Promise<Response>} Response
   */
  convertCRMTags(tags: string[],totalLength) {
    if (
      tags.length - 1 === totalLength
    ) {
      tags = tags.slice(1);
    }

    const promoCodeCRM = JSON.stringify(tags);

    return promoCodeCRM.replace(/[\[\]"]+/g, "");
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
  async updateCRMEntry( // NOSONAR
    entryId,
    translatedValue,
    locale: string,
    isCRM?,
    spaceId?,
    key?,
    type?,
    details?,
    isReviewPage?,
    sourceValue?
  ) { // NOSONAR
    const { space }: any = await this.getCRMSpace(spaceId);
    const currentEnv = MES_CRM_SIT;
    const environment = await space.getEnvironment(currentEnv);

    // Fetch entry by ID
    const entryCRM = await environment.getEntry(entryId);

    const contentTypeCRM = await environment.getContentType(
      entryCRM.sys.contentType.sys.id
    );

    const sameCRMEntry = details.filter((item) => item.entryId === entryId);
    const singleCRMUpdate = entryCRM;
    let count = 0;
    if (sameCRMEntry.length > 1) {
      sameCRMEntry.forEach((data) => {
        let translationCRMValue = data.replaceValue
          ? data.replaceValue
          : data.translatedValue;

          if (isReviewPage && !translationCRMValue) {
            translationCRMValue = data.replacedValue
              ? data.replacedValue
              : data.translateValue;
          }
        
          if (data.translated) {
            count += 1;
          }

        if (data.type === "RichText") {
          const documentCRMValue = htmlToRichText(translationCRMValue);
          singleCRMUpdate.fields[data.key][locale] = documentCRMValue;
        } else {
          singleCRMUpdate.fields[data.key][locale] = translationCRMValue;
          const fieldCRMValue = contentTypeCRM.fields.find(
            (types) => types.id === data.key
          );
          if (NewMarketContentful.checkValidations(fieldCRMValue.validations)) {
            singleCRMUpdate.fields[data.key][locale] = sourceValue;
          }
        }
        data.translated = true;
      });
        return count === 0 ? this.updateToContentfulCRM(singleCRMUpdate) : entryCRM;

    } else {
      if (type === "RichText") {
        const documentCRMValue = htmlToRichText(translatedValue);
        entryCRM.fields[key][locale] = documentCRMValue;
      } else {
        entryCRM.fields[key][locale] = translatedValue;
        const fieldCRMValue = contentTypeCRM.fields.find((types) => types.id === key);

        if (NewMarketContentful.checkValidations(fieldCRMValue.validations)) {
          entryCRM.fields[key][locale] = sourceValue;
        }
      }

      return this.updateToContentfulCRM(entryCRM);
    }
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
  async updateToContentfulCRM(entry) {
    try {
      if (!entry.isArchived()) {
        const updatedCRMEntry = await entry.update();
        // Publish updated entry
        return updatedCRMEntry.publish();
      } else {
        return entry;
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  /**
   * createConversations
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async createCRMConversations(entries, destLocale) {
    const conversationsCRM: any = [];
    await Promise.all(
      entries.map(async (entry) => {
        const responseCRM = await axios.post(
          `${CRM_SAATCHI_API}conversations`,
          {
            targetLocale: destLocale,
            messages: [{ content: entry.value }],
          },
          { headers }
        );
        const { conversationId } = responseCRM.data;

        conversationsCRM.push({
          conversationId,
          replacedValue: entry.replacedCRMValue ? entry.replacedCRMValue : entry.translateValue,
          initialValue: entry.value,
        });
      })
    );

    return conversationsCRM;
  }

  /**
   * createMessages
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async createCRMMessages(conversations) {
    const approveCRMMessages: any = [];
    await Promise.all(
      conversations.map(async (conversation) => {
        const response: any = await axios.post(
          `${CRM_SAATCHI_API}conversations/${conversation.conversationId}/messages`,
          {
            content: conversation.replacedValue,
          },
          { headers }
        );
        approveCRMMessages.push({
          conversationId: response.data.conversationId,
          messageId: response.data.messageId,
        });
      })
    );

    return approveCRMMessages;
  }

  /**
   * createMessages
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */

  async approveCRMMessages(messages, conversations) {
    const approvedCRMMessages: any = [];
    await Promise.all(
      messages.map(async (message) => {
        const responseCRM: any = await axios.patch(
          `${CRM_SAATCHI_API}conversations/${message.conversationId}`,
          {
            approvedMessageId: message.messageId,
          },
          { headers }
        );
        const originalCRMMessage = conversations.find(
          (item) => item.conversationId === message.conversationId
        );
        approvedCRMMessages.push({
          replaceValue: originalCRMMessage.replacedValue,
          initialValue: originalCRMMessage.initialValue,
          conversationId: message.conversationId,
          approvedMessageId: responseCRM.data.messageId,
        });
      })
    );

    return approvedCRMMessages;
  }
  /**
   * update payload.
   */
    updateTranslationPayload(entry, translatedCRMValue, isReviewPage) {
      const updateCRM = {
        "data.content.$[transl].initialValue": entry.initialValue,
        "data.content.$[transl].existingValue": entry.existingValue,
        "data.content.$[transl].value": translatedCRMValue,
        "data.content.$[transl].replaceValue": entry.replaceValue || entry.replacedValue,
        "data.content.$[transl].translateValue": entry.translateValue,
        "data.content.$[transl].contentModelName": entry.contentModelName,
      };

      if (isReviewPage) {
        updateCRM["data.content.$[transl].isUploaded"] = true;
      }
      return updateCRM;
  }
}

export default new CRMMigrationHelper();
