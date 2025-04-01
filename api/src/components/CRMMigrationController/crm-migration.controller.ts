import { get, uniq } from "lodash";

import uniqid from "uniqid";

import type { Request, Response } from "express";

import CRMMigrationHelper from "./crm-migration.helper";
import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";
import { ContentfulMigration as Contentful, Nodemailer } from "../../lib";

// interfaces
import {
  IContentfulMigration,
  ContentfulMigration,
} from "../../entities/interfaces/iContentfulMigration";

import ContentfulMigrationModel from "../../entities/contentful-migration";
import { IGetContentfulDataDto } from "../ContentfulController/dto/iContentful.dto";
import { AuditModel, UserModel, UserRoleModel } from "../../entities";
import crmMarketReviewHelper from "../MarketReviewController/crm-market-review.helper";
import { LeanDocument } from "mongoose";
import { IAudit } from "../../entities/interfaces/iAudit";

const CRM_CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;
const MES_CRM_SIT = get(process.env, "CRM_SIT")!;
const CRM_US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP"
)!;
const CRM_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const CRM_US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

const CRM_US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const nodeEnv = process.env.NODE_ENV;

class MigrationController {
  constructor() {
    this.approveCrmConversations = this.approveCrmConversations.bind(this);
  }

  /**
   * Create Migration
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
   async crmMigrate(req: Request, res: Response): Promise<Response> {
    try {
      const requestCRMData = req.body;
      const contentCRMStatus: IContentfulMigration | null =
        await ContentfulMigrationModel.findOne({
          $or: [
            { status: "pending" },
            { status: "content type syncing" },
            { status: "content exporting" },
            { status: "content importing" },
          ],
        }).exec();
      if (contentCRMStatus) {
        return res.status(400).json({
          error: "Some content is progressing, please try after some time",
        });
      }
      if(requestCRMData.contentModels) {
        if(requestCRMData.contentModels[0]===0 ){
          requestCRMData.contentModels.splice(0,1);
       }
      } else {
        requestCRMData.contentModels=[];
      }
 
      if(requestCRMData.localesToMigrate ) {
        if(requestCRMData.localesToMigrate[0]===0){
          requestCRMData.localesToMigrate.splice(0,1);
       }
      } else {
        requestCRMData.localesToMigrate = [];
      }
   
     
      const migrateCRMData: ContentfulMigration = {
        from: requestCRMData.fromEnvironmentId,
        to: requestCRMData.toEnvironmentId,
        project: requestCRMData.project,
        spaceId: requestCRMData.spaceId,
        contentModels: requestCRMData.contentModels,
        localesToMigrate: requestCRMData.localesToMigrate,
        managementToken:
          requestCRMData.spaceId === CRM_US_WEBSITE_CONTENTFUL_SPACE_ID
            ? CRM_US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN
            : CRM_CONTENTFUL_MANAGEMENT_TOKEN,
        createdBy: req.user.email,
        skipAssets: requestCRMData.skipAssets,
        query: {
          lastMigration: requestCRMData.migrateFromDate,
          includeTags: requestCRMData.includeTags,
          excludeTags: requestCRMData.excludeTags,
          contentModels: CRMMigrationHelper.convertCRMTags(requestCRMData.contentModels,requestCRMData.contentModels?.length),
          localesToMigrate:  CRMMigrationHelper.convertCRMTags(requestCRMData.localesToMigrate,requestCRMData.localesToMigrate?.length),
        },
        preAnalyzeContentTypes: uniq(requestCRMData.contentType),
        migrationId: uniqid(),
        isRollBack: false,
      };
 
      const CRMmigration: IContentfulMigration =
        await ContentfulMigrationModel.create(migrateCRMData);
      const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: CRMmigration, submodule : "Content Migration", user : req.user, status: "Success", actionDetails : `Migrated data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId}`, reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      return res
        .status(200)
        .json({ message: "Migration created successfully", result: CRMmigration });
    } catch (ex: any) {
      const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: ex, submodule : "Content Migration", user : req.user, status: "Error", errorDetails : ex, actionDetails : `Failed to migrate data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId}`, reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all environments from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllCrmEnvironments(req: Request, res: Response): Promise<Response> {
    try {
      const { isCRM, isLocale } = req.query;

      const { spaceId }: IGetContentfulDataDto = req.query;
      const contentfulCRMRequest: ContentFulProjectPayload = {
        name: `spaces/${spaceId}/environments`,
        data: {},
        method: "GET",
        auth: true,
        spaceId,
      };
      const CRMenvironments = await Contentful.request(contentfulCRMRequest);
      if (isLocale !== "true" && spaceId !== CRM_US_WEBSITE_CONTENTFUL_SPACE_ID) {
        if (isCRM === "true") {
          CRMenvironments.items = CRMenvironments.items.filter((data) =>
            data.name.includes("crm")
          );
        } else {
          if(nodeEnv==="DEV") {
            CRMenvironments.items = [{name:"dev-master-content"},{name:"dev-staging-content"}];
          } else {
            CRMenvironments.items = CRMenvironments.items.filter(
              (data) => !data.name.includes("crm") && !data.name.includes("dev-master-content") && !data.name.includes("dev-staging-content")
            );
          }
         
        }
      }
      return res.json(CRMenvironments);
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

   /**
    * search translation key in contentful
    * @param {Request} req Request Object
    * @param res
    * @returns {Promise<Response>} Response
    */
   async searchCrmTranslation(req: Request, res: Response): Promise<Response> {
    try {
      const sourceCRM = req.query.sourceLocale as string;
      const destination = req.query.destinationLocale as string;
      const searchTextCRM = req.query.searchText;
      const searchValue = req.query.searchValue as string;
      const moduleNameCRM =
        req.query.isCRM === "true" ? "CRM reviewer record" : "reviewer record";

        const auditConditionCRM: any = {
          module: moduleNameCRM,
          "data.destLocale": req.query.sourceLocale,
        };

  

      const auditRecord: any = await AuditModel.findOne(auditConditionCRM);
      if (req.query.isReviewPage) {
        if (!auditRecord) {
          return res.status(200).json({
            message: "Translation Content Fetched Successful",
            data: {
              extractedData: JSON.parse(JSON.stringify([])),
              totalEntries: 0,
            },
            type: "success",
          });
        }
      }

     
      const contentModel = await crmMarketReviewHelper.fetchCRMMesModel(
        req.query.spaceId,
        req.query.isCRM
      );
      const result = await crmMarketReviewHelper.fetchMesCRMEntries({
        value: searchTextCRM,
        searchValue,
        type: req.query.type,
        pageSize: req.query.pageSize,
        pageIndex: req.query.pageIndex,
        contentModel,
        sourceLocale: sourceCRM,
        destination,
        auditRecord,
        isReviewPage: req.query.isReviewPage,
        spaceId: req.query.spaceId,
        isCRM: req.query.isCRM,
        newResult: [],
        extags: req.query.extags
      });

      return res.status(200).json({
        message: "Translation Content Fetched Successful",
        data: {
          extractedData: JSON.parse(JSON.stringify(result.entries)),
          totalEntries: result.totalEntries,
          entries: result.entries,
        },
        type: "success",
      });
    } catch (ex) {
      console.log("error ----------", ex);
      return res.status(500).json({
        message: ex.message,
        type: "failed",
      });
    }
  }

