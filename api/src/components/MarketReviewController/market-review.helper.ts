import { createClient } from "contentful-management";
import { get } from "lodash";
import contentfulHelper from "../ContentfulController/contentful.helper";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
const CRM_SIT = get(process.env, "CRM_SIT")!;
const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

class MarketReviewHelper {
  private client;
  private regexSt;

  constructor() {
    this.client = createClient({
      accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
    });
    this.regexSt = /^(?:\s+|\s+)$/g;
  }

  /**
   * update contentful translation Key Value
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
  async updateEntry(
    entryId,
    translatedValue,
    locale: string,
    currentEnv,
    key
  ): Promise<Response> {
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment(currentEnv);

    // Fetch entry by ID
    const entry = await environment.getEntry(entryId);
    // Update fields for entry
    entry.fields[key][locale] = translatedValue;

    const updatedEntry = await entry.update();

    // Publish updated entry
    return updatedEntry.publish();
  }

  /**
   * escapeRegExp
   * @param search
   */
  escapeRegExp(search) {
    return search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * fetch translation key value
   * @param {string} contentType
   * @param {number} pageIndex
   */
  async fetchEntries({
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
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);
    const environment = await space.getEnvironment(currentEnv);

    const response = await environment.getEntries({
      query: filter,
      limit: pageSize,
      skip: pageIndex,
    });

    const newResult = await this.getEntries(
      contentModel,
      response.items,
      sourceLocale,
      destination,
      entryIds,
      isReviewPage
    );

    // If the retrieved entries are less than the desired page size, fetch the next page
    if (newResult.length < pageSize && response.total > pageIndex + pageSize) {
      const remainingEntries = pageSize - newResult.length;
      const nextResults: any = await this.fetchEntries({
        currentEnv,
        filter,
        pageSize: remainingEntries,
        pageIndex: Number(pageIndex) + Number(pageSize),
        contentModel,
        sourceLocale,
        destination,
        entryIds,
        isReviewPage,
      });
      if (Array.isArray(nextResults)) {
        newResult.push(...nextResults);
      } else {
        newResult.push(...nextResults.entries);
      }
    }
    const totalEntries = response.total;

    return { entries: newResult, totalEntries };
  }

  /**
   * fetch All contentmodels
   */
  async fetchContentModel(currentEnv) {
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);

    const environment = await space.getEnvironment(currentEnv);

    const contentModels = await environment.getContentTypes({ limit: 1000 });

    return contentModels.items;
  }

  /**
   * fetch All contentmodels
   */
  async fetchCRMModel(spaceId, isCRM) {
    const { space, contentfulBackup }: any = await contentfulHelper.getSpace(
      spaceId
    );

    const currentEnv =
      isCRM === "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID
        ? CRM_SIT
        : contentfulBackup;

    const environment = await space.getEnvironment(currentEnv);

    const contentModels = await environment.getContentTypes({ limit: 1000 });

    // Filter content models to include only those with localized fields
    const contentModelsWithLocalizedFields = contentModels.items.filter(
      (contentModel) => {
        // Check if any field in the content model is localized
        const hasLocalizedFields = contentModel.fields.some(
          (field) => field.localized === true && field.linkType !== "Asset"
        );
        return hasLocalizedFields;
      }
    );

    return contentModelsWithLocalizedFields;
  }

