import { Parser } from "json2csv";
import archiver from "archiver";

// types
import { Request, Response } from "express";
import { LeanDocument, PassportLocalModel } from "mongoose";

// entities
import { UserModel, UserRoleModel } from "../../entities";

// interfaces
import { IUser, User } from "../../entities/interfaces/iUser";
import { IUserRole } from "../../entities/interfaces/iUserRole";

// dto
import { IUsersByIdDto, IUsersListDto } from "./dto/iUser.dto";

// utils
import CommonUtils from "../../utils/common";

import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";
import moment from "moment-timezone";
import archiverZipEncrypted from "archiver-zip-encrypted";

archiver.registerFormat("zip-encrypted", archiverZipEncrypted);

class UserController {
  /**
   * Get all users
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 0, pageSize = 1000, filter }: IUsersListDto = req.query;

      const condition = JSON.parse(filter);

      const filterList = await AdminPanelHelper.getUserFilter(condition);     

      const users: LeanDocument<IUser>[] = await UserModel.find(filterList)

        .limit(Number(pageSize))
        .skip(Number(page) * Number(pageSize))
        .sort({ [condition.sortBy]: condition.sortOrder })
        .lean()
        .exec();

      const totalCount = await UserModel.countDocuments(filterList).exec();

      // Send them back as the response
      return res.json({ items: users, totalCount });
    } catch (ex) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get escapeRegExp
   * @param {Request} data Request Object
   */
  escapeRegExp(data) {
    return data.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Get user by ID
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const { id }: IUsersByIdDto = req.params;

      const user: IUser | null = await UserModel.findById(id).exec();

      if (!user) {
        return res.status(404).json({ error: `User not found with id: ${id}` });
      }

      // get permissions
      const {
        _id,
        defaultPage,
        email,
        firstName,
        provider,
        lastName,
        role,
        organization,
        fulfilmentProvider,
      }: IUser = user;

      const userRoles: LeanDocument<IUserRole> | null =
        await UserRoleModel.findOne({ name: role }).lean().exec();

      const _user = {
        _id,
        defaultPage,
        email,
        firstName,
        lastName,
        role,
        provider,
        organization,
        fulfilmentProvider,
        rolePermissions: userRoles
          ? CommonUtils.sanitizeUserRole(userRoles.permissions)
          : [],
      };

      return res.json(_user);
    } catch (ex) {
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
    const filter: any = req.query.filter;
    try {
      const condition = JSON.parse(filter);
      const filterList = await AdminPanelHelper.getUserFilter(condition);   

      const userFields = [
        { label: "User Id", value: "email" },
        { label: "Role", value: "role" },
        { label: "Module", value: "modules" },
        { label: "Region", value: "region" },
        { label: "Market", value: "markets" },
        { label: "Locale", value: "locales" },
        { label: "Organization", value: "organization" },
        { label: "Status", value: "enabled" },
        { label: "Added On Date", value: "createdAt" },
        { label: "Last Login Date", value: "lastLoginDate" },
      ];

      const userDetails: IUser[] = await UserModel.find(filterList)
        .sort({ [condition.sortBy]: condition.sortOrder })
        .exec();

      const data: User[] = userDetails.map((userDetail) => {
        return userDetail;
      });

      const json2csvParser = new Parser({ fields: userFields });
      const csv = json2csvParser.parse(data);
      const fileName = `users.csv`;

      const archive = archiver.create("zip-encrypted", {
        zlib: { level: 8 },
        encryptionMethod: "aes256",
        password: `${req.user.email}-${moment().format("MM-YY")}`,
      });

      archive.append(csv, { name: fileName });
      res.setHeader("Content-disposition", `attachment; filename=users.zip`);
      res.setHeader("Content-type", "application/zip");

      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(res);
      await archive.finalize();

      const payload = {
        email: req.user.email,
        module: "User",
        action: "Export User",
        data: fileName,
        submodule: "User",
        user: req.user,
        status: "Success",
        actionDetails: "Exported user details",
        reqPayload: req.body,
      };
      await AdminPanelHelper.createAuditTrail(payload);
    } catch (ex) {
      const payload = {
        email: req.user.email,
        module: "User",
        action: "Export User",
        data: ex,
        submodule: "User",
        user: req.user,
        status: "Error",
        errorDetails: ex,
        actionDetails: "Failed to export user details",
        reqPayload: req.body,
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).send({ data: ex.message });
    }
  }