  /**
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchCrmContentTranslationHistory(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const {
        pageIndex = 0,
        pageSize = 50,
        sort = -1,
        isCRM,
        isReviewPage,
      } = req.query;

      let dbQueryCRM: any = {
        module: "Content Translation",
        type: { $ne: "crm" },
        action: { $ne: "Status update" },
      };

      if (isCRM === "true") {
        dbQueryCRM.type = "crm";
        dbQueryCRM.module = { $in: ["Content Translation", "CRM Translation"] };
      }

      if (isCRM === "true" && isReviewPage === "true") {
        dbQueryCRM.module = { $in: ["CRM Reviewer Translation", "CRM AI Approve Message"] };
      
      }

      if (isCRM !== "true" &&isReviewPage === "true") {
        dbQueryCRM = {
          $or: [
            { module: "Reviewer Translation" },
            { module: "AI Approve Message" },
          ],
        };
      }

      const totalCount = await AuditModel.countDocuments(dbQueryCRM).exec();

      const data: LeanDocument<IAudit>[] = await AuditModel.find(dbQueryCRM)
        .sort({ _id: sort })
        .limit(Number(pageSize))
        .skip(Number(pageIndex) * Number(pageSize))
        .lean()
        .exec();

      return res.status(200).json({ data, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * update translation key values to contentful
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async updateCRMTranslation(req: Request, res: Response) {
    const { locale, details, spaceId, isReviewPage, sourceLocale } = req.body.params;

    try {
      const { isCRM } = req.query;
      const moduleName = "CRM reviewer record";

      let currentEnv =  MES_CRM_SIT ;
      const chunkCRMSize = 7;

      if (spaceId === CRM_US_WEBSITE_CONTENTFUL_SPACE_ID) {
        currentEnv = CRM_US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP;
      }

      const updateCRMChunks: any = [];
      const updateCRMRecord: any = [];
      for (let i = 0; i < details?.length; i += chunkCRMSize) {
        const chunk = details.slice(i, i + chunkCRMSize);

        const updateCRMPromises = chunk.map((entry) => {
          let translatedCRMValue = entry.replacedCRMValue || entry.translatedValue;

            if (isReviewPage && !translatedCRMValue) {
              translatedCRMValue = entry.replacedValue ?? entry.translateValue;
            }            

          const updateCRMEntryPromise = CRMMigrationHelper.updateCRMEntry(
            entry.entryId,
            translatedCRMValue,
            locale,
            isCRM,
            spaceId,
            entry.key,
            entry.type,
            details,
            isReviewPage,
            entry.initialValue
          );

          const updateCRM = CRMMigrationHelper.updateTranslationPayload(entry, translatedCRMValue, isReviewPage);

          const updateCRMAuditPromise = AuditModel.updateOne(
            {
              module: moduleName,
              "data.destLocale": locale,
            },
            {
              $set: updateCRM,
            },
            {
              arrayFilters: [
                {
                  "transl.entryId": entry.entryId,
                  "transl.key": entry.key,
                },
              ],
            }
          );

          return Promise.all([updateCRMEntryPromise, updateCRMAuditPromise]);
        });

        updateCRMChunks.push(Promise.all(updateCRMPromises));
        updateCRMRecord.push(Promise.all(updateCRMPromises));
      }

      await Promise.all(updateCRMChunks);
      await Promise.all(updateCRMRecord);

      details?.forEach((entry) => {
        console.log(`Updated and published entry ${entry.entryId}`);
      });

      
      const moduelNameCRMData = isReviewPage ? "CRM Reviewer Translation" : "CRM Translation";

      const auditCRMPayload = {
        email: req.user.email,
        module: moduelNameCRMData,
        action: `Upload to ${currentEnv}`,
        seen: false,
        type:  "crm",
        data: {
          status: "success",
          destLocale: locale,
          locale: sourceLocale, 
          content: details,
        },
        submodule: moduelNameCRMData,
        user : req.user,
        status : "Success", 
        actionDetails : "Updated translation key values to contentful", 
        reqPayload : req.body
      };

      auditCRMPayload.user = req.user;

      await AdminPanelHelper.createAuditTrail(auditCRMPayload);
        return res.status(200).json({ message: "Updated and published" });
    
    } catch (ex) {
      const currentEnv = MES_CRM_SIT ;

      const CRMmodule ="CRM Translation" ;
      const payload = {
        email: req.user.email,
        module : CRMmodule,
        action: `Upload to ${currentEnv}`,
        data: {
          status: "failed",
          destLocale: locale,
          locale: sourceLocale, 
          content: details,
        },
        submodule : CRMmodule,
        user : req.user,
        status : "Error",
        errorDetails : ex, 
        type: "crm",
        actionDetails : "Failed to update translation key values to contentful", 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);
        return res.status(400).json({
          message: ex.message,
          type: "failed",
        });
      
    }
  }

  /**
   * getConversations
   * @param {Request} req Request Object
   *  @param res
   * @returns {Promise<Response>} Response
   */
  async approveCrmConversations(req: Request, res: Response): Promise<Response> {
    req.body.params = req.body.data;
    const { data, destLocale, isCRM } = req.body;

    try {
      const CRMconversations = await CRMMigrationHelper.createCRMConversations(
        data,
        destLocale,
      );
      const CRMmessages = await CRMMigrationHelper.createCRMMessages(CRMconversations);
      const moduleNameCRM =
      isCRM === true ? "CRM reviewer record" : "reviewer record";

      const approveCRMMessages = await CRMMigrationHelper.approveCRMMessages(
        CRMmessages,
        CRMconversations
      );
      const CRMpayload = {
        email: req.user.email,
        module: isCRM? "CRM AI Approve Message":"AI Approve Message",
        action: isCRM? "CRM AI Approve Message":"AI Approve Message",
        type: isCRM? "crm":"",
        data: {
          status: "success",
          destLocale,
          content: approveCRMMessages,
        },
        submodule : isCRM? "CRM AI Approve Message":"AI Approve Message",
        user : req.user,
        status : "Success",
        actionDetails : `Approved for locale ${destLocale}`, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(CRMpayload);
      await Promise.all(
      data?.map(async (entry) => {
        await AuditModel.updateOne(
          {
            module: moduleNameCRM,
            "data.destLocale": destLocale,
          },
          {
            $pull: {
              "data.content": { entryId: entry.entryId, key: entry.key },
            },
          }
        );
      })
    );
    const roleListCRM: any = await UserRoleModel.find({"permissions.uniqueResourceName":"contentManagement","permissions.subResources.uniqueSubResourceName":"contentManagement:translation", "permissions.subResources.services.uniqueServiceName":"contentManagement:translation:createTranslation"});
    const roleNamesCRM = roleListCRM
    .filter(role => role.name !== "Admin")
    .map(role => role.name);

    const managerListCRM: any = await UserModel.find({
        role: { $in: roleNamesCRM },
        locales:{ $elemMatch: { $eq: destLocale } }
      });
   if (managerListCRM?.length > 0) {
        const emailArray = managerListCRM.map((entry) => entry.email);

        await Nodemailer.sendContentManagerEmail(
          emailArray,
          destLocale,
          data?.length
        );
      }

      return res.status(200).json({
        message: "Approved Successfully",
        data: approveCRMMessages,
        type: "success",
      });
    } catch (error) {
      const payload = {
        email: req.user.email,
        module: "AI Approve Message",
        action: `AI Approve Message`,
        data: {
          status: "failed",
          destLocale,
          error,
        },
        submodule : "AI Approve Message",
        user : req.user,
        status : "Error",
        errorDetails : error,
        actionDetails : `Failed to approve for the locale ${req.body.destLocale}`, 
        reqPayload : req.body
      };

      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(400).json({
        message: error.message,
      });
    }
  }
}
export default new MigrationController();
