import { Schema } from "mongoose";
import { Database } from "../lib";

import { IAudit } from "./interfaces/iAudit";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema<IAudit>(
    {
        email: String,
        module: String,
        seen: Boolean,
        action: String,
        user : {
            default: {},
            type: Schema.Types.Mixed
        },
        type: String,
        submodule : String,
        status : String,
        errorDetails : String,
        actionDetails : String,
        reqPayload : {
            default: {},
            type: Schema.Types.Mixed
        },
        data: {
            default: {},
            type: Schema.Types.Mixed
        },
    },
    {
        collection: "audits",
        timestamps: true
    }
);
schema.index({ updatedAt: -1, createdAt: -1 });
export default Database.connection.useDb(PORTAL_DB).model<IAudit>("Audit", schema);
