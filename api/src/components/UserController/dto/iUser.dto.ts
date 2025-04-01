export interface IUsersPaginationDto {
  page?: number;
  pageSize?: number;
  sort?: number;
  filter?: string;
}

export interface IUsersByIdDto {
  id?: string;
}

export interface IUsersExportDto {
  sort: number;
}

export interface IUserDependentInfoDto {
  userId?: string;
  dependentId?: string;
}

export interface IUsersListDto {
  page?: number;
  pageSize?: number;
  sort?: number;
  filter?: any;
}
