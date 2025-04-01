import { get, uniq } from "lodash";
import uniqid from "uniqid";
import archiver from "archiver";// types
import type { Request, Response } from "express";
import { LeanDocument, Types } from "mongoose";
import moment from "moment";

// util
import { ContentfulMigration as Contentful, Nodemailer,BulkMigration } from "../../lib";
import ContentfulHelper from "./contentful.helper";
import MarketReviewHelper from "../MarketReviewController/market-review.helper";
import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";

// entities
import {
  AuditModel,
  ContentfulMigrationModel,
  DeeplinkConfigModel,
  TransactionHistoryModel,
  UserModel,
  CsvUploadHistoryModel,
  UserRoleModel,
  RegionMappingModel
} from "../../entities";

// interfaces
import {
  IContentfulMigration,
  ContentfulMigration,
} from "../../entities/interfaces/iContentfulMigration";
// dto
import {
  ICreateLocaleDto,
  IDEEPLINKSDataDto,
  IDEEPLINKSDto,
  IDEEPLINKSVerionsDto,
  IGetContentfulDataDto,
  IListAllMigrationsDto,
  IListAllBulkMigrationsDto
} from "./dto/iContentful.dto";
import { DeeplinkConfig } from "../../entities/interfaces/iDeeplinkConfig";
import deeplinksUtil from "../../utils/deeplinks-util";
import axios from "axios";
import {
  ITranslationHistory,
  TranslationHistory,
} from "../../entities/interfaces/iTranslationHistory";
import { IAudit } from "../../entities/interfaces/iAudit";
import { Configuration, OpenAIApi } from "openai";
import CommonUtils from "../../utils/common";

const ISO_URL = get(
  process.env,
  "ISO_URL"
)!;

const IS_COUNTRY = get(
  process.env,
  "IS_COUNTRY"
)!;

const CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "CONTENTFUL_ENVIRONMENT_BACKUP"
)!;
const CONTENTFUL_ENVIRONMENT = get(process.env, "CONTENTFUL_ENVIRONMENT")!;

const TO_CONTENTFUL_ENVIRONMENT = get(process.env, "TO_CONTENTFUL_ENVIRONMENT")!;

const CRM_FROM_ENVIRONMENT = get(process.env, "CRM_FROM_ENVIRONMENT")!;

const CRM_TO_ENVIRONMENT = get(process.env, "CRM_TO_ENVIRONMENT")!;

const CONTENTFUL_SPACE_ID = get(process.env, "CONTENTFUL_SPACE_ID")!;
const CONTENTFUL_PROJECT_NAME = get(process.env, "CONTENTFUL_PROJECT_NAME")!;
const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const US_WEBSITE_CONTENTFUL_SPACE_ID = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_SPACE_ID"
)!;

const US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP"
)!;

const US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN"
)!;

const CONTENTFUL_MIGRATION_STORAGE_CONTAINER = get(
  process.env,
  "BULK_MIGRATION_STORAGE_CONTAINER"
)!;

const CRM_SIT = get(process.env, "CRM_SIT")!;
const CRM_UAT = get(process.env, "CRM_UAT")!;
const CRM_PROD = get(process.env, "CRM_PROD")!;
const GEN_API = process.env.GEN_API;
const USER_ID = process.env.GEN_API_USER_ID;
const GEN_API_PROJECT_NAME = process.env.GEN_API_PROJECT_NAME;
const headers: any = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});

