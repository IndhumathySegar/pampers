// types
import type { Request, Response, NextFunction } from "express";

// entities
import { UserModel, UserSessionModel } from "../../entities";

// interfaces
import { IUser } from "../../entities/interfaces/iUser";

// dto
import { IUserActiveDto } from "./dto/auth.dto";

import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";

class AuthController {
    /**
     * Check whether the user is active or not
     * @param {Request} req Request Object
     * @param {Response} res Response Object
     * @return {Promise<Response | void>} Response
     */
    async isUserActive(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { email }: IUserActiveDto = req.body;

            const user: IUser[] = await UserModel.find({ enabled: true, email }).exec();

            if (user.length === 0) {
                const payload = { email : req.body.email, module: "Login", action: "Login", data: req.body, submodule : "Login", user: req.body, status : "Error", actionDetails : `Tried to login and it seems account ${email} is not active`, errorDetails : `Tried to login and it seems account ${email} is not active`, reqPayload : req.body };
                await AdminPanelHelper.createAuditTrail(payload);

                return res
                    .status(403)
                    .json({
                        message: `Seems your account ${email} is not active. Please check with Administrator.`
                    });
            }

            return next();
        } catch (ex: any) {
            const payload = { email : req.body.email, module: "Login", action: "Login", data: req.body,submodule : "Login", user: req.body, status : "Error", actionDetails : `Tried to login with the account ${req.body.email}`, errorDetails : ex, reqPayload : req.body };
            await AdminPanelHelper.createAuditTrail(payload);
            return res.status(500).json({ error: ex.message });
        }
    }

    /**
     * End User Session
     * @param {Request} req Request Object
     * @param {Response} res Response Object
     * @return {Promise<Response>} Response
     */
    async logOut(req: Request, res: Response): Promise<Response> {
        try {
            await UserSessionModel.updateOne({ _id: req.user.sessionId }, { $set: { isLoggedIn: false } }).exec();
            const payloadUser = { email : req.user.email, module: "Logout", action: req.query.type ? "TCAutoLogout" :  "Logout", data: req.user, submodule : "Logout", user: req.user, status : "Success", actionDetails : req.query.type ? `Auto Logout User ${req.user.email} for declined GenAi Terms and conditions`: `Account ${req.user.email} logged out successfully`};
            await AdminPanelHelper.createAuditTrail(payloadUser);
            req.logOut();

            return res.json({ message: "Signed out successfully!" });
        } catch (ex) {
            return res.status(500).json({ message: "Internal Server Error", errors: [ex.message || "Unknown Error"] });
        }
    }
}

export default new AuthController();