  /**
   * fetch translation key value
   * @param {string} contentType
   * @param {number} pageIndex
   */
  async fetchCRMEntries({
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
    const { space, contentfulBackup } = await contentfulHelper.getSpace(
      spaceId
    );

    const currentEnv =  contentfulBackup;

    const environment = await space.getEnvironment(currentEnv);

    // Convert content type IDs to a comma-separated string
    const contentTypeIds = contentModel.map(({ sys }) => sys.id).join(",");
    const query = await this.buildCRMQuery(pageSize,pageIndex, value, isReviewPage, searchValue, type, contentTypeIds, extags); 


    let uniqueEntries;

    if (isReviewPage === "true") {
      let tagEntries;
      uniqueEntries = Array.from(
        new Map(
          auditRecord.data.content.map((item) => [item.entryId, item])
        ).values()
      );

      if (type) {
        uniqueEntries = uniqueEntries.filter((newItem) =>
          type.includes(newItem.contentModelName)
        );
      }

      if (value || searchValue) {
        if (value) {
          query["metadata.tags.sys.id[in]"] = value;
        }

        query.limit = 1000;
        query.skip = 0;
        tagEntries = await environment.getEntries(query);

        const tagEntryIds = new Set(
          tagEntries.items.map((item) => item.sys.id)
        );
        uniqueEntries = uniqueEntries.filter((item) => {
          const isPresent = tagEntryIds.has(item.entryId);
          if (!isPresent) {
            console.log(`EntryId ${item.entryId} not found in tagEntryIds`);
          }
          return isPresent;
        });
      }
      console.log("Pagination checking", uniqueEntries);
      // Extract unique entries based on entryId

      // Calculate the start index for pagination
      const skip = Number(pageIndex) * Number(pageSize);

      // Paginate the unique array manually
      const paginatedArray = uniqueEntries.slice(skip, skip + Number(pageSize));

      // Map entryIds for the query
      const entryIds = paginatedArray.map((item: any) => item.entryId);

      // Convert entryIds to the query format
      query["sys.id[in]"] = entryIds.join(",");
      delete query.limit;
      delete query.skip;
    }
    // Fetch entries for the specified content type IDs and pagination
    const response = await environment.getEntries(query);

    // Process and append retrieved entries to newResult array
    const localResult = await this.getEntries(
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

    let totalEntries = response.total;

    if (isReviewPage === "true") {
      totalEntries = uniqueEntries.length;
    }

    return { entries: localResult, totalEntries };
  }

  /**
   * build CRM query
   * @returns {Promise<Response>} Response
   */

    async buildCRMQuery(pageSize,pageIndex, value, isReviewPage, searchValue, type, contentTypeIds, extags) { // NOSONAR
      const query: any = {
        query: searchValue,
        "sys.archivedAt[exists]": false,
        "sys.publishedAt[exists]": true,
        limit: Number(pageSize),
        skip: Number(pageIndex) * Number(pageSize),
      };
      
      if (isReviewPage !== "true") {
        if (type) {
          query["sys.contentType.sys.id[in]"] = type;
        } else {
          // Default to all content types if no specific types are provided
          query["sys.contentType.sys.id[in]"] = contentTypeIds;
        }
  
        if (value) {
          query["metadata.tags.sys.id[in]"] = value;
        }
        if (extags) {
          query["metadata.tags.sys.id[nin]"] = extags;
        }
      }
      return query;
    }

  /**
   * isOnlyHyperlink
   * @returns {Promise<Response>} Response
   */

  isOnlyHyperlink(text) {
    // Regular expression to match full URLs
    const urlPattern =
      /^(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])$/i; // NOSONAR
    return urlPattern.test(text);
  }

  /**
   * isOnlyHyperlink
   * @returns {Promise<Response>} Response
   */
  isOnlyDeepLink(text) {
    // Regular expression to match deep links (custom URL schemes)
    const deepLinkPattern = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\/[^\s]*$/i; // NOSONAR
    return deepLinkPattern.test(text);
  }

  /**
   * Get Entries
   * @param contentModel
   * @param entries
   * @param sourceLocale
   * @returns {Promise<Response>} Response
   */

  async getEntries(
    contentModel,
    entries,
    sourceLocale,
    destLocale,
    auditContent,
    isReviewPage
  ) {
    let newResult: any = [];

    await Promise.all(
      entries.map(async (item) => {
        const contentType = contentModel.find(
          (content) => content.sys.id === item.sys.contentType.sys.id
        );

        if (contentType && contentType.fields) {
          const isLabelLocale = contentType.fields.find(
            (fieldValue) =>
              contentType.displayField === fieldValue.id &&
              fieldValue.localized === true
          );
            await Promise.all(
              contentType.fields
                .filter((fieldValue) => fieldValue.localized === true)
                .map(async (entry) => {
                  if (
                    this.getLocaleCondition(sourceLocale, item.fields, item.fields[entry.id])  &&  item.fields[entry.id][sourceLocale] !== undefined &&
                    item.fields[entry.id][sourceLocale] !== null &&
                    item.fields[entry.id][sourceLocale] !== "" &&
                    this.getCondition(
                      entry,
                      item.fields[entry.id][sourceLocale]
                    )
                  ) {
                    let translatedText;
                    let sourceValue;
                    let charLimit;

                    const richTextData: any = this.getRichTextData(entry, item.fields[entry.id][sourceLocale], item.fields[entry.id][destLocale], sourceValue,translatedText );

                    sourceValue = richTextData?.sourceValue;

                    translatedText = richTextData?.translatedText;

                    if (isReviewPage === "true") {
                      charLimit = 50000;
                      const index = auditContent.findIndex(
                        (val) =>
                          val.entryId === item.sys.id && val.key === entry.id
                      );
                      const replacedValue = auditContent[index]?.replaceValue;

                      const initial = this.getAuditData(auditContent[index]?.initialValue, item.fields[entry.id][destLocale]);

                      const value =
                        item.fields[entry.id][auditContent[index]?.locale];

                      const initialValue = initial;
                      const translatedValue = this.getAuditData(auditContent[index]?.translateValue, item.fields[entry.id][destLocale]);
                     
                      newResult = this.getNewData({index,entry, initialValue, auditContent, translatedValue, item, destLocale, value, newResult, isLabelLocale, contentType, replacedValue, sourceLocale, charLimit});

                    } else {
                      newResult = this.getTranslatedNewData({translatedText, entry, item, destLocale,newResult,isLabelLocale, contentType, sourceLocale, sourceValue, charLimit });
                    }
                  }
                })
            );
          
        }
      })
    );
    newResult.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      const dateComparison = dateB - dateA;
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return a.charLimit - b.charLimit;
    });
    return newResult;
  }

  /**
   * getAuditData
   * @param richText
   * @returns {response} Response
   */

  getAuditData(auditContent,item){
      return  auditContent ? auditContent : item;
  }

  /**
   * getRichTextData
   * @param richText
   * @returns {response} Response
   */

  getRichTextData(entry,itemSource,itemDest, sourceValue, translatedText){
     
    if (entry.type === "RichText") {
      sourceValue = documentToHtmlString(
        itemSource
      );
      if (itemDest) {
        translatedText = documentToHtmlString(
          itemDest
        );
      }
      return {sourceValue, translatedText};

    }
    return {sourceValue, translatedText};
  }

  /**
   * getLocaleCondition
   * @param richText
   * @returns {response} Response
   */

  getLocaleCondition(sourceLocale, itemFields, itemEntry){
    return  sourceLocale && itemFields && itemEntry;
  }
  /**
   * getTranslatedNewData
   * @param richText
   * @returns {response} Response
   */
  getTranslatedNewData({translatedText, entry, item, destLocale,newResult,isLabelLocale, contentType, sourceLocale, sourceValue, charLimit }){
      const translateNew =  
      entry.type !== "RichText"  
        ? item.fields[entry.id][destLocale] || ""  
        : translatedText;  
        newResult.push({  
          label: isLabelLocale?.localized  
            ? item.fields[contentType.displayField][sourceLocale]  
            : item.fields[contentType.displayField]["en-US"],  
          initialValue:  
            entry.type !== "RichText"  
              ? item.fields[entry.id][sourceLocale]  
              : sourceValue,  
          value:  
            entry.type !== "RichText"  
              ? item.fields[entry.id][sourceLocale]  
              : sourceValue,  
          type: entry.type,  
          id: item.sys.id,  
          entryId: item.sys.id,  
          updatedAt: item.sys.updatedAt,  
          key: entry.id,  
          charLimit,  
          translatedValue: translateNew,  
          locale: sourceLocale,  
          existingValue: translateNew,  
          contentModelName: contentType.name,  
          characterCount: 0,  
          isUploaded : translateNew ? true : false
          });
        return  newResult;
    }
  /**
   * getNewData
   * @param richText
   * @returns {response} Response
   */

  getNewData({index,entry, initialValue, auditContent, translatedValue, item, destLocale, value, newResult, isLabelLocale, contentType, replacedValue, sourceLocale, charLimit}){
    if (index !== -1) {
      if (entry.type === "RichText") {
        initialValue = documentToHtmlString(
          auditContent[index]?.initialValue
        );

        if (!auditContent[index]?.translateValue) {
          translatedValue = documentToHtmlString(
            item.fields[entry.id][destLocale]
          );
        } else {
          translatedValue = auditContent[index]?.translateValue;
        }

        value = documentToHtmlString(
          item.fields[entry.id][auditContent[index]?.locale]
        );
      }
      newResult.push({
        label: isLabelLocale?.localized
          ? item.fields[contentType.displayField][
              auditContent[index].locale
            ]
          : item.fields[contentType.displayField]["en-US"],
        initialValue,
        value,
        translateValue: translatedValue,
        replacedValue,
        id: item.sys.id,
        entryId: item.sys.id,
        updatedAt: item.sys.updatedAt,
        key: entry.id,
        type: entry.type,
        locale: sourceLocale,
        existingValue:
          item.fields[entry.id][destLocale] || "",
        charLimit,
        sourceLocale: auditContent[index]?.locale,
        contentModelName: contentType.name,
        characterCount: 0,
        isUploaded : translatedValue ? true : false
      });
    }
    return newResult;
  }


  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  getCondition(entry, text) {
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
      !this.isOnlyHyperlink(text) &&
      !this.isOnlyDeepLink(text)
    );
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */
  async getLocalizedEntries(query, environment) {
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
    let totalField = 0;
    if (items) {
      contentModels.forEach((contentType) => {
        if (contentType) {
          const existModel = items.filter(
            (item) => item.sys.contentType.sys.id === contentType.sys.id
          );
          console.log(existModel);

          if (existModel?.length > 0) {
            const fieldCount = contentType.fields.filter(
              (fieldItem) =>
                fieldItem.localized === true &&
                fieldItem.type !== "Link" &&
                fieldItem.type !== "Array"
            );
            console.log(fieldCount);
            totalField += fieldCount?.length;
          }
        }
      });
    }

    return totalField;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */
  convertRichTextToPlainText(nodes) {
    let htmlContent = "";
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
          htmlContent += `<h${node.nodeType.split("-")[1]}>${this.convertMarks(
            node.content
          )}</h${node.nodeType.split("-")[1]}>\n\n`;
          break;
        case "paragraph":
          htmlContent += `${this.convertMarks(node.content)}\n\n`;
          break;
        case "list-item":
          htmlContent += `<li>${this.convertMarks(node.content)}</li>\n`;
          break;
        case "embedded-asset-block":
          htmlContent += "<p>Embedded Asset</p>\n\n";
          break;
        case "unordered-list":
          htmlContent += "<ul>\n";
          node.content.forEach((listItem) => {
            htmlContent += `<li>${this.convertMarks(listItem.content)}</li>\n`;
          });
          htmlContent += "</ul>\n";
          break;
        case "ordered-list":
          htmlContent += "<ol>\n";
          node.content.forEach((listItem, index) => {
            htmlContent += `<li>${index + 1}. ${this.convertMarks(
              listItem.content
            )}</li>\n`;
          });
          htmlContent += "</ol>\n";
          break;
        case "hyperlink":
          htmlContent += `<a href="${node.data.uri}">${this.convertMarks(
            node.content
          )}</a>`;
          break;
        default:
          htmlContent += `${this.convertMarks(node.content)}\n\n`;
          break;
      }
    });

    return htmlContent;
  }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  convertMarks(nodes) {
    let plainText = "";
    nodes.forEach((node) => {
      if (node.nodeType === "text") {
        const textContent = node.value;
        if (node.value !== undefined && node.value.trim() !== "") {
          plainText = this.convertMarksData(node,textContent,plainText );
        }
      } else if (node.nodeType === "list-item") {
        // Add bullet point for list items
        plainText += `• ${this.convertMarks(node.content)}\n`;
      } else if (node.nodeType.startsWith("heading")) {
        // Handle headings
        const headingLevel = node.nodeType.split("-")[1];
        plainText += `<h${headingLevel}>${this.convertMarks(
          node.content
        )}</h${headingLevel}>\n\n`;
      }

      if (node.content) {
        plainText += this.convertMarks(node.content);
      }
    });
    return plainText;
  }


  /**
   * convertMarksData
   * @param richText
   * @returns {response} Response
   */

    convertMarksData(node,textContent,plainText ) {
      // Apply bold formatting if mark is present
      if (node.marks.some((mark) => mark.type === "bold")) {
        textContent = `<b>${textContent}</b>`;
      }

      // Apply italic formatting if mark is present
      if (node.marks.some((mark) => mark.type === "italic")) {
        textContent = `<i>${textContent}</i>`;
      }

      // Apply font size if mark is present
      const fontSizeMark = node.marks.find(
        (mark) => mark.type === "font-size"
      );
      if (fontSizeMark) {
        textContent = `<span style="font-size: ${fontSizeMark.value};">${textContent}</span>`;
      }

      if (textContent !== "") {
        plainText += `<p>${textContent}</p>`;
      }

      return plainText;
    }

  /**
   * convertRichTextToPlainText
   * @param richText
   * @returns {response} Response
   */

  applyMarks(value, marks) {
    let formattedText = value;
    marks.forEach((mark) => {
      if (mark.type === "bold") {
        formattedText = `**${formattedText}**`;
      }
      if (mark.type === "italic") {
        formattedText = `_${formattedText}_`;
      }
      // Add other mark types if needed
    });
    return formattedText;
  }

  /**
   * fetching region entries from contentful
   */
  async fetchRegion(currentEnv) {
    const space = await this.client.getSpace(CONTENTFUL_SPACE_ID);

    const environment = await space.getEnvironment(currentEnv);

    const { items } = await environment.getEntries({
      content_type: "region",
    });

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
}

export default new MarketReviewHelper();
