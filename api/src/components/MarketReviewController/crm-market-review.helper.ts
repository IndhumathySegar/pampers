import { createClient } from "contentful-management";
import { get } from "lodash";
import contentfulHelper from "../ContentfulController/contentful.helper";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
const MES_CRM_SIT = get(process.env, "CRM_SIT")!;
const CRM_CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CRM_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const CRM_US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

class CrmMarketReviewHelper {
  private CRMClient;
  private CRMregexSt;

  constructor() {
    this.CRMClient = createClient({
      accessToken: CRM_CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.CRMregexSt = /^(?:\s+|\s+)$/g;
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
  async updateCRMEntry(
    entryId,
    translatedValue,
    locale: string,
    currentEnv,
    key
  ): Promise<Response> {
    const CRMSpace = await this.CRMClient.getSpace(CRM_CONTENTFUL_SPACE_ID);
    const environmentCRM = await CRMSpace.getEnvironment(currentEnv);

    // Fetch entry by ID
    const entryCRM = await environmentCRM.getEntry(entryId);
    // Update fields for entry
    entryCRM.fields[key][locale] = translatedValue;

    const updatedCRMEntry = await entryCRM.update();

    // Publish updated entry
    return updatedCRMEntry.publish();
  }

  /**
   * escapeRegExp
   * @param search
   */
  escapeCRMRegExp(search) {
    return search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * fetch translation key value
   * @param {string} contentType
   * @param {number} pageIndex
   */
  async fetchEntriesCRM({
    currentEnv,
    filter,
    pageSize,
    pageIndex,
    contentModel,
    sourceLocale,
    destination,
    entryIds,
    isReviewPage,
  }) {
    const spaceCRM = await this.CRMClient.getSpace(CRM_CONTENTFUL_SPACE_ID);
    const environmentCRM = await spaceCRM.getEnvironment(currentEnv);

    const responseCRM = await environmentCRM.getEntries({
      query: filter,
      limit: pageSize,
      skip: pageIndex,
    });

    const newCRMResult = await this.getCRMEntries(
      contentModel,
      responseCRM.items,
      sourceLocale,
      destination,
      entryIds,
      isReviewPage
    );

    // If the retrieved entries are less than the desired page size, fetch the next page
    if (newCRMResult.length < pageSize && responseCRM.total > pageIndex + pageSize) {
      const remainingCRMEntries = pageSize - newCRMResult.length;
      const nextCRMResults: any = await this.fetchEntriesCRM({
        currentEnv,
        filter,
        pageSize: remainingCRMEntries,
        pageIndex: Number(pageIndex) + Number(pageSize),
        contentModel,
        sourceLocale,
        destination,
        entryIds,
        isReviewPage,
      });
      if (Array.isArray(nextCRMResults)) {
        newCRMResult.push(...nextCRMResults);
      } else {
        newCRMResult.push(...nextCRMResults.entries);
      }
    }
    const totalEntries = responseCRM.total;

    return { entries: newCRMResult, totalEntries };
  }

  /**
   * fetch All contentmodels
   */
  async fetchContentCRMModel(currentEnv) {
    const spaceCRM = await this.CRMClient.getSpace(CRM_CONTENTFUL_SPACE_ID);

    const environmentCRM = await spaceCRM.getEnvironment(currentEnv);

    const contentModelsCRM = await environmentCRM.getContentTypes({ limit: 1000 });

    return contentModelsCRM.items;
  }

  /**
   * fetch All contentmodels
   */
  async fetchCRMMesModel(spaceId, isCRM) {
    const { space, contentfulCRMBackup }: any = await contentfulHelper.getSpace(
      spaceId
    );

    const currentEnv =
      isCRM === "true" && spaceId !== CRM_US_WEBSITE_CONTENTFUL_SPACE_ID
        ? MES_CRM_SIT
        : contentfulCRMBackup;

    const environmentCRM = await space.getEnvironment(currentEnv);

    const contentModelsCRM = await environmentCRM.getContentTypes({ limit: 1000 });

    // Filter content models to include only those with localized fields
    const contentModelsCRMWithLocalizedFields = contentModelsCRM.items.filter(
      (contentModel) => {
        // Check if any field in the content model is localized
        const hasLocalizedCRMFields = contentModel.fields.some(
          (field) => field.localized === true && field.linkType !== "Asset"
        );
        return hasLocalizedCRMFields;
      }
    );

    return contentModelsCRMWithLocalizedFields;
  }

  /**
   * fetch translation key value
   * @param {string} contentType
   * @param {number} pageIndex
   */
  async fetchMesCRMEntries({
    value,
    searchValue,
    type,
    pageSize,
    pageIndex,
    contentModel,
    sourceLocale,
    destination,
    isReviewPage,
    spaceId,
    isCRM,
    newResult,
    auditRecord,
    extags,
  }) {
    const { space} = await contentfulHelper.getSpace(
      spaceId
    );

    const currentCRMEnv = MES_CRM_SIT;

    const environmentCRM = await space.getEnvironment(currentCRMEnv);

    // Convert content type IDs to a comma-separated string
    const contentTypeIds = contentModel.map(({ sys }) => sys.id).join(",");

    const queryCRM = await this.buildCRMQuery(pageSize,pageIndex, value, isReviewPage, searchValue, type, contentTypeIds, extags);

    let uniqueCRMEntries;

    if (isReviewPage === "true") {
      let tagCRMEntries;
      uniqueCRMEntries = Array.from(
        new Map(
          auditRecord.data.content.map((item) => [item.entryId, item])
        ).values()
      );

      if (type) {
        uniqueCRMEntries = uniqueCRMEntries.filter((newItem) =>
          type.includes(newItem.contentModelName)
        );
      }

      if (value || searchValue) {
        if (value) {
          queryCRM["metadata.tags.sys.id[in]"] = value;
        }

        queryCRM.limit = 1000;
        queryCRM.skip = 0;
        tagCRMEntries = await environmentCRM.getEntries(queryCRM);

        const tagCRMEntryIds = new Set(
          tagCRMEntries.items.map((item) => item.sys.id)
        );
        uniqueCRMEntries = uniqueCRMEntries.filter((item) => {
          const isCRMPresent = tagCRMEntryIds.has(item.entryId);
          if (!isCRMPresent) {
            console.log(`EntryId ${item.entryId} not found in tagEntryIds`);
          }
          return isCRMPresent;
        });
      }
      console.log("Pagination checking", uniqueCRMEntries);
      // Extract unique entries based on entryId

      // Calculate the start index for pagination
      const skip = Number(pageIndex) * Number(pageSize);

      // Paginate the unique array manually
      const paginatedCRMArray = uniqueCRMEntries.slice(skip, skip + Number(pageSize));

      // Map entryIds for the query
      const entryIds = paginatedCRMArray.map((item: any) => item.entryId);

      // Convert entryIds to the query format
      queryCRM["sys.id[in]"] = entryIds.join(",");
      delete queryCRM.limit;
      delete queryCRM.skip;
    }
    // Fetch entries for the specified content type IDs and pagination
    const response = await environmentCRM.getEntries(queryCRM);

    // Process and append retrieved entries to newResult array
    const localCRMResult = await this.getCRMEntries(
      contentModel,
      response.items,
      sourceLocale,
      destination,
      auditRecord?.data?.content,
      isReviewPage
    );

    // Append localResult entries to newResult array
    // localResult.map((newItem) => {
    //   const localCondition = newResult.find(
    //     (existItem) =>
    //       newItem.entryId === existItem.entryId && newItem.key === existItem.key
    //   );
    //   if (!localCondition && newResult.length < pageSize) {
    //     newResult.push(newItem);
    //   }
    // });

    return { entries: localCRMResult, totalEntries: localCRMResult.length };
  }


  /**
   * build CRM query
   * @returns {Promise<Response>} Response
   */

   async buildCRMQuery(pageSize,pageIndex, value, isReviewPage, searchValue, type, contentTypeIds, extags) { // NOSONAR
      const queryCRM: any = {
        query: searchValue,
        "sys.archivedAt[exists]": false,
        "sys.publishedAt[exists]": true,
        limit: Number(pageSize),
        skip: Number(pageIndex) * Number(pageSize),
      };
      
      if (isReviewPage !== "true") {
        queryCRM["sys.contentType.sys.id[in]"] = type || contentTypeIds;
      
        if (value) {
          queryCRM["metadata.tags.sys.id[in]"] = value;
        }
        if (extags) {
          queryCRM["metadata.tags.sys.id[nin]"] = extags;
        }
      }
      return queryCRM;
    }

  /**
   * isOnlyHyperlink
   * @returns {Promise<Response>} Response
   */

  isOnlyCRMHyperlink(text) {
    // Regular expression to match full URLs
    const urlPatternCRM =
      /^(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])$/i; // NOSONAR
    return urlPatternCRM.test(text);
  }

  /**
   * isOnlyHyperlink
   * @returns {Promise<Response>} Response
   */
  isOnlyCRMDeepLink(text) {
    // Regular expression to match deep links (custom URL schemes)
    const deepLinkPatternCRM = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\/[^\s]*$/i; // NOSONAR
    return deepLinkPatternCRM.test(text);
  }

  /**
   * Get Entries
   * @param contentModel
   * @param entries
   * @param sourceLocale
   * @returns {Promise<Response>} Response
   */

  async getCRMEntries(
    contentModel,
    entries,
    sourceLocale,
    destLocale,
    auditContent,
    isReviewPage
  ) {
    let newCRMResult: any = [];

    await Promise.all(
      entries.map(async (item) => {
        const contentCRMType = contentModel.find(
          (content) => content.sys.id === item.sys.contentType.sys.id
        );

        if (contentCRMType && contentCRMType.fields) {
          const isLabelCRMLocale = contentCRMType.fields.find(
            (fieldValue) =>
              contentCRMType.displayField === fieldValue.id &&
              fieldValue.localized === true
          );
            await Promise.all(
              contentCRMType.fields
                .filter((fieldValue) => fieldValue.localized === true)
                .map(async (entry) => {
                  if (
                    this.getCRMLocaleCondition(sourceLocale, item.fields, item.fields[entry.id]) &&
                    item.fields[entry.id][sourceLocale] !== undefined &&
                    item.fields[entry.id][sourceLocale] !== null &&
                    item.fields[entry.id][sourceLocale] !== "" && 
                    this.getCRMCondition(
                      entry,
                      item.fields[entry.id][sourceLocale]
                    )
                  ) {
                    let translatedCRMText;
                    let sourceCRMValue;
                    let charCRMLimit;

                    const richCRMTextData: any = this.getCRMRichTextData(entry, item.fields[entry.id][sourceLocale], item.fields[entry.id][destLocale], sourceCRMValue,translatedCRMText );

                    sourceCRMValue = richCRMTextData?.sourceValue;

                    translatedCRMText = richCRMTextData?.translatedText;


                    if (isReviewPage === "true") {
                      charCRMLimit = 50000;
                      const index = auditContent.findIndex(
                        (val) =>
                          val.entryId === item.sys.id && val.key === entry.id
                      );
                      const replacedCRMValue = auditContent[index]?.replaceValue;

                      const initialCRM = this.getCRMAuditData(auditContent[index]?.initialValue, item.fields[entry.id][destLocale]);

                      const value =
                        item.fields[entry.id][auditContent[index]?.locale];

                      const initialCRMValue = initialCRM;
                      const translatedCRMValue = this.getCRMAuditData(auditContent[index]?.translateValue, item.fields[entry.id][destLocale]);

                        newCRMResult = this.getCRMNewData({entry, initialCRMValue,auditContent,index, translatedCRMValue, item, destLocale, value, newCRMResult, isLabelCRMLocale, contentCRMType, replacedCRMValue, sourceLocale, charCRMLimit} );
                    } else {
                      newCRMResult = this.getCRMTranslatedNewData({entry, item, destLocale,translatedCRMText,newCRMResult,isLabelCRMLocale,contentCRMType, sourceLocale, sourceCRMValue, charCRMLimit });
                    }
                  }
                })
            );
          
        }
      })
    );
    newCRMResult.sort((a, b) => {
      const dateCRMA = new Date(a.updatedAt).getTime();
      const dateCRMB = new Date(b.updatedAt).getTime();
      const dateCRMComparison = dateCRMB - dateCRMA;
      if (dateCRMComparison !== 0) {
        return dateCRMComparison;
      }
      return a.charLimit - b.charLimit;
    });
    return newCRMResult;
  }

  /**
   * getCRMAuditData
   * @param richText
   * @returns {response} Response
   */

  getCRMAuditData(auditContent,item){
      return  auditContent ? auditContent : item;
  }

  /**
   * getCRMRichTextData
   * @param richText
   * @returns {response} Response
   */

  getCRMRichTextData(entry,itemSource,itemDest, sourceCRMValue, translatedCRMText){
     
    if (entry.type === "RichText") {
      sourceCRMValue = documentToHtmlString(
        itemSource
      );
      if (itemDest) {
        translatedCRMText = documentToHtmlString(
          itemDest
        );
      }
      return {sourceCRMValue, translatedCRMText};

    }
    return {sourceCRMValue, translatedCRMText};
  }


  /**
   * getCRMLocaleCondition
   * @param richText
   * @returns {response} Response
   */

  getCRMLocaleCondition(sourceCRMLocale, itemFields, itemEntry){
    return  sourceCRMLocale && itemFields && itemEntry;
  }

  /**
   * getTranslatedNewData
   * @param richText
   * @returns {response} Response
   */

  getCRMTranslatedNewData({entry, item, destLocale,translatedCRMText,newCRMResult,isLabelCRMLocale,contentCRMType, sourceLocale, sourceCRMValue, charCRMLimit }) {
    const translateCRMNew =
    entry.type !== "RichText"
      ? item.fields[entry.id][destLocale] || ""
      : translatedCRMText;
      newCRMResult.push({
        label: isLabelCRMLocale?.localized
          ? item.fields[contentCRMType.displayField][sourceLocale]
          : item.fields[contentCRMType.displayField]["en-US"],
        initialValue:
          entry.type !== "RichText"
            ? item.fields[entry.id][sourceLocale]
            : sourceCRMValue,
        value:
          entry.type !== "RichText"
            ? item.fields[entry.id][sourceLocale]
            : sourceCRMValue,
        type: entry.type,
        id: item.sys.id,
        entryId: item.sys.id,
        updatedAt: item.sys.updatedAt,
        key: entry.id,
        charCRMLimit,
        translatedValue: translateCRMNew,
        locale: sourceLocale,
        existingValue: translateCRMNew,
        contentModelName: contentCRMType.name,
        characterCount: 0,
        isUploaded : translateCRMNew ? true : false
      });

      return newCRMResult;
  }

  /**
   * getNewData
   * @param richText
   * @returns {response} Response
   */

  getCRMNewData({entry, initialCRMValue,auditContent,index, translatedCRMValue, item, destLocale, value, newCRMResult, isLabelCRMLocale, contentCRMType, replacedCRMValue, sourceLocale, charCRMLimit} ) {
    if (entry.type === "RichText") {
      initialCRMValue = documentToHtmlString(
        auditContent[index]?.initialValue
      );

      if (!auditContent[index]?.translateValue) {
        translatedCRMValue = documentToHtmlString(
          item.fields[entry.id][destLocale]
        );
      } else {
        translatedCRMValue = auditContent[index]?.translateValue;
      }

      value = documentToHtmlString(
        item.fields[entry.id][auditContent[index]?.locale]
      );
    }

    if (index !== -1) {
      newCRMResult.push({
        label: isLabelCRMLocale?.localized
          ? item.fields[contentCRMType.displayField][
              auditContent[index].locale
            ]
          : item.fields[contentCRMType.displayField]["en-US"],
        initialCRMValue,
        value,
        translateValue: translatedCRMValue,
        replacedCRMValue,
        id: item.sys.id,
        entryId: item.sys.id,
        updatedAt: item.sys.updatedAt,
        key: entry.id,
        type: entry.type,
        locale: sourceLocale,
        existingValue:
          item.fields[entry.id][destLocale] || "",
        charCRMLimit,
        sourceLocale: auditContent[index]?.locale,
        contentModelName: contentCRMType.name,
        characterCount: 0,
        isUploaded : translatedCRMValue ? true : false
      });
    }
    return newCRMResult;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  getCRMCondition(entry, text) {
    return (
      entry.type !== "Array" &&
      entry.type !== "Link" &&
      entry.type !== "Integer" &&
      ((entry.validations.length > 0 &&
        ((entry.validations.find((item) => Object.keys(item).includes("in")) &&
          entry.validations.find((item) => Object.keys(item).includes("in"))
            ?.length === 0) ||
          !entry.validations.find((item) =>
            Object.keys(item).includes("in")
          ))) ||
        entry.validations.length === 0) &&
      !this.isOnlyCRMHyperlink(text) &&
      !this.isOnlyCRMDeepLink(text)
    );
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */
  async getCRMLocalizedEntries(query, environment) {
    const response = await environment.getEntries({
      ...query,
      locale: "*", // Fetch all locales
    });

    return response.items;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */
  async countTotalLocalizedFields(items, contentModels) {
    let totalCRMField = 0;
    if (items) {
      contentModels.forEach((contentType) => {
        if (contentType) {
          const existCRMModel = items.filter(
            (item) => item.sys.contentType.sys.id === contentType.sys.id
          );
          console.log(existCRMModel);

          if (existCRMModel?.length > 0) {
            const fieldCRMCount = contentType.fields.filter(
              (fieldItem) =>
                fieldItem.localized === true &&
                fieldItem.type !== "Link" &&
                fieldItem.type !== "Array"
            );
            console.log(fieldCRMCount);
            totalCRMField += fieldCRMCount?.length;
          }
        }
      });
    }

    return totalCRMField;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */
  convertCRMRichTextToPlainText(nodes) {
    let htmlCRMContent = "";
    if (!nodes) {
      return "";
    }

    if (!nodes.content) {
      return "";
    }

    nodes.content.forEach((node) => {
      switch (node.nodeType) {
        case "heading-1":
        case "heading-2":
        case "heading-3":
        case "heading-4":
        case "heading-5":
        case "heading-6":
          htmlCRMContent += `<h${node.nodeType.split("-")[1]}>${this.convertCRMMarks(
            node.content
          )}</h${node.nodeType.split("-")[1]}>\n\n`;
          break;
        case "paragraph":
          htmlCRMContent += `${this.convertCRMMarks(node.content)}\n\n`;
          break;
        case "list-item":
          htmlCRMContent += `<li>${this.convertCRMMarks(node.content)}</li>\n`;
          break;
        case "embedded-asset-block":
          htmlCRMContent += "<p>Embedded Asset</p>\n\n";
          break;
        case "unordered-list":
          htmlCRMContent += "<ul>\n";
          node.content.forEach((listItem) => {
            htmlCRMContent += `<li>${this.convertCRMMarks(listItem.content)}</li>\n`;
          });
          htmlCRMContent += "</ul>\n";
          break;
        case "ordered-list":
          htmlCRMContent += "<ol>\n";
          node.content.forEach((listItem, index) => {
            htmlCRMContent += `<li>${index + 1}. ${this.convertCRMMarks(
              listItem.content
            )}</li>\n`;
          });
          htmlCRMContent += "</ol>\n";
          break;
        case "hyperlink":
          htmlCRMContent += `<a href="${node.data.uri}">${this.convertCRMMarks(
            node.content
          )}</a>`;
          break;
        default:
          htmlCRMContent += `${this.convertCRMMarks(node.content)}\n\n`;
          break;
      }
    });

    return htmlCRMContent;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  convertCRMMarks(nodes) {
    let plainCRMText:any = "";
    nodes.forEach((node) => {
      if (node.nodeType === "text") {
        const textCRMContent = node.value;
        if (node.value !== undefined && node.value.trim() !== "") {
          plainCRMText = this.getCRMMarksData({node, textCRMContent, plainCRMText});
        }
      } else if (node.nodeType === "list-item") {
        // Add bullet point for list items
        plainCRMText += `• ${this.convertCRMMarks(node.content)}\n`;
      } else if (node.nodeType.startsWith("heading")) {
        // Handle headings
        const headingLevel = node.nodeType.split("-")[1];
        plainCRMText += `<h${headingLevel}>${this.convertCRMMarks(
          node.content
        )}</h${headingLevel}>\n\n`;
      }

      if (node.content) {
        plainCRMText += this.convertCRMMarks(node.content);
      }
    });
    return plainCRMText;
  }

  /**
   * getCRMMarksData
   * @param richText
   * @returns {response} Response
   */
  getCRMMarksData({node, textCRMContent, plainCRMText}){
    // Apply bold formatting if mark is present
    if (node.marks.some((mark) => mark.type === "bold")) {
      textCRMContent = `<b>${textCRMContent}</b>`;
    }

    // Apply italic formatting if mark is present
    if (node.marks.some((mark) => mark.type === "italic")) {
      textCRMContent = `<i>${textCRMContent}</i>`;
    }

    // Apply font size if mark is present
    const fontSizeCRMMark = node.marks.find(
      (mark) => mark.type === "font-size"
    );
    if (fontSizeCRMMark) {
      textCRMContent = `<span style="font-size: ${fontSizeCRMMark.value};">${textCRMContent}</span>`;
    }

    if (textCRMContent !== "") {
      plainCRMText += `<p>${textCRMContent}</p>`;
    }

    return plainCRMText;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  applyCRMMarks(value, marks) {
    let formattedCRMText = value;
    marks.forEach((mark) => {
      if (mark.type === "bold") {
        formattedCRMText = `**${formattedCRMText}**`;
      }
      if (mark.type === "italic") {
        formattedCRMText = `_${formattedCRMText}_`;
      }
      // Add other mark types if needed
    });
    return formattedCRMText;
  }

  /**
   * fetching region entries from contentful
   */
  async fetchCRMRegion(currentEnv) {
    const space = await this.CRMClient.getSpace(CRM_CONTENTFUL_SPACE_ID);

    const environment = await space.getEnvironment(currentEnv);

    const { itemsCRM } = await environment.getEntries({
      content_type: "region",
    });

    // Filter out entries with empty fields
    const filteredCRMRegionItems = itemsCRM.filter((region) => {
      const nameCRM = region.fields?.name?.["en-US"];
      const codeCRM = region.fields?.code?.["en-US"];
      return nameCRM !== undefined && codeCRM !== undefined;
    });

    const regionCRMFields = filteredCRMRegionItems.map((region) => {
      return {
        regionSysId: region.sys.id,
        regionName: region.fields.name["en-US"],
        regionCode: region.fields.code["en-US"],
      };
    });
    return regionCRMFields;
  }
}

export default new CrmMarketReviewHelper();
