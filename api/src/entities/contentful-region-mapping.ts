import { Schema } from "mongoose";

import { Database } from "../lib";
import { IContentfulRegionMapping } from "./interfaces/iContentfulRegionMapping";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema(
  {

    email: String,
    regions:[],
    contentModels: [],
    tags: [],
    createdBy: String,    
    project: String,
    spaceId : String,
    totalRecords: Number,
    processedRecords: Number,
    status: {
      default: "pending",
      type: String,
      enum: [
        "pending",
        "failed",
        "started",
        "success",
        "region updating",
      ],
    },
    isCountry: {
      type: String,
      default: "FALSE",
    },  
    error: String,
    errorDetails: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
    shardKey: {
      createdBy: 1,
    },
  }
);

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IContentfulRegionMapping>("ContentfulRegionMapping", schema);
