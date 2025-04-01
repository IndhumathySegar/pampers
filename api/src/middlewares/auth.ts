import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { sign, Algorithm } from "jsonwebtoken";
import PassportJwt from "passport-jwt";
import jwtDecode from "jwt-decode";
import { PassportLocalModel, LeanDocument } from "mongoose";
import { get } from "lodash";
import AdminPanelHelper from "../components/AdminPanelController/admin-panel.helper";

import {
  TokenModel,
  UserModel,
  UserSessionModel,
  UserRoleModel,
} from "../entities";
import { IUser } from "../entities/interfaces/iUser";
import { IToken } from "../entities/interfaces/iToken";
import { IUserSession } from "../entities/interfaces/iUserSession";
import { IUserRole } from "../entities/interfaces/iUserRole";
import moment from "moment";

const TCDate:any = get(process.env, "TC_DATE");

const jwtSecret: string = get(process.env, "JWT_SECRET", "");
const jwtAlgorithm = get(process.env, "JWT_ALGORITHM", "") as Algorithm; // nosonar
const jwtExpiresIn: string = get(process.env, "JWT_EXPIRES_IN", "");

passport.use((UserModel as PassportLocalModel<IUser>).createStrategy()); // nosonar

passport.use(
  new PassportJwt.Strategy(
    {
      jwtFromRequest: PassportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      algorithms: [jwtAlgorithm],
    },
    async (payload: any, done: any) => {
      // Find the real user from our database using the `id` in the JWT
      try {
        const userDoc: LeanDocument<IUser> | null = await UserModel.findById(
          payload.sub
        )
          .lean()
          .exec();

        if (!userDoc || !payload.sessionId) {
          return done(null, false);
        }

        userDoc.sessionId = payload.sessionId;

        done(null, userDoc);
      } catch (ex) {
        done(ex, false);
      }
    }
  )
);

type RegistrationDto = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  defaultPage: string;
  organization?: string;
  permissions: string[];
  canDelete: boolean;
};

type verifyOtpDto = {
  email: string;
  otp: string;
};

type validateSSODto = {
  ssoToken: string;
};

class AuthMiddleWare {
  public initialize;
  public signIn;

  constructor() {
    this.initialize = passport.initialize();
    this.signIn = passport.authenticate("local", { session: false });
  }

