import { Schema } from "mongoose";

import { Database } from "../lib";

import { IModule } from "./interfaces/iModule";

const PORTAL_DB = process.env.PORTAL_DB!;


const schema = new Schema(
  {
    name: String,
    uniqueResourceName: String,
    default_landing_page: String,
   
  },
  {
    timestamps: true,
  }
);



schema.index({ updatedAt: -1, createdAt: -1 });

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IModule>("Module", schema);
