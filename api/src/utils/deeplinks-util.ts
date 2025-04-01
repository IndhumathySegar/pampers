import {DeeplinkConfigModel} from "../entities";
import {LeanDocument} from "mongoose";
import {DeeplinkConfig} from "../entities/interfaces/iDeeplinkConfig";
import _ from "lodash";

class DeeplinksUtil {
  /**
   * Validate Deeplink Update
   * @param deeplinksData
   * @param deeplinktUpdate
   * @param market
   * @param version
   */
  async validateDeeplinkUpdate(deeplinksData, deeplinktUpdate, market, version) : Promise<any[]> {
    if (deeplinksData) {
      if (deeplinksData.deeplinks.hasOwnProperty(market)) {
        const deeplinkDotData = await this.convertToDotKeyStructure(deeplinksData, market, "-", ".");
        const latest = await this.getHighestVersion(Object.keys(deeplinkDotData.deeplinks[market]));
        const newLatest = await this.getHighestVersion([latest[latest.length - 1], version]);
        console.log("version, prev & current latest version : ", version, latest, newLatest);
        if (newLatest[0] === version && !deeplinkDotData.deeplinks[market].hasOwnProperty(version)) {
          return ["not permitted"];
        }
        const commonKeys = await this.getCommonKeys(deeplinkDotData.deeplinks[market][latest[latest.length - 1]], deeplinktUpdate);
        deeplinkDotData.deeplinks[market][version] = _.unionBy(deeplinkDotData.deeplinks[market][latest[latest.length - 1]], deeplinkDotData.deeplinks[market][version], "feature");
        deeplinkDotData.deeplinks[market][version] = _.unionBy(deeplinktUpdate, deeplinkDotData.deeplinks[market][version], "feature");
        const deeplinkHashedData = await this.convertToDotKeyStructure(deeplinkDotData, market, ".", "-");
        await this.updateToDB(deeplinkHashedData.deeplinks);

        return commonKeys;
      } else {
        const versions = {};
        versions[version.replaceAll(".", "-")] = deeplinktUpdate;
        deeplinksData.deeplinks[market] = versions;
        await this.updateToDB(deeplinksData.deeplinks);

        return [];
      }

    } else {
      const newDeeplinksData = {};
      const versions = {};
      versions[version.replaceAll(".", "-")] = deeplinktUpdate;
      newDeeplinksData[market] = versions;
      await this.createInDB(newDeeplinksData);

      return ["New Created"];
    }
  }

  /**
   * Convert hyepanted key to dot key format
   * @param deeplinksData
   * @param market
   * @param from
   * @param to
   */
  async convertToDotKeyStructure(deeplinksData, market, from, to) : Promise<LeanDocument<DeeplinkConfig>> {
    if (deeplinksData.deeplinks.hasOwnProperty(market)) {
      Object.keys(deeplinksData.deeplinks[market])
        .forEach((key, idx) => {
          const temp = deeplinksData.deeplinks[market][key];
          const dotKey = key.replaceAll(from, to);
          delete deeplinksData.deeplinks[market][key];
          deeplinksData.deeplinks[market][dotKey] = temp;
        });
    }

    return deeplinksData;
  }

  /**
   * Get the highest version from the array
   * @param arr
   */
  async getHighestVersion(arr) : Promise<string[]> {
    arr = arr.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    return arr;
  }

  /**
   * Get Common keys in array of objects
   * @param deeplinksData
   * @param deeplinktUpdate
   */
  async getCommonKeys(deeplinksData, deeplinktUpdate) : Promise<any[]> {
    const commonKeys: object[] = [];
    deeplinksData.forEach((linkEle, idx) => {
      deeplinktUpdate.forEach((updateEle, idy) => {
        if (updateEle.feature === linkEle.feature) {
          commonKeys.push(updateEle);
        }
      });
    });
    return commonKeys;
  }

  /**
   * Udpate links to DB
   * @param deeplinksData
   */
  async updateToDB(deeplinksData) : Promise<void> {
    await DeeplinkConfigModel.updateOne(
      { type : "deeplinks" },
      { $set : { deeplinks : deeplinksData }}
    ).exec();
  }

  /**
   * Create links in DB
   * @param deeplinksData
   */
  async createInDB(deeplinksData) : Promise<void> {
    await DeeplinkConfigModel.create(
      { type : "deeplinks",
        deeplinks : deeplinksData
      }
    );
  }
}

export default new DeeplinksUtil();
