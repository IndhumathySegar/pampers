import type { ObjectId, Document } from "mongoose";

export interface IUserSession extends Document {
    _id: ObjectId;
    userId: ObjectId;
    isLoggedIn: boolean;
}
