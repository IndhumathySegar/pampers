export interface IGetContentfulDataDto {
    spaceId?: string;
    environmentId?: string;
}

export interface ICreateLocaleDto {
    spaceId?: string;
    environmentIds?: string[];
    code?: string;
    country?: string;
    language?: string;
    projectName?: string;
    region?: string;
    regionName?: string;
    markets?: string;
}

export interface IListAllMigrationsDto {
    pageSize?: number;
    pageIndex?: number;
    sort?: number;
    isCRM?: string;
    cloned?: boolean;
    isReviewPage?: boolean;
}

export interface IDEEPLINKSVerionsDto {
    market?: string;
}

export interface IDEEPLINKSDto {
    market?: string;
    version?: string;
}

export interface IDEEPLINKSDataDto {
    market?: string;
    version?: string;
    deeplinktUpdate?: object[];
}

export interface IListAllBulkMigrationsDto {
    page?: number;
    limit?: number;
    sort?: number;
    locale?: string;
    contentModel ?: string[];
    file?: string;
}
