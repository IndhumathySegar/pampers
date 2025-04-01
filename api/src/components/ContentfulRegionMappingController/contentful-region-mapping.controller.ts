import type { Request, Response } from "express";
// entities
import { ContentfulRegionMappingModel } from "../../entities";
import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";
import { STATUS } from "../../entities/interfaces/iContentfulRegionMapping";

class RegionMappingController {
  /**
   * Get all getList
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async createRegionMapping(_: Request, res: Response): Promise<Response> {
    const  regionMapping = {
      "email": _.user.email,
      "regions":_.body.regions,
      "contentModels": _.body.contentModels,
      "tags": _.body.tags,
      "createdBy": _.user.firstName,    
      "project": _.body.project,
      "spaceId" : _.body.spaceId,
      isCountry : process.env.IS_COUNTRY,   
  };
    try {    
      
      const record = await ContentfulRegionMappingModel.findOne({ status: STATUS.PENDING});

      if(record) {
        return res.status(400).json({ error: "A job is already in progress. Please try again after the current job is complete." });
      }
      const regionValue = await ContentfulRegionMappingModel.create(regionMapping);
      const payload = { email: _.user.email,module: "Create Region Mapping",action: "Contentful Region Mapping",data: regionMapping, submodule : "Create Region Mapping", user : _.user, status: "Success", actionDetails : `Region Mapping created for below locales ${_.body.regions}`, reqPayload : _.body };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json({message: "Regional creation done successfully",  data: regionValue });
    } catch (ex: any) {
      const payload = { email: _.user.email,module: "Create Region Mapping",action: "Contentful Region Mapping",data: regionMapping, submodule : "Create Region Mapping", user : _.user, status: "Error", actionDetails : `Failed to create Region Mapping for below locales ${_.body.regions}`, reqPayload : _.body };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(400).json({ error: ex.message });
    }
  }
  

  /**
   * Get all getRegion
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
   async getRegionMapping(_: Request, res: Response): Promise<Response> {
    try {
      const {
        pageIndex = 0,
        pageSize = 10,
        sort = -1,
      }: any = _.query;

      const totalCount = await ContentfulRegionMappingModel.countDocuments(
        
      ).exec();
      
  
      const regionValue = await ContentfulRegionMappingModel.find().sort({ _id: sort })
      .limit(Number(pageSize))
      .skip(Number(pageIndex) * Number(pageSize))
      .lean()
      .exec();

      return res.status(200).json({ data: regionValue,totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }


}
export default new RegionMappingController();
