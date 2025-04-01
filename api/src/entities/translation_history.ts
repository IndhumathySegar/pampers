import { Schema, Types } from "mongoose";

import { Database } from "../lib";

import { ITranslationHistory } from "./interfaces/iTranslationHistory";

const PORTAL_DB = process.env.PORTAL_DB!;

const schema = new Schema(
  {
    initiatedBy: {
      type: String,
      required: true,
    },
    spaceId: {
      type: String,
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    cloned: {
      type: Boolean,
      required: true,
    },
    includedTags: {
      type: Array,
      required: false,
    },
    excludedTags: {
      type: Array,
      required: false,
    },
    byTags: {
      type: Boolean,
      default: false,
    },
    content_type: {
      type: String,
      required: true,
    },
    entries: {
      type: Array,
      required: false,
    },
    sourceLocale: {
      type: Object,
      required: true,
    },
    targetLocale: {
      type: Object,
      required: true,
    },
    status: {
      type: String,
      enum: ["started", "enqueued", "stopped", "completed", "error"], // You can adjust this based on your specific statuses
      required: true,
    },
    error: {
      type: Schema.Types.Mixed, // To allow any kind of data
      default: null,
    },
    total_entries: {
      type: Number,
      required: false,
    },
    remaining_entries: {
      type: Number,
      required: false,
    },
    eta: {
      type: Number,
      required: false,
    },
    total_time_taken: {
      type: Number,
      required: false,
    },
    stoppedBy: {
      type: Types.ObjectId,
      ref: "User", // Reference to the User model
    },
    jobStartDate: {
      type: Date,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

export default Database.connection
  .useDb(PORTAL_DB)
  .model<ITranslationHistory>("transaction_history", schema);
