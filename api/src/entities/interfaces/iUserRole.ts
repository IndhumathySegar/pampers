import type { Document } from "mongoose";

export interface IRoleService {
  uniqueServiceName: string;
}

export interface IRoleSubResource {
  uniqueSubResourceName: string;
  services: IRoleService[];
  redirectURI?: string;
}

export interface IRolePermissions {
  uniqueResourceName: string;
  subResources: IRoleSubResource[];
}

export interface UserRole {
  name: string;
  canDelete?: boolean;
  canEdit?: boolean;
  permissions: IRolePermissions[];
}

export interface IUserRole extends UserRole, Document {}
