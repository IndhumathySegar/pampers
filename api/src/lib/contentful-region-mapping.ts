import { createClient } from "contentful-management";
import { get } from "lodash";

import { STATUS } from "../entities/interfaces/iContentfulRegionMapping";

import contentfulHelper from "../components/ContentfulController/contentful.helper";


import { Types } from "mongoose";

import Contentful from "./contentful";

import { ContentfulRegionMappingModel } from "../entities";

const CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;

const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;

class ContentfulRegionMapping extends Contentful {
  contentfulClient;

  constructor() {
    super();
  }
  /**
   * Migrate content from one environment to another.
   * @returns {Promise<void>} Promise that resolves when migration is complete.
   */
  async regionMapping({environment, response, entryMap, regionData}): Promise<void> {
    const { _id, regions } = regionData;

    try { 
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
      const allLocales = locales.filter((locale) =>
        regions.includes(locale)
      );

      const localeCodes = allLocales.map((locale) => locale);
      // Fetch region entries by locale
      const regionEntryMap: any = await this.fetchRegionEntriesByLocale(
        environment,
        localeCodes
      );
      console.log("regionEntryMap", regionEntryMap);

      const details = response;

      const errorDetails: any = [];
      let processedRecords = 0;

      for (const [, entry] of details.entries()) {
        try {
          if (!entryMap.get(entry.sys.id).fields.region) {
            entryMap.get(entry.sys.id).fields.region = {"en-US": []};
          }
         
          const contentData = await this.updateContentData(regions, regionEntryMap, entryMap, entry, "region");   

          entry.fields.region["en-US"] = contentData;

          // Update the entry in Contentful
          await this.updateToContentful(entry);
          processedRecords = processedRecords + 1;
          await ContentfulRegionMappingModel.updateOne(
            { _id: Types.ObjectId(_id) },
            { $set: { processedRecords } }
          ).exec();
        } catch (error) {
          const message = `Region does not exist in ${entry.sys?.contentType?.sys?.id}`;
          console.error(`Error updating entry ${entry.sys.id}:`, error);

          if (
            !errorDetails.some(
              (error: { message: string }) =>
                error.message ===
                `Region does not exist in ${entry.sys?.contentType?.sys?.id}`
            )
          ) {
          
            errorDetails.push({
              message,
            });
            await ContentfulRegionMappingModel.updateOne(
              { _id: Types.ObjectId(_id) },
              {
                $push: {
                  errorDetails: {
                    message,
                  },
                },
              } as any
            );
          }
        }
      }
      let status = STATUS.SUCCESS;

      if (errorDetails.length > 0) {
        status = STATUS.FAILED;
      }
      // Change status to success
      await ContentfulRegionMappingModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status } }
      ).exec();
    } catch (ex: any) {
      console.log(ex, "error");
      await ContentfulRegionMappingModel.updateOne(
        { _id: Types.ObjectId(_id) },
        { $set: { status: "failed", errorDetails: ex } }
      ).exec();
    }
  }

  /**
   * Migrate content from one environment to another.
   * @returns {Promise<void>} Promise that resolves when migration is complete.
   */
    async getRecords(regionData): Promise<any> {
      const { _id, spaceId, contentModels, tags, regions } = regionData;
  
      try {
        this.contentfulClient = createClient({
          accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
        });
        await ContentfulRegionMappingModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status: "started" } }
        ).exec();
  
        const space = await this.contentfulClient.getSpace(spaceId);
        const environment = await space.getEnvironment(CONTENTFUL_ENVIRONMENT);
  
        const query = await this.updateQuery(contentModels, tags);
  
        const response: any = await this.getAllDataEntries(environment, query);
  
        await ContentfulRegionMappingModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { totalRecords: response.length } }
        ).exec();
  
        const entryMap: any = new Map(
          response.map((entry) => [entry.sys.id, entry])
        );
        
      if(regionData.isCountry === "TRUE") {
        await this.countryMapping({entryMap, response, environment, regionData});

      } else {
        await this.regionMapping({entryMap, response, environment, regionData});

      }
  
      } catch (ex: any) {
        console.log(ex, "error");
        await ContentfulRegionMappingModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status: "failed", errorDetails: ex } }
        ).exec();
      }
    }

  /**
   * Migrate content from one environment to another.
   * @returns {Promise<void>} Promise that resolves when migration is complete.
   */
    async countryMapping({entryMap, response, environment, regionData}): Promise<void> {
      const { _id,  regions } = regionData;
  
      try {
   
       const { countryEntryMap } = await contentfulHelper.fetchUserRegion(true);
        console.log("countryEntryMap", countryEntryMap);
  
        const details = response;
  
        const errorDetails: any = [];
        let processedRecords = 0;
  
        for (const [, entry] of details.entries()) {
          try {
            if (!entryMap.get(entry.sys.id).fields.country) {
              entryMap.get(entry.sys.id).fields.country = {"en-US": []};
            }
           
            const contentData = await this.updateContentData(regions, countryEntryMap, entryMap, entry, "country");   
            console.log("content data", contentData);
  
            entry.fields.country["en-US"] = contentData;
  
            // Update the entry in Contentful
            await this.updateToContentful(entry);
            processedRecords = processedRecords + 1;
            await ContentfulRegionMappingModel.updateOne(
              { _id: Types.ObjectId(_id) },
              { $set: { processedRecords } }
            ).exec();
          } catch (error) {
            const message = `Country does not exist in ${entry.sys?.contentType?.sys?.id}`;
            console.error(`Error updating entry ${entry.sys.id}:`, error);
  
            if (
              !errorDetails.some(
                (error: { message: string }) =>
                  error.message ===
                  `Region does not exist in ${entry.sys?.contentType?.sys?.id}`
              )
            ) {
            
              errorDetails.push({
                message,
              });
              await ContentfulRegionMappingModel.updateOne(
                { _id: Types.ObjectId(_id) },
                {
                  $push: {
                    errorDetails: {
                      message,
                    },
                  },
                } as any
              );
            }
          }
        }
        let status = STATUS.SUCCESS;
  
        if (errorDetails.length > 0) {
          status = STATUS.FAILED;
        }
        // Change status to success
        await ContentfulRegionMappingModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status } }
        ).exec();
      } catch (ex: any) {
        console.log(ex, "error");
        await ContentfulRegionMappingModel.updateOne(
          { _id: Types.ObjectId(_id) },
          { $set: { status: "failed", errorDetails: ex } }
        ).exec();
      }
    }
  

  /**
   * Fetch all entries from a Contentful environment, handling pagination.
   * @param {any} environment Contentful environment instance.
   * @returns {Promise<any[]>} Promise that resolves to an array of all entries.
   */
  async getAllDataEntries(environmentData: any, query): Promise<any[]> {
    const entriesData: any = [];
    let skipData = 0;
    const limitData = 100;

    while (true) {
      query.skip = skipData;
      query.limit = limitData;
      const response: any = await environmentData.getEntries(query);

      entriesData.push(...response.items);

      if (response.items.length < limitData) {
        break; // Exit loop when there are no more entries to fetch
      }

      skipData += limitData;
    }

    return entriesData;
  }

  /**
   * Sleep function to introduce delay.
   * @param {number} ms Milliseconds to sleep.
   * @returns {Promise<void>} Promise that resolves after the delay.
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      throw error;
    }
  }

  /**
   * update query
   * @param entryId
   * @param fields
   * @returns {Promise<Response>} Response
   */
    async updateQuery(contentModels, tags) {
      const query: any = {
        "sys.archivedAt[exists]": false,
        "sys.publishedAt[exists]": true,
      };

      if (contentModels.length > 0) {
        const contentTypeIds = contentModels.map((sys) => sys).join(",");
        query["sys.contentType.sys.id[in]"] = contentTypeIds; // Directly pass the array
      }

      if (tags.length > 0) {
        const tagIds = tags.map((sys) => sys).join(",");
        query["metadata.tags.sys.id[in]"] = tagIds; // Directly pass the array
      }

      return query;
    }

  /**
   * update content data
   * @param entryMap
   * @param entry
   * @returns {Promise<Response>} Response
   */
    async updateContentData(regions, countryEntryMap, entryMap, entry, paramName) {
      let contentData = entryMap.get(entry.sys.id).fields[paramName]["en-US"];

      // Filter out null values
      contentData = contentData.filter((item) => item !== null);

      regions.forEach((localeData) => {
        const regionsValue: any = countryEntryMap.get(localeData);

        if (entryMap.has(entry.sys.id)) {
          const alreadyLinked: any = contentData.some(
            (link) => link.sys.id === regionsValue
          );

          if (!alreadyLinked && regionsValue) {
            contentData.push({
              sys: {
                type: "Link",
                linkType: "Entry",
                id: regionsValue,
              },
            });
          }
        }
      });

      return contentData;
    }
}

export default new ContentfulRegionMapping();
