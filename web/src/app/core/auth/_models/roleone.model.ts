import { BaseModel } from "../../_base/crud";

import { IPermission } from "./permission.model";

export class Role1 extends BaseModel {
  _id?: string;
  name: string;
  permissions: IPermission[];
  isCoreRole = false;
  canEdit: boolean;
  canDelete: boolean;

  clear(): void {
    this.name = "";
    this.permissions = [];
    this.isCoreRole = false;
    this.canEdit = true;
    this.canDelete = true;
  }
}