const nodeEnv = process.env.NODE_ENV;
const openai = new OpenAIApi(configuration);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ContentfulController {
  constructor() {
    this.approveConversations = this.approveConversations.bind(this);
  }
  /**
   * Get all projects from Contentful
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllProjects(_: Request, res: Response): Promise<Response> {
    try {
      const contentfulRequest: ContentFulProjectPayload = {
        name: "spaces",
        data: {},
        method: "GET",
        auth: true,
      };
      const projects = await Contentful.request(contentfulRequest);

      projects.items = projects.items.filter(item=>item.name===process.env.CONTENTFUL_PROJECT_NAME);
      return res.json(projects);
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all environments from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllEnvironments(req: Request, res: Response): Promise<Response> {
    try {
      const { isCRM, isLocale } = req.query;

      const { spaceId }: IGetContentfulDataDto = req.query;
      const contentfulRequest: ContentFulProjectPayload = {
        name: `spaces/${spaceId}/environments`,
        data: {},
        method: "GET",
        auth: true,
        spaceId,
      };
      const environments = await Contentful.request(contentfulRequest);
      if (isLocale !== "true" && spaceId !== US_WEBSITE_CONTENTFUL_SPACE_ID) {
        if (isCRM === "true") {
          environments.items = environments.items.filter((data) =>
            data.name.startsWith("crm")
          );
        } else {
          if(nodeEnv==="DEV") {
            environments.items = [{name:"dev-master-content"},{name:"dev-staging-content"}];
          } else {
            environments.items = environments.items.filter(
              (data) => !data.name.includes("crm") && !data.name.includes("dev-master-content") && !data.name.includes("dev-staging-content")
            );
          }
         
        }
      }
      return res.json(environments);
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all migrations
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllMigrations(req: Request, res: Response): Promise<Response> {
    try {
      const {
        pageIndex = 0,
        pageSize = 50,
        sort = -1,
        isCRM,
      }: IListAllMigrationsDto = req.query;

    
      let condition: any = {};

      if (isCRM === "true") {
        condition = {
          $and: [
         
            {
              // $and: [
              //   {
              //     $or: [{ from: CRM_SIT }, { from: CRM_UAT }],
              //   },
              //   {
              //     $or: [{ to: CRM_UAT }, { to: CRM_PROD }],
              //   },
              // ],
              $and: [
                { $or: [{ from: "crm-sit" }, { from: "crm-uat" }, { from: "dev-crm-uat" }, { from: "dev-crm-sit" }, { from: "dev-crm-prod" }] },
                { $or: [{ to: "crm-uat" }, { to: "crm-prod" }, { to: "dev-crm-uat" }, { to: "dev-crm-sit" }, { to: "dev-crm-prod" }] },
               
               
              ],
            },
            {
              $and: [{ project: { $ne: "Pampers Catalog" } }],
            },
            {
              $or: [
                { isCatalogue: false },
                { isCatalogue: null },
                { isCatalogue: { $exists: false } },
              ],
            },
          ],
        };
      } else {
        condition = {
          $and: [
            {
              $and: [{ from: { $ne: CRM_SIT } }, { from: { $ne: CRM_UAT } }],
            },
            {
              $and: [{ to: { $ne: CRM_UAT } }, { to: { $ne: CRM_PROD } }],
            },
            {
              $and: [{ project: { $ne: "Pampers Catalog" } }],
            },
            {
              $or: [
                { isCatalogue: false },
                { isCatalogue: null },
                { isCatalogue: { $exists: false } },
              ],
            },
            // additional conditions
          ],
        };
      }
      if(req.query.rollBack){        
        condition.$and.push({ rollBackDate: { $ne: null } });
      }
      const totalCount = await ContentfulMigrationModel.countDocuments(
        condition
      ).exec();
      const migrations: LeanDocument<IContentfulMigration>[] =
        await ContentfulMigrationModel.find(condition)
          .sort({ _id: sort })
          .limit(Number(pageSize))
          .skip(Number(pageIndex) * Number(pageSize))
          .lean()
          .exec();
      return res.status(200).json({ data: migrations, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Create Migration
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async migrate(req: Request, res: Response): Promise<Response> {
    if(req.body.isCRM) {
      req.body.fromEnvironmentId =  CRM_FROM_ENVIRONMENT;
      req.body.toEnvironmentId = CRM_TO_ENVIRONMENT;
    } else {
      req.body.fromEnvironmentId =  CONTENTFUL_ENVIRONMENT;
      req.body.toEnvironmentId = TO_CONTENTFUL_ENVIRONMENT;
    }
    try {
     
      const requestData = req.body;    
  
      const contentStatus =
        await ContentfulHelper.getContentModelData();
      if (contentStatus) {
        return res.status(400).json({
          error: "Some content is progressing, please try after some time",
        });
      }
      if(requestData.contentModels) {
        if(requestData.contentModels[0]===0 ){
          requestData.contentModels.splice(0,1);
       }
      } else {
        requestData.contentModels=[];
      }

      if(requestData.localesToMigrate ) {
        if(requestData.localesToMigrate[0]===0){
          requestData.localesToMigrate.splice(0,1);
       }
      } else {
        requestData.localesToMigrate = [];
      }
    
      const migrateData: ContentfulMigration = {
        from: requestData.fromEnvironmentId,
        to: requestData.toEnvironmentId,
        project: requestData.project,
        spaceId: requestData.spaceId,
        contentModels: requestData.contentModels,
        region: requestData.region,
        market: requestData.market,
        localesToMigrate: requestData.localesToMigrate,
        managementToken:
          requestData.spaceId === US_WEBSITE_CONTENTFUL_SPACE_ID
            ? US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN
            : CONTENTFUL_MANAGEMENT_TOKEN,
        createdBy: req.user.email,
        skipAssets: requestData.skipAssets,
        query: {
          lastMigration: requestData.migrateFromDate,
          includeTags: requestData.includeTags,
          excludeTags: requestData.excludeTags,
          contentModels: ContentfulHelper.convertTags(requestData.contentModels,requestData.contentModels.length),
          localesToMigrate:  ContentfulHelper.convertTags(requestData.localesToMigrate,requestData.localesToMigrate.length),
        },
        preAnalyzeContentTypes: uniq(requestData.contentType),
        migrationId: uniqid(),
        isRollBack: requestData.isRollBack,
      };

      const migration: IContentfulMigration =
        await ContentfulMigrationModel.create(migrateData);
      const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: migration, submodule : "Content Migration", user : req.user, status: "Success", actionDetails : `Migrated data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId} in the region - ${req.body.region}, market - ${req.body.market}, locale - ${req.body.localesToMigrate} `, reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      return res
        .status(200)
        .json({ message: "The request for migration has been submitted. Progress can be viewed on Migration History feature", result: migration });
    } catch (ex: any) {
      const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: ex, submodule : "Content Migration", user : req.user, status: "Error", errorDetails : ex, actionDetails : `Failed to migrate data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId} in the region - ${req.body.region}, market - ${req.body.market}, locale - ${req.body.localesToMigrate} `, reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Create Migration Rollback
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async migrationRollBack(req: Request, res: Response): Promise<Response> {

      try {     
        const migrationExistingData:any = await ContentfulMigrationModel.findOne({_id : req.body._id}).exec();
    

        const contentStatus=
        await ContentfulHelper.getContentModelData();
        if (contentStatus) {
          return res.status(400).json({
            error: "Some content is progressing, please try after some time",
          });
        }
       const rollBackDateStatus = moment().diff(moment(migrationExistingData.createdAt), "days") < 6;
               
      if(  !migrationExistingData.rollBackStatus && (migrationExistingData.status === "success" || migrationExistingData.status === "failed") && migrationExistingData.backupFilePath && rollBackDateStatus) {
        
        const rollBackPayload = {
          rollBackStatus : "pending",
          rollBackDate : new Date(),
          reasonForRollBack : req.body.reasonForRollBack,
          rollBackInitiatedBy: req.user.email
        };
        await ContentfulMigrationModel.updateOne(
          { _id: Types.ObjectId(req.body._id) },  
          { $set: rollBackPayload }
        ).exec();
        
        const payload = { email: req.user.email,module: "Rollback Migration",action: "Rollback Migration",data: migrationExistingData, submodule : "Rollback Migration", user : req.user, status: "Success", actionDetails : `Rollback migrated data from ${migrationExistingData.from} to ${migrationExistingData.to} in the region - ${migrationExistingData.region}, market - ${migrationExistingData.market}, locale - ${migrationExistingData.localesToMigrate} `, reqPayload : req.body };
        await AdminPanelHelper.createAuditTrail(payload);
        return res
          .status(200)
          .json({ message: "The request for migration rollback has been submitted. Progress can be viewed on Rollback History feature", result: migrationExistingData });

      } else {
        return res.status(400).json({ error: "you are not authorized to perform." });
      }
        
      } catch (ex: any) {

        const migrationExistingData:any = await ContentfulMigrationModel.findOne({_id : req.body._id}).exec();
        const payload = { email: req.user.email,module: "Rollback Migration",action: "Rollback Migration",data: ex, submodule : "Rollback Migration", user : req.user, status: "Error", errorDetails : ex, actionDetails : `Failed to Rollback migrated data from ${migrationExistingData.from} to ${migrationExistingData.to} in the region - ${migrationExistingData.region}, market - ${migrationExistingData.market}, locale - ${migrationExistingData.localesToMigrate} `, reqPayload : req.body};
        await AdminPanelHelper.createAuditTrail(payload);
        return res.status(500).json({ error: ex.message });
      }
    }

  /**
   * Create Migration
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async crmMigrate(req: Request, res: Response): Promise<Response> {
      try {
        const requestData = req.body;
        const contentStatus = await ContentfulHelper.getContentModelData();
        if (contentStatus) {
          return res.status(400).json({
            error: "Some content is progressing, please try after some time",
          });
        }
        if(requestData.contentModels) {
          if(requestData.contentModels[0]===0 ){
            requestData.contentModels.splice(0,1);
         }
        } else {
          requestData.contentModels=[];
        }
   
        if(requestData.localesToMigrate ) {
          if(requestData.localesToMigrate[0]===0){
            requestData.localesToMigrate.splice(0,1);
         }
        } else {
          requestData.localesToMigrate = [];
        }
     
       
        const migrateData: ContentfulMigration = {
          from: requestData.fromEnvironmentId,
          to: requestData.toEnvironmentId,
          project: requestData.project,
          spaceId: requestData.spaceId,
          contentModels: requestData.contentModels,
          localesToMigrate: requestData.localesToMigrate,
          managementToken:
            requestData.spaceId === US_WEBSITE_CONTENTFUL_SPACE_ID
              ? US_WEBSITE_CONTENTFUL_MANAGEMENT_TOKEN
              : CONTENTFUL_MANAGEMENT_TOKEN,
          createdBy: req.user.email,
          skipAssets: requestData.skipAssets,
          query: {
            lastMigration: requestData.migrateFromDate,
            includeTags: requestData.includeTags,
            excludeTags: requestData.excludeTags,
            contentModels: ContentfulHelper.convertTags(requestData.contentModels,requestData.contentModels.length),
            localesToMigrate:  ContentfulHelper.convertTags(requestData.localesToMigrate,requestData.localesToMigrate.length),
          },
          preAnalyzeContentTypes: uniq(requestData.contentType),
          migrationId: uniqid(),
          isRollBack: false,
        };
   
        const migration: IContentfulMigration =
          await ContentfulMigrationModel.create(migrateData);
        const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: migration, submodule : "Content Migration", user : req.user, status: "Success", actionDetails : `Migrated data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId}`, reqPayload : req.body };
        await AdminPanelHelper.createAuditTrail(payload);
        return res
          .status(200)
          .json({ message: "Migration created successfully", result: migration });
      } catch (ex: any) {
        const payload = { email: req.user.email,module: "Content Migration",action: "Content Migration",data: ex, submodule : "Content Migration", user : req.user, status: "Error", errorDetails : ex, actionDetails : `Failed to migrate data from ${req.body.fromEnvironmentId} to ${req.body.toEnvironmentId}`, reqPayload : req.body};
        await AdminPanelHelper.createAuditTrail(payload);
        return res.status(500).json({ error: ex.message });
      }
    }

  /**
   * Get all tags from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getIsoCodeList(req: Request, res: Response): Promise<Response> {
    try {
      const {region} = req.body;
      const response = await axios.get(ISO_URL);
      const countries = response.data.data;
       
  
      const countryCodes = Object.keys(countries).map(code => ({
        name: countries[code].country,
        code,
        region: countries[code].region
        
      }));
      const resCountry = countryCodes.filter(item=>item.region === region);
      resCountry.push({
        name: "Kosovo",
        code: "XK",
        region: "Europe"
      });
      return res.status(200).json(resCountry);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: error.message });
    }
  }


  /**
   * Get all tags from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllTags(req: Request, res: Response): Promise<Response> {
    try {
      let { spaceId, environmentId }: IGetContentfulDataDto = req.query;
      const { forTranslation }: any = req.query;

      if (forTranslation) {
        spaceId = CONTENTFUL_SPACE_ID;
        environmentId = CONTENTFUL_ENVIRONMENT_BACKUP;
      }

      const contentfulRequest: ContentFulProjectPayload = {
        name: `spaces/${spaceId}/environments/${environmentId}/tags`,
        data: { limit: 1000 },
        method: "GET",
        auth: true,
        spaceId,
      };
      const tags = await Contentful.request(contentfulRequest);
      return res.json(tags);
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all tags from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async createContentfulLocale(req: Request, res: Response): Promise<Response> {
    try {
      const validationError = CommonUtils.validateCreateLocalePayload(req.body);
      if (!!validationError) {
        return res.status(400).json({
          error: validationError,
        });
      }

      const {
        spaceId = "",
        environmentIds = [],
        code = "",
        country = "",
        language = "",
        projectName = "",
        region,
        regionName = "",
        markets,
      }: ICreateLocaleDto = req.body;
      let market: any = markets;

      if(IS_COUNTRY !=="TRUE") {
        const existCode: any = await RegionMappingModel.findOne(
          {  "markets.locales.code": code },       
        );      
        
        if(existCode  ) {
          return res.status(400).json({ message: "Locale already exists within Content Automation. You can not re-create it again" });
        }
  
        const regionMapping: any = await RegionMappingModel.findOne(
          { regionCode: region, "markets.code": markets },
       
        );
        
        if (!regionMapping) {
          return res.status(400).json({ message: "Region not exist." });
        }
  
        if (regionMapping.markets.length===0) {
          return res.status(400).json({ message: "Market not exist." });
        }
         market = regionMapping.markets.find(item=>item.code === markets); // Access the matched market 
        
        if(!market) {
          return res.status(400).json({ message: "Please select correct region and market." });
        }
       
      }

  
     const results = await ContentfulHelper.createLocale(
        spaceId,
        environmentIds,
        code,
        language,
        market,
        region,
        regionName
      );

      let message = "Locale has been created successfully";
      let isError = false;


      if (results.some((result) => result.type === "error")) {
        message = "Locale creation failed in some environments.";
        isError = true;
      } else if (results.length > 0 && results.every((result) => result.type === "existing")) {
        message = "Locale already exists within Content Automation. You can not re-create it again";
        isError = true;
      }

      const payload = {
        email: req.user.email,
        module: "Locale Management",
        action: "Create New Locale",
        data: {
          res: results,
          isError,
          req: {
            spaceId,
            environmentIds,
            code,
            country,
            language,
            projectName,
          },
        },
        submodule : "Locale Management",
        user : req.user,
        status: "Success",
        actionDetails : `Created new locale with region - ${region}, market - ${markets} and locale code - ${code}`,
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);   
      
      let name = language;
      if (market.name) {
        name = `${market.name}-${language}`;
      }
      await RegionMappingModel.updateOne(
        { regionCode: region, "markets.code": markets },
        { $push: { "markets.$.locales": { name, code } } } as any
      );
      await UserModel.updateMany({ role: "Admin" }, {
        $push: { locales: code },
      } as any);
           

      return res.json({ message, results, isError });
    } catch (ex: any) {
      const payload = { email: req.user.email,module: "Locale Management",action: "Create New Locale",data: ex, submodule : "Locale Management", user : req.user, status: "Error", errorDetails : ex, actionDetails : `Failed to create new locale - ${req.body.code}`, reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchNewLocaleHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { pageIndex = 0, pageSize = 50, sort = -1 } = req.query;

      const dbQuery = {
        module: "Locale Management",
        action: "Create New Locale",
      };
      const totalCount = await AuditModel.countDocuments(dbQuery).exec();

      const data: LeanDocument<IAudit>[] = await AuditModel.find(dbQuery)
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
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchContentTranslationHistory(
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

      let dbQuery: any = {
        module: "Content Translation",
        type: { $ne: "crm" },
        action: { $ne: "Status update" },
      };

      if (isCRM === "true") {
        dbQuery.type = "crm";
        dbQuery.module = { $in: ["Content Translation", "CRM Translation"] };
      }

      if (isCRM === "true" && isReviewPage === "true") {
        dbQuery.module = { $in: ["CRM Reviewer Translation", "CRM Translation", "CRM AI Approve Message"] };
      
      }

      if (isCRM !== "true" &&isReviewPage === "true") {
        dbQuery = {
          $or: [
            { module: "Reviewer Translation" },
            { module: "AI Approve Message" },
          ],
        };
      }

      const totalCount = await AuditModel.countDocuments(dbQuery).exec();

      const data: LeanDocument<IAudit>[] = await AuditModel.find(dbQuery)
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
   * Fetch deeplinks versions
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async deepLinksVersions(req: Request, res: Response): Promise<Response> {
    try {
      let result = {};
      const { market }: IDEEPLINKSVerionsDto = req.query;
      const deeplinksData: LeanDocument<DeeplinkConfig> | null =
        await DeeplinkConfigModel.findOne({ type: "deeplinks" }).lean().exec();
      const marketKey: string | undefined = market?.toUpperCase();

      if (
        !deeplinksData ||
        (marketKey !== undefined &&
          !deeplinksData.deeplinks.hasOwnProperty(marketKey))
      ) {
        return res.status(200).json({
          message: "No Deeplink present for the market/version",
          result: {},
        });
      }

      const deeplinksDotData = await deeplinksUtil.convertToDotKeyStructure(
        deeplinksData,
        market?.toUpperCase(),
        "-",
        "."
      );
      result = Object.keys(deeplinksDotData.deeplinks[market!.toUpperCase()]);

      return res
        .status(200)
        .json({ message: "Deeplinks versions fetched successfully", result });
    } catch (ex: any) {
      console.log("error : ", ex);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Fetch deeplinks
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async deepLinksView(req: Request, res: Response): Promise<Response> {
    try {
      let result = {};
      const { market, version }: IDEEPLINKSDto = req.query;
      const deeplinksData: LeanDocument<DeeplinkConfig> | null =
        await DeeplinkConfigModel.findOne({ type: "deeplinks" }).lean().exec();

      if (!deeplinksData) {
        return res.status(200).json({
          message: "No Deeplink present for the market/version",
          result: {},
        });
      }

      const deeplinksDotData = await deeplinksUtil.convertToDotKeyStructure(
        deeplinksData,
        market?.toUpperCase(),
        "-",
        "."
      );
      result = deeplinksDotData.deeplinks[market!.toUpperCase()][version];

      return res
        .status(200)
        .json({ message: "Deeplinks fetched successfully", result });
    } catch (ex: any) {
      console.log("error : ", ex);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Update newly created deeplinks
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async deepLinksManage(req: Request, res: Response): Promise<Response> {
    try {
      const { deeplinktUpdate, market, version }: IDEEPLINKSDataDto = req.body;
      const deeplinksData: LeanDocument<DeeplinkConfig> | null =
        await DeeplinkConfigModel.findOne({ type: "deeplinks" }).lean().exec();
      const commonKeys = await deeplinksUtil.validateDeeplinkUpdate(
        deeplinksData,
        deeplinktUpdate,
        market?.toUpperCase(),
        version?.replaceAll("-", ".")
      );
      if (commonKeys.length === 1 && commonKeys[0] === "not permitted") {
        return res.status(403).json({
          error: {
            message:
              "Version is not latest.\n And creation of mid-version is not allowed!",
          },
        });
      }
      const [message, newVersion] =
        commonKeys.length === 1 && commonKeys[0] === "New Created"
          ? ["Deeplinks updated successfully", true]
          : ["Deeplinks updated successfully with duplicates found!", false];

      return res.status(200).json({ message, commonKeys, newVersion });
    } catch (ex: any) {
      console.log("error : ", ex);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * search translation key in contentful
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async searchTranslation(req: Request, res: Response): Promise<Response> {
    try {
      const source = req.query.sourceLocale as string;
      const destination = req.query.destinationLocale as string;
      const searchText = req.query.searchText;
      const searchValue = req.query.searchValue as string;
      const moduleName =
        req.query.isCRM === "true" ? "CRM reviewer record" : "reviewer record";

        const auditCondition: any = {
          module: moduleName,
          "data.destLocale": req.query.sourceLocale,
        };

  

      const auditRecord: any = await AuditModel.findOne(auditCondition);
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

     
      const contentModel = await MarketReviewHelper.fetchCRMModel(
        req.query.spaceId,
        req.query.isCRM
      );
      const result = await MarketReviewHelper.fetchCRMEntries({
        value: searchText,
        searchValue,
        type: req.query.type,
        pageSize: req.query.pageSize,
        pageIndex: req.query.pageIndex,
        contentModel,
        sourceLocale: source,
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
   * update translation key values to contentful
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async updateTranslation(req: Request, res: Response) {
    const { locale, details, spaceId, isReviewPage,isApprove } = req.body.params;

    try {
      const { isCRM } = req.query;
      const moduleName = "reviewer record";

      let currentEnv =  CONTENTFUL_ENVIRONMENT;
      const chunkSize = 7;

      if (spaceId === US_WEBSITE_CONTENTFUL_SPACE_ID) {
        currentEnv = US_WEBSITE_CONTENTFUL_ENVIRONMENT_BACKUP;
      }

      for (let i = 0; i < details.length; i += chunkSize) {
        const chunk = details.slice(i, i + chunkSize);

        const updatePromises = chunk.map(async (entry) => {
          const translatedValue = ContentfulHelper.getTranslatedValue(entry, isReviewPage);
          try {
            await delay(500); // Prevent API rate limiting
  
            const updateEntryPromise = ContentfulHelper.updateEntry({
              entryId: entry.entryId,
              translatedValue,
              locale,
              isCRM,
              spaceId,
              key: entry.key,
              type: entry.type,
              details,
              isReviewPage,
              sourceValue:  entry.initialValue
            });

            const update = ContentfulHelper.updateTranslationPayload(entry, translatedValue, isReviewPage);

            const updateAuditPromise = AuditModel.updateOne(
            {
              module: moduleName,
              "data.destLocale": locale,
             },
            {
                $set: update,
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

            await Promise.all([updateEntryPromise, updateAuditPromise]);
          } catch (error) {
            if (error.response?.status === 429) {
              const waitTime = error.response.headers["X-Contentful-RateLimit-Reset"] * 1000 || 1000;
              console.log(`Rate limit exceeded. Retrying in ${waitTime}ms... `);
              await delay(waitTime);
            } else {
              throw error;
            }
          }
        });
  
        await Promise.all(updatePromises);
      }
  
      details.forEach(entry => console.log(`Updated and published entry ${entry.entryId}`));
  
      const moduelNameData = ContentfulHelper.getReviewerModuleName(isReviewPage);
      const auditPayload = {
        email: req.user.email,
        module: moduelNameData,
        action: `Upload to ${currentEnv}`,
        seen: false,
        type: "",
        data: {
          status: "success",
          destLocale: locale,
          content: details,
        },
        submodule:moduelNameData,
        user : req.user,
        status : "Success", 
        actionDetails : "Updated translation key values to contentful", 
        reqPayload : req.body
      };

      auditPayload.user = req.user;

      await AdminPanelHelper.createAuditTrail(auditPayload);
      return isApprove ? true : res.status(200).json({ message: "Updated and published" });
    
    } catch (ex) {
      const currentEnv = CONTENTFUL_ENVIRONMENT;

      const module = "Content Translation";
      const payload = {
        email: req.user.email,
        module,
        action: `Upload to ${currentEnv}`,
        data: {
          status: "failed",
          destLocale: locale,
          content: details,
        },
        submodule : module,
        user : req.user,
        status : "Error",
        errorDetails : ex, 
        type: "",
        actionDetails : "Failed to update translation key values to contentful", 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return isApprove ? false : res.status(200).json({  message: ex.message, type: "failed"});

    }
  }



  /**
   * submit reviewer
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async submitReviewer(req: Request, res: Response): Promise<Response> {
    try {
      await ContentfulHelper.reviewerUpdate(req.body, req.user.email, req.user);

      return res
        .status(200)
        .json({ message: "Content submitted to the reviewer" });
    } catch (ex) {
      const moduleName = req.body.isCRM ?  "CRM reviewer record" : "reviewer record";
      const submoduleName = req.body.isCRM ?  "CRM reviewer record" : "reviewer record";
      const payload = {email: req.user.email, module: moduleName,action: "Reviewer Update", data: req.query.file,submodule : submoduleName,status : "Error",errorDetails : ex, user : req.user, actionDetails : `Failed to submit reviewer from locale ${req.body.sourceLocale} to ${req.body.destLocale}`, reqPayload : req.body};
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
  async approveConversations(req: Request, res: Response): Promise<Response> {
    req.body.params = req.body.updateData;
    req.body.params.isApprove = true;
    await this.updateTranslation(req,res);
    
    const { data, destLocale, isCRM } = req.body;

    try {
      const moduleName =
      isCRM === true ? "CRM reviewer record" : "reviewer record";
      
      data.map(async (entry) => {
        await AuditModel.updateOne(
          {
            module: moduleName,
            "data.destLocale": destLocale,
          },
          {
            $pull: {
              "data.content": { entryId: entry.entryId, key: entry.key },
            },
          }
        );
      });
   
    const roleList: any = await UserRoleModel.find({"permissions.uniqueResourceName":"contentManagement","permissions.subResources.uniqueSubResourceName":"contentManagement:translation", "permissions.subResources.services.uniqueServiceName":"contentManagement:translation:createTranslation"});
    const roleNames = roleList
    .filter(role => role.name !== "Admin")
    .map(role => role.name);

    const managerList: any = await UserModel.find({
        role: { $in: roleNames },
        locales:{ $elemMatch: { $eq: destLocale } }
      });
    if (managerList.length > 0) {
        const emailArray = managerList.map((entry) => entry.email);

         Nodemailer.sendContentManagerEmail(
          emailArray,
          destLocale,
          data.length
        );
      }

      return res.status(200).json({
        message: "Approved Successfully",
        type: "success",
      });
    } catch (error) {
      
      return res.status(400).json({
        message: error.message,
      });
    }
  }

  

  /**
   * update Status key values to contentful
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      await TransactionHistoryModel.updateOne(
        { _id: Types.ObjectId(req.body._id) },
        {
          $set: {
            status: "stopped",
            stoppedBy: req.user._id,
          },
        }
      ).exec();
      const transactionData = await TransactionHistoryModel.findOne({_id:Types.ObjectId(req.body._id)} );
      const payload = { email : req.user.email, module: "Content Translation",action: "Status update", data: transactionData,submodule : "Content Translation",user : req.user,status : "Success", actionDetails : "Status updated to stopped" , reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
      const transactionData = await TransactionHistoryModel.findOne({_id:Types.ObjectId(req.body._id)} );
      const payload = { email : req.user.email, module: "Content Translation",action: "Status update", data: transactionData,submodule : "Content Translation",user : req.user,status : "Error", errorDetails : error, actionDetails : "Failed to update the status", reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(400).json({ message: error.message });
    }
  }

  /**
   * Translate the value of content using chatGPT api
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async translate(req: Request, res: Response): Promise<Response> {
    try {
      if (GEN_API !== undefined) {
        headers.userid = USER_ID;
        headers["project-name"]= GEN_API_PROJECT_NAME;
        let isError = false;
        let errorData = "";
        const entries = req.body.content;
        const {sourceLocale, destLocale} = req.body;
        const translated: any = [];
        const token = await ContentfulHelper.fetchAItoken();
        headers.Authorization = `Bearer ${token}`;

        await Promise.all(
          entries.map(async (entry) => {
            let response;
            let translatedValue;
            try{
              if(!entry.isCheckDisabled){
                response = await axios.post(
                  `${GEN_API}`,
                  {
                    target_language: destLocale.replace("-","_").toLocaleLowerCase(),
                    source_language: sourceLocale.replace("-","_").toLocaleLowerCase(),
                    max_output_length: entry.charLimit,
                    text_to_translate:entry.value, 
                    model_name: "GPT-4O-2024-08-06",
                    expected_tone: "Translate naturally and conversationally, avoiding literal or overly formal language. Adapt the text to the communication style of the target country and language. Do not translate word-for-word if a more natural phrasing works better. Use gender-neutral language for children, with a warm, supportive, and informative tone. Convert Fahrenheit to Celsius if the source is en_US. Replace Pampers word with Dodot if target language is es_ES.",
                    list_of_terms : {},
                  },
                  { headers }
                );
              
                translatedValue = response.data.translation;
                entry.translatedValue = translatedValue;
                entry.value = translatedValue;
              }
              else{
                translatedValue = entry.value;
                entry.translatedValue = translatedValue;
                entry.value = translatedValue;
              }

            translated.push({
              key: entry.key,
              value: translatedValue,
              orr: {orr:entry},
              translatedValue,
              // conversationId,
              status: "success",
            });
          }catch(e) {
            errorData = ContentfulHelper.handleTranslateErr(e, errorData);
            isError = true;
          }
          })
        );
        const payload = {
          email: req.user.email,
          module: await ContentfulHelper.getModuleName(req),
          action: "Translate Keys",
          type: await ContentfulHelper.checkCRM(req),
          data: {
            status: "success",
            destLocale: req.body.destLocale,
            content: entries,
            translated,
            locale: req.body.sourceLocale,
          },
          submodule :  await ContentfulHelper.getModuleName(req),
          user : req.user,
          status : "Success",
          actionDetails : `Translated the content to ${req.body.destLocale}`, 
          reqPayload : req.body
        };
  
        await AdminPanelHelper.createAuditTrail(payload);
        if(isError) {
          return res.status(400).json({
            message: errorData ? errorData : "Some Contents got failed..",
            translatedValue: translated,
            type: "failed",
          });
        }

        return res.status(200).json({
          message: "Translation API called Successfully.",
          translatedValue: translated,
          type: "success",
        });
      } else {
        const payload = {
          email: req.user.email,
          module:  await ContentfulHelper.getModuleName(req),
          action: "Translate Keys",
          type: await ContentfulHelper.checkCRM(req),
          data: {
            status: "failed",
            message: "GEN AI API is not defined",
            destLocale: req.body.destLocale,
            content: req.body.content,
            locale: req.body.sourceLocale,
          },
          submodule :  await ContentfulHelper.getModuleName(req),
          user : req.user,
          status : "Error",
          errorDetails : "GEN AI API is not defined",
          actionDetails : `Failed to translate the content to ${req.body.destLocale}`, 
          reqPayload : req.body
        };
  
        await AdminPanelHelper.createAuditTrail(payload);

        // Handle the case when GEN AI API is undefined
        return res.status(404).json({
          message: "GEN AI API is not defined",
          translatedValue: {},
          type: "failed",
        });
      }
    } catch (ex) {
      console.log("error ----------", ex);
      const payload = {
        email: req.user.email,
        module:  await ContentfulHelper.getModuleName(req),
        action: "Translate Keys",
        data: {
          status: "failed",
          message: ex.message,
          destLocale: req.body.destLocale,
          content: req.body.content,
        },
        submodule :  await ContentfulHelper.getModuleName(req),
        user : req.user,
        status : "Error",
        errorDetails : ex,
        actionDetails : `Failed to translate content to ${req.body.destLocale}`, 
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
   * Get all Content Models from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchContentModel(req: Request, res: Response): Promise<Response> {
    try {
      const contentModel = await ContentfulHelper.fetchContentModel(
        req.query.isCRM,
        req.query.spaceId
      );

      let region;

      if(IS_COUNTRY === "TRUE" && (req.query.isCRM === "false"||!req.query.isCRM)) {
         region = await ContentfulHelper.fetchCountry(
          req.user.market,
          req.query.isCRM,
          req.query.spaceId,
          req.query.isReviewPage
        );
      } else {
         region = await ContentfulHelper.fetchRegion(
          req.user.market,
          req.query.isCRM,
          req.query.spaceId,
          req.query.isReviewPage
        );
      }  

      const assignedLocales = region.filter((item) =>
        req.user.locales?.includes(item.regionCode)
      );
      return res.status(200).json({
        contentModel,
        region: assignedLocales,
        source: region,
        message: "Content Models Fetched Successfully",
        isCountry: IS_COUNTRY,
      });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all Content Models from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
   async fetchMigrationModel(req: Request, res: Response): Promise<Response> {
    try {
      const contentModel = await ContentfulHelper.fetchMigrationModel(
        req.query.environment,
        req.query.spaceId
      );

      const region = await ContentfulHelper.fetchMigrationRegion(
        req.user.market,
        req.query.environment,
        req.query.spaceId,
        req.query.isReviewPage
      );
      const assignedLocales = region.filter(item=>req.user.locales?.includes(item));
      
      return res.status(200).json({
        contentModel,
        region: assignedLocales,
        message: "Content Models Fetched Successfully",
        isCountry: IS_COUNTRY,
      });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get all Content Models from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async startTranslationJobs(req: Request, res: Response): Promise<any> {
    try {
      const {
        sourceLocale,
        destLocale,
        models,
        user,
        clone,
        byTags,
        excludedTags,
        includedTags,
      } = req.body.params;

      if (!byTags) {
        const existingJob = await TransactionHistoryModel.findOne({
          content_type: { $in: models },
          $or: [{ status: "started" }, { status: "enqueued" }],
          "sourceLocale.regionCode": sourceLocale.regionCode,
          "targetLocale.regionCode": destLocale.regionCode,
        });

        if (existingJob) {
          return res.status(400).json({
            message: `${existingJob.content_type} content types is already in progress`,
          });
        }

        // Create database records for each model without the entries property
        for (const model of models) {
          const historyData: TranslationHistory = {
            initiatedBy: user,
            spaceId: CONTENTFUL_SPACE_ID,
            project: CONTENTFUL_PROJECT_NAME,
            cloned: clone,
            content_type: model,
            sourceLocale,
            targetLocale: destLocale,
            status: "enqueued",
            total_entries: 0, // Initialize total_entries to 0
            remaining_entries: 0, // Initialize remaining_entries to 0
            eta: 0,
          };

          await TransactionHistoryModel.create(historyData);
          console.log(`Created transaction record for model: ${model}`);
        }
      } else {
        // for tags based translation just create one record
        const historyData: TranslationHistory = {
          initiatedBy: user,
          spaceId: CONTENTFUL_SPACE_ID,
          project: CONTENTFUL_PROJECT_NAME,
          cloned: clone,
          content_type: "N/A",
          sourceLocale,
          targetLocale: destLocale,
          byTags,
          includedTags,
          excludedTags,
          status: "enqueued",
          total_entries: 0, // Initialize total_entries to 0
          remaining_entries: 0, // Initialize remaining_entries to 0
          eta: 0,
        };

        await TransactionHistoryModel.create(historyData);
      }
      const auditModuleName = clone ? "Clone Content" : "AI Translate";
      const auditModuleMessage = clone ? `Content cloned for new markets from ${req.body.params.sourceLocale.regionCode} to ${req.body.params.destLocale.regionCode}` : `Content translated for new markets from ${req.body.params.sourceLocale.regionCode} to ${req.body.params.destLocale.regionCode}`;

      const payload = { email: req.user.email, module: auditModuleName,  action: "Job creation", data: req.body, submodule : auditModuleName, status : "Success", user : req.user, actionDetails : auditModuleMessage, reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      res.status(200).json({
        message: "Job created successfully",
      });
    } catch (ex: any) {
      const auditModuleName = req.body.params.clone ? "Clone Content" : "AI Translate";
      const auditModuleMessage = req.body.params.clone ? `Failed to clone content for new markets from ${req.body.params.sourceLocale.regionCode} to ${req.body.params.destLocale.regionCode}` : `Failed to translate content for new markets from ${req.body.params.sourceLocale.regionCode} to ${req.body.params.destLocale.regionCode}`;

      const payload = { email: req.user.email, module: auditModuleName,  action: "Job creation", data: req.body, submodule : auditModuleName, status : "Error", errorDetails : ex, user : req.user, actionDetails :auditModuleMessage, reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      console.log(ex);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchTranslationHistory(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const {
        pageIndex = 0,
        pageSize = 50,
        sort = -1,
        cloned = false,
      }: IListAllMigrationsDto = req.query;

      const totalCount = await TransactionHistoryModel.countDocuments(
        {cloned}
      ).exec();
      const transactions: LeanDocument<ITranslationHistory>[] =
        await TransactionHistoryModel.find({cloned})
          .populate("stoppedBy", "firstName lastName _id")
          .sort({ _id: sort })
          .limit(Number(pageSize))
          .skip(Number(pageIndex) * Number(pageSize))
          .lean()
          .exec();
      return res.status(200).json({ data: transactions, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }
  
/**
 * Bulk Migration
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @return {Promise<Response>} Response
 */
async bulkMigration(req: Request, res: Response): Promise<Response> {
  try {
    const requestData: any = req;
    const { contentModels } = req.body;
    const content = requestData.files?.content?.[0];
    const media = requestData.files?.media?.[0];
    if (!content || !media) {
      return res.status(400).json({ error: "File names doesn't match with constraint" });
    }
    const formatedDate = await BulkMigration.formatDate(new Date());
    const contentFileName = content.originalname;
    
    const fileNameWithoutExtension = contentFileName.split(".").slice(0, -1).join(".");

    const campaignName = fileNameWithoutExtension.includes("_") 
      ? fileNameWithoutExtension.split("_")[0] 
      : null;

    const [modelsPart, localesPart] = fileNameWithoutExtension.split("_locale_");

    const modelsPattern = /_model_([^_]+(?:_[^_]+)*)/;
    const modelsMatch = modelsPart.match(modelsPattern);
    const models = modelsMatch ? modelsMatch[1].split("_") : [];

    const locales = localesPart ? localesPart.split("_") : [];

    let fileName;
    let zipFileName;

    if (!campaignName && models.length === 0 && locales.length === 0) {
      fileName = content.originalname;
      zipFileName = media.originalname;
    } else {
      const finalCampaignName = campaignName || "Campaign";
      const finalModels = models.length > 0 ? models.join("_") : "Model";
      const finalLocales = locales.length > 0 ? locales.join("_") : "Locale";

      fileName = `${finalCampaignName}_${finalModels}_${finalLocales}`.replace(/\s+/g, "");
      zipFileName = `${finalCampaignName}_${finalModels}_${finalLocales}_assets_${formatedDate}`.replace(/\s+/g, "");
    }

    const contentFileUrl = await BulkMigration.pushToBlob(fileName, content.buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const mediaFileUrl = await BulkMigration.pushToBlob(zipFileName, media.buffer, "application/zip");

    await CsvUploadHistoryModel.create({
      status: "Pending",
      contentModels: JSON.parse(contentModels.replace(/ /g, "_")),
      locale: locales,
      filename: fileName,
      csvPath: contentFileUrl,
      mediaPath: mediaFileUrl,
      createdBy: requestData.user.email,
    });

    const payload = { email: req.user.email,module: "Bulk Migration",action: "Create Bulk migration",data: fileName,submodule : "Bulk Migration",status : "Success",user : req.user, actionDetails : "Uploaded the files for Bulk migration" , reqPayload : req.body};

    await AdminPanelHelper.createAuditTrail(payload);

    return res.status(200).json({ message: "Uploaded successfully", result: "success" });
  } catch (ex: any) {
    const payload = {email: req.user.email,module: "Bulk Migration",action: "Create Bulk migration",data: ex,submodule : "Bulk Migration",status : "Error", errorDetails : ex,user : req.user, actionDetails : "Failed to upload the files for Bulk migration", reqPayload : req.body};
    await AdminPanelHelper.createAuditTrail(payload);
    return res.status(500).json({ error: ex.message });
  }
}
  /**
   * Get Bulk migration history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchBulkMigrationHistory(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const {
        page = 0,
        limit = 10,
        sort = -1,
        file,
      }: IListAllBulkMigrationsDto = req.query;
      const filter: any = {};

      let contentModel: any = req.query.contentModel;
      const locale: any = req.query.locale;

      if (locale) {
        filter.locale = { $in: locale };
      }

      if (contentModel) {
        contentModel = contentModel?.replace(/ /g, "_");
        filter.contentModels = { $in: contentModel };
      }

      if (file) {
        filter.filename = { $regex: file, $options: "i" };
      }

      const sortOrder = sort;

      const totalCount = await CsvUploadHistoryModel.countDocuments(
        filter
      ).exec();

      const migrationHistory: any = await CsvUploadHistoryModel.find(filter)
        .sort({ createdAt: sortOrder })
        .limit(Number(limit))
        .skip(Number(page) * Number(limit))
        .lean()
        .exec();


      const formattedData = ContentfulHelper.formatHistoryTableData(migrationHistory);

      
      return res.status(200).json({ data: formattedData, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Download the zip file and csv file
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async downloadFile(req, res){
    try {
      if(req.query.type === "csv"){
        return BulkMigration.processExcelFile(req.query.file, res);
      }
      else{
        const files: any = await BulkMigration.processZipMediaFile(req.query.file);
        // Create a zip archive
        const archive = archiver("zip", { zlib: { level: 9 } });
        res.status(200)
          .header("Content-Type", "application/zip")
          .header("Content-Disposition", `attachment; filename=files.zip`);
  
        archive.on("error", (err) => {
          throw err;
        });
  
        archive.pipe(res);

        files.forEach((file: any) => {
          archive.append(Buffer.from(file.content, "base64"), { name: file.fileName });
        });
  
        await archive.finalize();
        const payload = {email: req.user.email, module: "Bulk Migration",action: "Download File",data: req.query.file,submodule : "Bulk Migration", status : "Success",user : req.user, actionDetails : "Successfully downloaded the file ", reqPayload : req.body };
        await AdminPanelHelper.createAuditTrail(payload);
      }
    } catch (error) {
      const payload = {email: req.user.email,module: "Bulk Migration",action: "Download File",data: req.query.file,submodule : "Bulk Migration",status : "Error", errorDetails : error,user : req.user, actionDetails : "Failed to  download the file ", reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payload);
      console.error("Error downloading file:", error);
      res.status(500).send("Error downloading file");
    }
  }

  /**
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async fetchContentTranslationAllHistory(
      req: Request,
      res: Response
    ): Promise<Response> {
      try {
        const {
          pageIndex = 0,
          pageSize = 50,
          sort = -1,
        }: IListAllMigrationsDto = req.query;
  
        const totalCount = await TransactionHistoryModel.countDocuments(
          {}
        ).exec();
        const transactions: LeanDocument<ITranslationHistory>[] =
          await TransactionHistoryModel.find()
            .populate("stoppedBy", "firstName lastName _id")
            .sort({ _id: sort })
            .limit(Number(pageSize))
            .skip(Number(pageIndex) * Number(pageSize))
            .lean()
            .exec();
        return res.status(200).json({ data: transactions, totalCount });
      } catch (ex: any) {
        return res.status(500).json({ error: ex.message });
      }
    }

  /**
   * GEt token
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getGenAiToken(req, res){
    try {
      const token = await ContentfulHelper.getGenAIToken();
      return res.status(200).json({ data: token});
      
    } catch (error) {
    
      res.status(500).send("Error ");
    }
  }

  /**
   * remove translated DAta
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async removeTranslatedData(req, res){
      try {
        const data = await ContentfulHelper.removeContentfulTranslatedData(req.query.contentModel);
        return res.status(200).json({ data});
        
      } catch (er) {      
        res.status(500).send("Error");
    }
  }
}
export default new ContentfulController();
