import { BaseModel } from "../../_base/crud";
import { Permission } from "./permission.model";

export class Role extends BaseModel {
  _id: string;
  title: string;
  permissions: Permission[];
  isCoreRole = false;

  clear(): void {
    this._id = "";
    this.title = "";
    this.permissions = [];
    this.isCoreRole = false;
  }
}

export class RoleDbModel {
  _id?: string;
  app: string;
  subModule: string;
  frontModule: string;
  attributes: Array<string>;
  role: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;

  constructor() {
    this.app = "";
    this.subModule = "";
    this.role = "";
    this.canRead = false;
    this.canCreate = false;
    this.canUpdate = false;
    this.canDelete = false;
    this.attributes = ["*"];
  }
}
