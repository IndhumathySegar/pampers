import type { Document } from "mongoose";

export interface ContentfulMigration {
  from: string;
  to: string;
  spaceId: string;
  managementToken: string;
  createdBy: string;
  skipAssets: boolean;
  analysisResult?: any;
  query: any;
  region?: string;
  market?: string;
  isCatalogue?: boolean;
  localesToMigrate: any;
  contentModels: any;
  preAnalyzeContentTypes: string[];
  postAnalyzeContentTypes?: string[];
  preAnalyzeContentExports?: string[];
  postAnalyzeContentExports?: string[];
  migrationId: string;
  project: string;
  status?:
    | "pending"
    | "failed"
    | "success"
    | "content type syncing"
    | "content exporting"
    | "content importing"
    | "content fetching"
    | "rollback"
    | "content backup";
  backup?: any[];
  contentfulExports?: any[];
  contentfulErrorLogs?: any[];
  error?: string;
  errorDetails?: any[];
  sourceExport?: any[];
  destExport?: any[];
  env?: string;
  backupFilePath?: string;
  isRollBack: boolean;
  rollBackError?: any[];
  rollBackStatus?: string;
  rollBackDate? : Date;
  reasonForRollBack? : any;
  rollBackInitiatedBy? : string;
  environmentId?: string;
}

export interface IContentfulMigration extends ContentfulMigration, Document {}