  /**
   * Register User
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @param {NextFunction} next Next Function
   * @return {Promise<void>} Response
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const {
      email,
      firstName,
      lastName,
      password,
      role = "user",
      defaultPage,
      organization,
      permissions = [],
      canDelete,
    }: RegistrationDto = req.body;

    const user: IUser = new UserModel({
      email,
      firstName,
      lastName,
      role,
      defaultPage,
      permissions,
      organization,
      canDelete,
    });

    // Create the user with the specified password
    (UserModel as PassportLocalModel<IUser>).register( // nosonar
      user,
      password,
      (error: any, userDoc: IUser) => {
        if (error) {
          res.status(400).json({ message: error.message });

          // Our register middleware failed
          return next(error);
        }

        // Store user so we can access it in our handler
        req.user = userDoc;
        return next();
      }
    );
  }

  /**
   * Signed JWT for user
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async signJWTForUser(req: Request, res: Response): Promise<Response> {
    // Get the user (either just signed in or signed up)
    try {
      const userDetail: IUser | null = await UserModel.findOne({
        email: req.body.email,
        // deleted: false,
      }).exec();

      if (!userDetail) {
        const payload = { email : req.body.email, module: "Login", action: "Login", data: req.body,submodule : "Login", user: req.body, status : "Error", actionDetails : `Tried to login using un-authorized account ${req.body.email}`, errorDetails : `Tried to login using un-authorized account ${req.body.email}`, reqPayload : req.body };
        await AdminPanelHelper.createAuditTrail(payload);

        return res.status(401).json({ message: "Un Authorized" });
      }

      req.user = userDetail as unknown as IUser;
      const {
        user: {
          _id,
          defaultPage,
          email,
          firstName,
          lastName,
          role,
          landingPage,
          organization,
          translationRole,
          market,
          locales,
          markets,
          region,
          TCConsent,
          TCConsentDate
        },
      } = req;

      const rolePermissions: LeanDocument<IUserRole> | null =
        await UserRoleModel.findOne({ name: role }, { permissions: 1 })
          .lean()
          .exec();

      if (!rolePermissions) {
        const payloadRole = { email : req.body.email, module: "Login", action: "Login", data: req.body ,submodule : "Login", user: req.body, status : "Error", actionDetails : `Account ${req.body.email} does not have permission to login`, errorDetails : `Account ${req.body.email} does not have permission to login`,reqPayload : req.body };
        await AdminPanelHelper.createAuditTrail(payloadRole);

        return res.status(401).json({ message: "Role not found" });
      }

      const currDate = moment().toDate();
      await UserModel.findByIdAndUpdate(_id, {lastLoginDate: currDate}, {
        new: true,
        runValidators: true,
      }).exec();


      const session: IUserSession = await UserSessionModel.create({
        userId: _id,
      });

      if (!session) {
        return res.status(401).json({ message: "Un Authorized" });
      }

      // Create a signed token
      const token = sign(
        {
          sessionId: session._id,
          email,
        },
        jwtSecret,
        {
          algorithm: jwtAlgorithm,
          expiresIn: jwtExpiresIn,
          subject: _id.toString(),
        }
      );
      const payloadUser = { email : req.body.email, module: "Login", action: "Login", data: req.user, submodule : "Login", user: req.user, status : "Success", actionDetails : `Account ${req.body.email} logged in successfully`, reqPayload : req.body};
      await AdminPanelHelper.createAuditTrail(payloadUser);
      // Send the token
      return res.json({
        _id,
        defaultPage,
        email,
        market,
        firstName,
        lastName,
        role,
        accessToken: token,
        landingPage,
        organization,
        translationRole,
        lastLoginDate : currDate,
        TCDate : process.env.TC_DATE,
        TCConsentDate,
        TCConsent ,
        rolePermissions: rolePermissions.permissions,
        locales,
        markets,
        region,
      });
    } catch (ex: any) {
      const payload = { email : req.body.email, module: "Login", action: "Login", data: req.body,submodule : "Login", user: req.body, status : "Error", actionDetails : `Failed to login with account ${req.body.email}`, errorDetails : ex, reqPayload : req.body };
      await AdminPanelHelper.createAuditTrail(payload);
      console.log(ex);
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Change password for user
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<void>} Response
   */
  changePassword(req: Request, res: Response): void {
    const { email, newPassword: password } = req.body;

    (UserModel as PassportLocalModel<IUser>).findByUsername(email, false).then( // nosonar
      (userDoc) => {
        if (userDoc) {
          userDoc.setPassword(password, () => {
            userDoc.save();

            res.status(200).json({ message: "password reset successfully" });
          });
        } else {
          res.status(500).json({ message: `The user ${email} does not exist` });
        }
      },
      (err) => {
        res.status(500).json({
          message: `The user ${email} does not exist`,
          error: err.message,
        });
      }
    );
  }

  /**
   * Verify OTP
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @param {NextFunction} next Next Function
   * @return {Promise<Response | void>} Response
   */
  async verifyOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const { email, otp }: verifyOtpDto = req.body;

    const token: IToken | null = await TokenModel.findOne({
      email,
      otp,
      used: { $exists: false },
    }).exec();

    if (!token) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // expire token
    token.used = true;

    // update token
    token.save();

    next();
  }

  /**
   * Validate SSO
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @param {NextFunction} next Next Function
   * @return {Promise<Response | void>} Response
   */
  async validateSSO(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const payload: validateSSODto = req.body;

      const decodeData = jwtDecode(payload.ssoToken);

      if (!decodeData) {
        return res.status(401).json({ message: "Access Forbidden" });
      }

      req.body.email = get(decodeData, "unique_name") || get(decodeData, "upn");

      if (!req.body.email) {
        return res.status(401).json({ message: "Access Forbidden" });
      }

      req.body.loginToken = decodeData;

      const firstName = get(decodeData, "given_name");
      const lastName = get(decodeData, "family_name");

      await UserModel.updateOne(
        { email: req.body.email },
        { $set: { firstName, lastName } }
      ).exec();

      next();
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  /**
   * Validate JWT
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @param {NextFunction} next Next Function
   * @return {Promise<void>} Response
   */
  async requireJWT(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    passport.authenticate(
      "jwt",
      { session: false },
      async (err: any, user: any): Promise<Response | void> => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res
            .status(401)
            .json({ message: "Unauthorized", errors: ["Unknown User"] });
        }

        const session = await UserSessionModel.findById(user.sessionId).exec();

        if (!session || !session.isLoggedIn) {
          return res.status(401).json({
            message: "Unauthorized",
            errors: [!session ? "Unknown Session" : "Session Expired"],
          });
        }
        if ( (!req.path.includes("logout") && !req.path.includes("updateTC") ) && moment(user.TCConsentDate).format("YYYY-MM-DD") < moment(TCDate).format("YYYY-MM-DD")) {
          return res.status(403).json({
            message: "Please accept the terms and condition",
            errors: ["Approve Terms & Conditions"],
          });
        }
        req.user = user;

        next();
      }
    )(req, res, next);
  }
}

export default new AuthMiddleWare();
