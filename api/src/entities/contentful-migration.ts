import { Schema } from "mongoose";

import { Database } from "../lib";

import { IContentfulMigration } from "./interfaces/iContentfulMigration";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema(
  {
    from: String,
    to: String,
    spaceId: String,
    managementToken: String,
    region: String,
    market: String,
    localesToMigrate:[],
    contentModels: [],

    createdBy: String,
    query: {},
    /** New fields start */
    analysisResult: {
      type: Schema.Types.Mixed,
      default: null,
    },
    /** New fields end */

    migrationId: String,
    project: {
      type: String,
      required: true,
    },
    isCatalogue: Boolean,
    status: {
      default: "pending",
      type: String,
      enum: [
        "pending",
        "failed",
        "success",
        "content type syncing",
        "content exporting",
        "content importing",
        "rollback",
        "content backup",
        "content fetching"
      ],
    },
    contentfulExports: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    contentfulErrorLogs: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    sourceExport: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    destExport: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    error: String,
    backupFilePath: String,
    isRollBack: Boolean,
    rollBackStatus: String,
    rollBackError: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    rollBackDate : Date,
    reasonForRollBack : String,
    rollBackInitiatedBy : String,
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
  .model<IContentfulMigration>("ContentfulMigration", schema);
