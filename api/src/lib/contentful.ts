import { createClient } from "contentful";
import { get, isArray, isEmpty } from "lodash";
import querystring from "querystring";
import axios, { AxiosRequestConfig } from "axios";

const CONTENTFUL_ACCESS_TOKEN = get(process.env, "CONTENTFUL_ACCESS_TOKEN")!;
const CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;
const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const DEFAULT_LOCALE = get(process.env, "DEFAULT_LOCALE", "ja-JP");
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const CONTENTFUL_API_URI = get(process.env, "CONTENTFUL_API_URI")!;
const US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

const US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN"
)!;

class Contentful {
  private client;

  constructor() {
    this.client = createClient({
      accessToken: CONTENTFUL_ACCESS_TOKEN,
      environment: CONTENTFUL_ENVIRONMENT,
      space: CONTENTFUL_SPACE_ID,
    });
  }

  /**
   * Get entries for content type
   * @param {string} type Content type
   * @param {string} locale Locale
   * @param {Object} query Query parameters
   * @return {Promise} Entries
   */
  async getEntries(type, locale, query) {
    // get region id = require(locale
    const regionId = await this.getRegionId(locale);

    // fetch data
    const data = await this.client.getEntries({
      locale,
      content_type: type,
      links_to_entry: regionId,
      include: 10, // get data upto level 10
      ...query,
    });

    // parse data
    const { items } = this.client.parseEntries(data);

    // map data
    return this.mapItems(items);
  }

  /**
   * Map data item
   * @param {Object} item Data item
   * @return {Object} Parsed data
   */
  private mapItem(item) {
    // get key value pairs
    const entries = Object.entries(item);

    // iterate
    for (const [key, value] of entries) {
      // remove `region`
      if (key === "region") {
        delete item[key];

        continue;
      }

      if (isArray(value) && !isEmpty(value) && value.some(({ sys }) => sys)) {
        // map values
        item[key] = this.mapItems(value);
      } else {
        // map values
        item[key] = this.mapField(value);
      }
    }

    return item;
  }

  /**
   * Map items
   * @param {*} items Items
   * @return {*} Mapped data
   */
  private mapItems(items) {
    return items.map(({ fields, sys: { id } }) =>
      this.mapItem({
        ...fields,
        id,
      })
    );
  }

  /**
   * Map item fields
   * @param {*} data Item field
   * @return {*} Mapped data
   */
  private mapField(data) {
    // map image urls
    if (get(data, "sys.type") === "Asset") {
      const url = get(data, "fields.file.url");

      if (url) {
        return `https:${url}`;
      }
    }

    // map array
    if (Array.isArray(data)) {
      if (get(data, "0.fields")) {
        return data.map(({ fields }) => fields);
      }
    }

    // map object
    if (get(data, "fields")) {
      const { fields } = data;

      return fields;
    }

    // return as is
    return data;
  }

  /**
   * Get region id
   * @param {string} locale Locale
   * @return {Promise<string>} Region id
   */
  async getRegionId(locale) {
    // get all regions
    const { items } = await this.client.getEntries({
      content_type: "region",
    });

    // find region id for locale
    const {
      sys: { id },
    } = items.find(
      ({ fields: { code, fallback = "" } }) =>
        code === locale ||
        (code === DEFAULT_LOCALE && fallback.includes(locale))
    );

    return id;
  }

  /**
   * Internal request builder
   * @param {Object} requestData Request data
   * @param {boolean} skipError Skip error
   * @return {Promise} Response from Contentful
   */
  async request(requestData) {
    const { name, data, spaceId, method, auth = false, sendJSON = false } = requestData;

    const headers: ContentfulRequestHeaders = {};

    // check for access token validaity or refresh the token
    if (auth === true) {
      
      if(spaceId === US_WEBSITE_CONTENTFUL_SPACE_ID) {
        this.setBearer(headers, US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN);
      } else {
        this.setBearer(headers, CONTENTFUL_MANAGEMENT_TOKEN);
      }
      
    }

    // options for our request
    const options: AxiosRequestConfig = {
      url: CONTENTFUL_API_URI + name,
      headers,
      method,
    };

    // if `GET` method, set the querystring
    if (method === "GET") {
      options.url += "?" + querystring.stringify(data);
    } else if (method === "POST" && sendJSON) {
      options.headers = {
        ...options.headers,
        "content-type": "application/json",
      };

      options.data = JSON.stringify(data);
    }
    // else set the form
    else {
      options.headers = {
        ...options.headers,
        "content-type": "application/x-www-form-urlencoded",
      };

      options.data = querystring.stringify(data);
    }

    const response = await axios(options); // nosonar
    return response.data;
  }

  /**
   * Set Bearer auth header
   * @param {Object} headers Object to add headers to
   * @param {Object} token  OAuth token
   */
  private setBearer(headers, token) {
    headers.authorization = `Bearer ${token}`;
  }
}

export default Contentful;
