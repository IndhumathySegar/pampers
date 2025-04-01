import { get } from "lodash";

import ContentfulHelper from "../ContentfulController/contentful.helper";


import type { Request, Response } from "express";
// entities
import { ModuleModel, RegionMappingModel } from "../../entities";

const IS_COUNTRY = get(
  process.env,
  "IS_COUNTRY"
)!;
class ModuleController {
  /**
   * Get all getList
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getList(_: Request, res: Response): Promise<Response> {
    try {
    
      const moduleValue = await ModuleModel.find().exec();

      return res.status(200).json({ data: moduleValue });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all getRegion
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
   async getRegion(_: Request, res: Response): Promise<Response> {
    try {
      let regionValue;
      if(IS_COUNTRY==="TRUE") {
        const {regionData} = await ContentfulHelper.fetchUserRegion();
        regionValue = regionData;
 
     } else {
       regionValue = await RegionMappingModel.find().exec();

     }
  

      return res.status(200).json({ data: regionValue });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all getRegion
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
 async getUserRegion(_: Request, res: Response): Promise<Response> {
  try {
    const {user} = _;

    let regionValue;

    if(IS_COUNTRY==="TRUE") {
      const {regionData} = await ContentfulHelper.fetchUserRegion();
      regionValue = regionData;

    } else {
      regionValue = await RegionMappingModel.aggregate([
        {
          $match: {
            regionCode: { $in: user.region },
            "markets.code": { $in: user.markets }
          }
        },
        {
          $project: {
            region: 1,
            regionCode: 1, // Include regionCode in the result
            markets: {
              $filter: {
                input: "$markets",
                as: "market",
                cond: { $in: ["$$market.code", user.markets] }
              }
            }
          }
        },
        {
          $project: {
            region: 1,
            regionCode: 1,
            markets: {
              $map: {
                input: "$markets",
                as: "market",
                in: {
                  code: "$$market.code",
                  name: "$$market.name",
                  locales: {
                    $filter: {
                      input: "$$market.locales",
                      as: "locale",
                      cond: { $in: ["$$locale.code", user.locales] }
                    }
                  }
                }
              }
            }
          }
        }
      ]).exec();
    }

    return res.status(200).json({ data: regionValue, isCountry: IS_COUNTRY });
  } catch (ex: any) {
    return res.status(500).json({ error: ex.message });
  }
}


}
export default new ModuleController();
