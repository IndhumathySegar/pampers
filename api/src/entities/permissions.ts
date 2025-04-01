import { Schema } from "mongoose";

import { Database } from "../lib";

import { IPermission } from "./interfaces/iPermissions";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema<IPermission>(
  {
    displayResourceName: {
      type: String,
      required: true,
    },
    uniqueResourceName: {
      type: String,
      required: true,
    },
    subResources: [
      {
        displaySubResourceName: {
          type: String,
          required: true,
        },
        uniqueSubResourceName: {
          type: String,
          required: true,
        },
        redirectURI: { type: String },
        services: [
          {
            displayServiceName: {
              type: String,
              required: true,
            },
            uniqueServiceName: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
  },
  {
    collection: "permissions",
    timestamps: true,
  }
);

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IPermission>("Permission", schema);
