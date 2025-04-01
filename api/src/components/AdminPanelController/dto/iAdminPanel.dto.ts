export interface IParams {
    pageIndex?: number;
    pageSize?: number;
    filter?: string;
    // Add other query parameters as needed
  }

export interface IListAllAuditTrailDto {
    page?: number;
    limit?: number;
    module?: string;
    subModule ?: string;
    fromDate?: string;
    toDate?: string;
    userId?: string;
    organization?: string;
    role?: string;
    timezone?: string;
}

export interface IAuditExportDto {
  sort: number;
}


