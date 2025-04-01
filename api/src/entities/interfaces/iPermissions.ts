import type { Document } from "mongoose";

export interface IService {
  displayServiceName: string;
  uniqueServiceName: string;
}

export interface ISubResource {
  displaySubResourceName: string;
  uniqueSubResourceName: string;
  services: IService[];
  redirectURI?: string;
}

export interface Permission {
  displayResourceName: string;
  uniqueResourceName: string;
  subResources: ISubResource[];
}

export interface IPermission extends Permission, Document {}
