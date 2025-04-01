import type { Request, Response } from "express";
import { LeanDocument, UpdateWriteOpResult, Types } from "mongoose";

// entites
import { UserRoleModel, PermissionModel } from "../../entities";

// interfaces
import { IPermission } from "../../entities/interfaces/iPermissions";
import { IUserRole } from "../../entities/interfaces/iUserRole";

// dto
import { Pagination } from "./dto/iRole.dto";

// utils
import CommonUtils from "../../utils/common";

import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";
import RoleHelper from "../RoleController/role.helper";

class RoleController {
  constructor() {
    this.getAllRoles = this.getAllRoles.bind(this);
  }

  /**
   * Get all roles
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getAllRoles(req: Request, res: Response): Promise<Response> {
    try {
      const {
        page = 0,
        pageSize,

        role = "",
      }: Pagination = req.query;
      let condition = {};


      if (role) {
        condition = {
          name: { $regex: new RegExp(role, "i") },
         };
      }

      const allPermissions: LeanDocument<IPermission[]> =
        await PermissionModel.find().lean().exec();

      let userRoles: LeanDocument<IUserRole[]>;

      if (pageSize && pageSize !== 0) {
        userRoles = await UserRoleModel.find()
          .where(condition)
          .limit(Number(pageSize))
          .skip(Number(page * pageSize))
          .collation({ locale: "en", strength: 4 })
          .sort({ name: 1 })
          .lean()
          .exec();
      } else {
        userRoles = await UserRoleModel.find()
          .where(condition)

          .sort({ name: 1 })
          .lean()
          .exec();
      }

      userRoles.map(this.mapUserRoles);

      const totalCount: number = await UserRoleModel.count(condition).exec();

      return res.status(200).json({
        allPermissions,
        items: userRoles.map(this.mapUserRoles),
        totalCount,
      });
    } catch (ex: any) {
      return res
        .status(500)
        .json({ message: "Something went wrong!", error: ex.message });
    }
  }

  /**
   * Map user roles
   * @param userRole User role
   * @returns User role with permission
   */
  mapUserRoles(userRole: LeanDocument<IUserRole>): LeanDocument<IUserRole> {
    return {
      ...userRole,
      permissions: CommonUtils.sanitizeUserRole(userRole.permissions),
    };
  }

  /**
   * Create a Role
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async createOrEditRole(req: Request, res: Response): Promise<Response> {
    let originalRole: any;
    try {
      const role: any = req.body;
       // Fetch the original user data
       originalRole = await UserRoleModel.findById(role._id).exec();
      const roles: UpdateWriteOpResult = await UserRoleModel.updateOne(
        { _id: Types.ObjectId(role._id) },
        role,
        { upsert: true }
      ).exec();
      
      const structuredPermissions = roles.upserted && roles.upserted.length > 0 ? {} : await RoleHelper.generateStructure(originalRole);
      const structuredUpdatedPermissions = roles.upserted && roles.upserted.length > 0 ? {} : await RoleHelper.generateStructure(req.body);
      const action = roles.upserted && roles.upserted.length > 0 ? "Add New Role" : "Update Role";
      const actionDetails = roles.upserted && roles.upserted.length > 0 ? `Added the new role - ${req.body.name}` : `{"message" : "Updated ${req.body.name} role",  "existing" : ${JSON.stringify(structuredPermissions, null, 2)}, "Updated" : ${JSON.stringify(structuredUpdatedPermissions, null, 2)}}`;

      delete req.body.$setOnInsert;
      const payload = {
        email: req.user.email,
        module: "Role",
        action,
        data: roles,
        submodule : "Role",
        user : req.user,
        status : "Success",
        actionDetails, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json({ roles });
    } catch (ex: any) {
      delete req.body.$setOnInsert;
      const payload = {
        email: req.user.email,
        module: "Role",
        action : "Update Role",
        data: ex,
        submodule : "Role",
        user : req.user,
        status : "Error",
        errorDetails : ex,
        actionDetails : `Failed to update the ${req.body.name} role`, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Delete a role by its name
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async deleteRole(req: Request, res: Response): Promise<Response> {
    try {
      const roleName: string = req.body.roleName;

      const role = await UserRoleModel.deleteOne({ name: roleName }).exec();

      if (!role.deletedCount) {
        return res
          .status(404)
          .json({ error: `Document not found with role: ${roleName}` });
      }

      const payload = {
        email: req.user.email,
        module: "Role",
        action: "Delete Role",
        data: {
          name: roleName,
          role,
        },
        submodule : "Role",
        user : req.user,
        status : "Success",
        actionDetails : `Deleted the role ${req.body.roleName}`,
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json(role);
    } catch (ex: any) {
      const payload = {
        email: req.user.email,
        module: "Role",
        action: "Delete Role",
        data: ex,
        submodule : "Role",
        user : req.user,
        status : "Error",
        errorDetails : ex,
        actionDetails : `Failed to delete ${req.body.roleName} role`, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Check role exists
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async checkRoleExist(req: Request, res: Response): Promise<Response | void> {
      try {
        const {
          role          
        } = req.body;
        const userData = await UserRoleModel.find({name: { $regex: new RegExp(`^${role}$`, "i") }}).exec(); // NOSONAR
        if(userData.length){
          return res.status(200).json({ status: "Role already exists" });
        }else{
          return res.status(200).json({ status: "Role doesn't exists" });
        }
        
      } catch (ex) {
       
        return res.status(500).json({ error: ex.message });
      }
    }
}

export default new RoleController();
