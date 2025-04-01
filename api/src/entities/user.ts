import { Schema } from "mongoose";
import passportLocalDocument from "passport-local-mongoose";

import { Database } from "../lib";

import { IUser } from "./interfaces/iUser";

const PORTAL_DB = process.env.PORTAL_DB!;

console.log("portal db", PORTAL_DB);

const schema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    role: String,
    market: Array,
    provider: String,
    region: Array,
    markets: Array,
    locales: Array,
    modules: Array,
    // deleted:{type:Boolean,default:false},
    enabled: { type: Boolean, default: true },
    defaultPage: { type: String, default: "/id-binding" },
    landingPage: { type: String, default: "/id-binding" },
    canDelete: { type: Boolean, default: true },
    organization: { type: String, default: "" },
    translationRole: { type: String, default: null },
    TCConsent : Boolean,
    TCConsentDate : Date,
    lastLoginDate: Date
  },
  {
    timestamps: true,
  }
);

// Add passport middleware to User Schema
schema.plugin(passportLocalDocument, {
  usernameField: "email", // Use email, not the default 'username'
  usernameLowerCase: true, // Ensure that all emails are lowercase
  session: false, // Disable sessions as we'll use JWTs
});

schema.index({ updatedAt: -1, createdAt: -1 });

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IUser>("User", schema);
