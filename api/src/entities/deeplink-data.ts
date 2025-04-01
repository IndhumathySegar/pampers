import { Schema } from "mongoose";
import { get } from "lodash";

import { Database } from "../lib";

import {IDeeplinkConfig} from "./interfaces/iDeeplinkConfig";

const DEEPLINK_DB = get(process.env, "DEEPLINK_DB", "portal-uat");

const schema = new Schema<IDeeplinkConfig>(
  {
    type: {
      type: String,
      required: true,
    },
    deeplinks: {
      type: Object,
      required: true,
    }
  },
  {
    collection: "configs",
    timestamps: true
  }
);

export default Database.connection.useDb(DEEPLINK_DB).model<IDeeplinkConfig>("Deeplink", schema);
