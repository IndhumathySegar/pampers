export interface IExport {
  _id: number;
  spaceId: string;
  env: string;
  managementToken: string;
  query: any;
  currentTime: number;
  envType: string;
}

export interface IImport {
  _id: number;
  spaceId: string;
  source: string;
  env: string;
  environmentId?: string;
  managementToken: string;
  currentTime: number;
  localesToMigrate: [];
  contentModels?: [];
  contentIdsToMigrate?:[];
  contents: IContent[];
  isRollBack?: boolean;
  query?: any;
}

export interface IExportOpt {
  spaceId: string;
  managementToken: string;
  queryEntries: any;
  environmentId: string;
  saveFile: boolean;
  errorLogFile: string;
  skipContentModel: boolean;
  queryAssets: any;
  maxAllowedLimit?: number;
  includeDrafts: boolean;
  includeArchived: boolean;
}

export interface IImportOpt {
  spaceId: string;
  managementToken: string;
  skipContentModel: boolean;
  environmentId: string;
  errorLogFile: string;
  content: string;
  includeDrafts: boolean;
  includeArchived: boolean;
  env?: string;
}

export interface IContent {
  [prop: string]: string;
}
