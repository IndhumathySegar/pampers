import { Parser } from "json2csv";
import JSON2CSVParser from "json2csv/JSON2CSVParser";
import archiver from "archiver";
// types
import type { Request, Response } from "express";
import { LeanDocument } from "mongoose";
// entities
import { AuditModel, PermissionModel, UserModel, UserRoleModel } from "../../entities";

// dto
import {  IListAllAuditTrailDto } from "./dto/iAdminPanel.dto";

import { IAudit } from "../../entities/interfaces/iAudit";
import { IUser } from "../../entities/interfaces/iUser";
import { IUserRole } from "../../entities/interfaces/iUserRole";
import { IPermission } from "../../entities/interfaces/iPermissions";
import AdminPanelHelper from "./admin-panel.helper";
import moment from "moment-timezone";

class AdminPanelController {
  /**
   * Get audit trail history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchAuditTrailHistory(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const {
        page = 0,
        limit = 10       
      }: IListAllAuditTrailDto = req.query;

      const filter = await AdminPanelHelper.getAdminFilter(req.query);        
      const totalCount = await AuditModel.countDocuments(filter).exec();

      const auditData: LeanDocument<IAudit>[] = await AuditModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(page) * Number(limit))
        .lean()
        .exec();

        const moduleMappings = await AdminPanelHelper.getSubModuleList();        
        const data = auditData.map(x => {
          if (moduleMappings[x.module]) {
            x.submodule = moduleMappings[x.module]?.submodule;
            x.module = moduleMappings[x.module].module;            
          }
          return x;
        });
      return res.status(200).json({ data, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get data for filter dropdowns from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchAuditFilterDropdownData(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {      
      const users: LeanDocument<IUser>[] = await UserModel.find()
        .sort({ _id: -1 }) 
        .select("email organization")     
        .lean()
        .exec();

      const roles: LeanDocument<IUserRole>[] = await UserRoleModel.find()
      .sort({ _id: -1 }) 
      .select("name")     
      .lean()
      .exec();

      const modules: LeanDocument<IPermission>[] = await PermissionModel.find()
      .sort({ _id: -1 }) 
      .lean()
      .exec();

      const dropdownData = Object.assign({
          users,
          roles,
          modules
      });
      return res.status(200).json({ dropdownData });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }


  /**
   * Export user data
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async getExportData(req: Request, res: Response): Promise<Response | void> {  
      try {
        const {
          page = 0,
          limit = 10
        }: IListAllAuditTrailDto = req.query;
  
        const filter = await AdminPanelHelper.getAdminFilter(req.query);        
        const auditFields = [
          { label: "User Id", value: "email" },
          { label: "Organization", value: "user.organization" },
          // { label: "User Status", value: "user.enabled" },
          // { label: "Email", value: "user.email" },
          { label: "Role", value: "user.role" },
          { label: "Module", value: "module" },
          { label: "Sub Module", value: "submodule" },
          { label: "Action", value: "action" },
          { label: "Action Detail", value: "actionDetails" },
          { label: "Log Date Time", value: "updatedAt" }
        ];
  
        const auditDetails: IAudit[] = await AuditModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(page) * Number(limit))
        .lean()
        .exec();

        const moduleMappings = await AdminPanelHelper.getSubModuleList();
        
        const auditData = auditDetails.map(x => {
          if (moduleMappings[x.module]) {
            x.submodule = moduleMappings[x.module]?.submodule;
            x.module = moduleMappings[x.module].module;
          }
          return x;
        });
        const data: IAudit[] = auditData.map((auditDetail) => {  
          return auditDetail;
        });
  
        const json2csvParser: JSON2CSVParser<unknown> = new Parser({
          fields: auditFields,
        });

        const csv: string = json2csvParser.parse(data);
        const fileName: string = `audit-trail.csv`;
        const zipFileName: string = `audit-trail.csv`;

        const archive = archiver.create("zip-encrypted", {zlib: {level: 8}, encryptionMethod: "aes256", password: `${req.user.email}-${moment().format("MM-YY")}`});
        archive.append(csv, { name: fileName });
        await archive.finalize();

        res.setHeader("Content-disposition", `attachment; filename=${zipFileName}`);
        res.setHeader("Content-type", "application/zip");

        archive.pipe(res);

        const payload = {
          email : req.user.email,
          module: "Admin Panel Audit",
          action: "Export Audit history",
          data: fileName,
          submodule : "Admin Panel Audit",
          user : req.user,
          status : "Success",
          actionDetails : "Exported audit trail data", 
          reqPayload : req.body
     };
     await AdminPanelHelper.createAuditTrail(payload);


      } catch (ex) {
        const payload = {
          email : req.user.email,
          module: "Admin Panel Audit",
          action: "Export Audit history",
          data: ex,
          submodule : "Admin Panel Audit",
          user : req.user,
          status : "Error",
          errorDetails : ex,
          actionDetails : "Failed to export audit trail data",
          reqPayload : req.body
     };
     await AdminPanelHelper.createAuditTrail(payload);
        return res.status(500).send({ data: ex.message });
      }
    }
}

export default new AdminPanelController();
