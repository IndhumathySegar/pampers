import { Schema } from "mongoose";

import { Database } from "../lib";

import { IToken } from "./interfaces/iToken";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema<IToken>(
    {
        type: { default: "mf_admin_token", type: String },
        adminAccessToken: String,
        adminRefreshToken: String,
        expiresOn: Date // curr date + 10
    },
    {
        timestamps: true
    }
); // always have 1 document

export default Database.connection.useDb(PORTAL_DB).model<IToken>("Token", schema);
