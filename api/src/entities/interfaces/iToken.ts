import { Document } from "mongoose";

export interface IToken extends Document {
    type: string;
    adminAccessToken: string;
    adminRefreshToken: string;
    expiresOn: Date;
    used?: boolean;
}
