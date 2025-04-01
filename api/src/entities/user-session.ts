import { Schema, Types } from "mongoose";

import { Database } from "../lib";
import { IUserSession } from "./interfaces/iUserSession";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema<IUserSession>(
    {
        userId: {
            type: Types.ObjectId,
            required: true
        },
        isLoggedIn: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    {
        collection: "user-sessions",
        timestamps: true
    }
);

export default Database.connection.useDb(PORTAL_DB).model<IUserSession>("UserSession", schema);
