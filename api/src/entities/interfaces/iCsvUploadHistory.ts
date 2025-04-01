import {Schema} from "mongoose";
 
export interface ICsvUploadHistory {
    filename : string;
    csvPath: string;
    mediaPath: string;
    locale : string;
    contentModels : string[];
    lastProcessed : number;
    UploadCount: UploadCount;
    status: string;
    comments :string;
    createdBy : string;
    totalEntryinCsv : number;
    errorLog : any;
    skippedFields: string[];
    isLocked: boolean;
}
 
interface IsLocked {type: Schema.Types.Boolean; default: boolean;}
 
interface UploadCount {type: Schema.Types.Number; default: number;}