  /**
   * Create a User
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async createUser(req: Request, res: Response): Promise<Response | void> {
    try {
      const {
        email,
        provider,
        landingPage,
        role = "user",
        organization,
        fulfilmentProvider,
        market,
        translationRole,
        markets,
        region,
        locales,
        modules
      }: User = req.body;

      const defaultPage: string = "/contentful";

      const user: IUser = new UserModel({
        email,
        role,
        provider,
        landingPage,
        defaultPage,
        organization,
        fulfilmentProvider,
        market,
        translationRole,
        markets,
        region,
        locales,
        modules
      });

      const createdUser: User = await (
        UserModel as PassportLocalModel<IUser>
      ).register(user, "demo"); // nosonar

      const payload = {
        email: req.user.email,
        module: "User",
        action: "Add New User",
        data: createdUser,
        submodule: "User",
        user: req.user,
        success: "Success",
        actionDetails: `Added new user using email ${req.body.email}`,
        reqPayload: req.body,
      };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json(createdUser);
    } catch (ex) {
      const payload = {
        email: req.user.email,
        module: "User",
        action: "Add New User",
        data: ex,
        submodule: "User",
        user: req.user,
        success: "Error",
        errorDetails: ex,
        actionDetails: `Failed to add new user using email ${req.body.email}`,
        reqPayload: req.body,
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Check email exists
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async checkEmailExist(req: Request, res: Response): Promise<Response | void> {
      try {
        const {
          email          
        } = req.body;

        const userData = await UserModel.find({email}).exec();
        if(userData.length){
          return res.status(200).json({ status: "Email already exists" });
        }else{
          return res.status(200).json({ status: "Email doesn't exists" });
        }
        
      } catch (ex) {
       
        return res.status(500).json({ error: ex.message });
      }
    }

  /**
   * Update a User by ID
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async updateUser(req: Request, res: Response): Promise<Response> {
    let originalUser: any;
    const id = req.params.id!;
    const attributes: User = req.body;
    try {
      // Fetch the original user data
      originalUser = await UserModel.findById(id).exec();

      const user = await UserModel.findByIdAndUpdate(id, attributes, {
        new: true,
        runValidators: true,
      }).exec();

      if (!user || !originalUser) {
        return res.status(404).json({ error: `User not found with id: ${id}` });
      }

      const modifiedUser = {
        email: originalUser.email,
        landingPage: originalUser.landingPage,
        market: originalUser.market,
        organization: originalUser.organization,
        role: originalUser.role,
        translationRole: originalUser.translationRole,
        markets: originalUser.markets,
        locales: originalUser.locales,
        region: originalUser.region,
        modules: originalUser.modules,
      };
      const modifiedReq = { ...req.body };
      for (const key in attributes) {
        if (
          [
            "_id",
            "createdAt",
            "updatedAt",
            "canDelete",
            "defaultPage",
            "enabled",
            "__v",
            "lastLoginDate",
            "market",
            "translationRole",
            "landingPage",
            "fulfilmentProvider",
            "deleted"
          ].includes(key)
        ) {
          delete modifiedUser[key];
          delete modifiedReq[key];
        }
      }

      const actionDetails =  await AdminPanelHelper.getAuditUserDetails(req.body.email, modifiedUser, modifiedReq, originalUser, attributes);

      const payload = {
        email: req.user.email,
        module: "User",
        action: "Update User",
        data: user,
        submodule: "User",
        user: req.user,
        status: "Success",
        actionDetails,
        reqPayload: req.body,
      };

      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json(user);
    } catch (ex) {
     
      const actionDetails =  await AdminPanelHelper.getAuditUserErrorDetails(req.body.email, originalUser, attributes);

      const payload = {
        email: req.user.email,
        module: "User",
        action: "Update User",
        data: ex,
        submodule: "User",
        user: req.user,
        status: "Error",
        errorDetails: ex,
        actionDetails,
        reqPayload: req.body,
      };

      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Delete a User by ID
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async deleteUser(req: Request, res: Response): Promise<Response> {
    let userEmail: any;
    try {
      const _id = req.params.id! ? req.params.id : req.body.userId;

      const user = await UserModel.findByIdAndRemove({
        _id,
        canDelete: true,
      }).exec();

      if (!user) {
        return res
          .status(404)
          .json({ error: `User not found with id: ${_id}` });
      }

      userEmail = user.email;

      const payload: any = {
        email: userEmail,
        module: "User",
        action: "Delete User",
        data: user,
        submodule: "User",
        user: req.user,
        status: "Success",
        actionDetails: `Deleted ${user.email} user`,
        reqPayload: req.body,
      };

      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json(user);
    } catch (ex) {
      const payload = {
        email: req.user.email,
        module: "User",
        action: "Delete User",
        data: ex,
        submodule: "User",
        user: req.user,
        status: "Error",
        errorDetails: ex,
        actionDetails: `Failed to delete the ${userEmail} user`,
        reqPayload: req.body,
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get data for filter dropdowns from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchUserFilterDropdownData(
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

      const dropdownData = Object.assign({
        users,
        roles,
      });
      return res.status(200).json({ dropdownData });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * update User terms and condition
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async updateTermsAndCondition(req, res){
      try {
        await UserModel.updateOne(
          { email: req.user.email },
          {
            $set: {
              TCConsent: req.body.TCConsent,
              TCConsentDate: new Date(),
            },
          }
        ).exec();

        const payload = {
          email: req.user.email,
          module: "GenAi T&C",
          action: req.body.TCConsent ? "TCaccepted" : "TCdeclined",
          data: req.body,
          submodule: "GenAi T&C",
          user: req.user,
          status: "Success",
          actionDetails: req.body.TCConsent ? `${req.user.email} User accepted GenAi Terms and conditions` : `${req.user.email} User declined GenAi Terms and conditions`,
          reqPayload: req.body,
        };
        await AdminPanelHelper.createAuditTrail(payload);

        return res.status(200).json({ status: "Updated Successfully"});
        
      } catch (error) {      
        const payload = {
          email: req.user.email,
          module: "GenAi T&C",
          action: "TCaccepted",
          data: error,
          submodule: "GenAi T&C",
          user: req.user,
          status: "Error",
          errorDetails: error,
          actionDetails: `${req.user.email} Failed to accept/decline GenAi Terms and conditions`,
          reqPayload: req.body,
        };
        await AdminPanelHelper.createAuditTrail(payload);
        return res.status(500).json({ error: error.message });
      }
    }

  /**
   * get User terms and condition status
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
    async getTCStatus(req, res){
      try {
        const id = req.params.id;
        const userData = await UserModel.findById(id).exec();

        return res.status(200).json({ data: userData});
        
      } catch (error) {      
       
        return res.status(500).json({ error: error.message });
      }
    }
}

export default new UserController();
