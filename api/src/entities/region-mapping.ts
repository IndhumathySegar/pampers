import { Schema } from "mongoose";

import { Database } from "../lib";

import { IRegionMapping } from "./interfaces/iRegionMapping";

const PORTAL_DB = process.env.PORTAL_DB!;


const schema = new Schema(
  {
    region: String,
    markets: Schema.Types.Mixed,
   
  },
  {
    timestamps: true,
  }
);



schema.index({ updatedAt: -1, createdAt: -1 });

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IRegionMapping>("regionMapping", schema);
