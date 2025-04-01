import { Schema } from "mongoose";
import { Database } from "../lib";
 
import { ICsvUploadHistory } from "./interfaces/iCsvUploadHistory";
 
const PORTAL_DB = process.env.PORTAL_DB!;
 
const schema = new Schema<ICsvUploadHistory>(
    {
        filename : String,
        csvPath: String,
        mediaPath: String, 
        locale : [{
            default: [],
            type: Schema.Types.String
        }],
        status: String,
        comments : String,
        createdBy : String,
        contentModels : [{
            default: [],
            type: Schema.Types.String
        }],
        errorLog: {
            type: Map,
            of: Schema.Types.Mixed,
            default: {}
          },          
        uploadCount: {
            type: Object,
            default: {},
        },
        lastProcessed : {
            type: Map,
            of: Number,
            default: {}
        },
        totalEntryinCsv: {
            type: Object,
            default: {},
          },
        skippedFields: {
            type: Map,
            of: [String],
            default: {}
        },        
        isLocked: {type:Boolean, default: false}
    },
    {
        collection: "csvUploadHistory",
        timestamps: true
    }
);
 
// Compound Index: { "filename": 1, "locale": 1 }
schema.index({ filename: 1, locale: 1 });
 
// Separate Index: { "contentModel": 1 }
schema.index({ contentModel: 1 });
 
// Separate Index: { "status": 1 }
schema.index({ status: 1 });
 
// Multi-Field Index: { "updatedAt": -1, "createdAt": -1 }
schema.index({ updatedAt: -1, createdAt: -1 });
 
 
export default Database.connection.useDb(PORTAL_DB).model<ICsvUploadHistory>("CsvUploadHistory", schema);
