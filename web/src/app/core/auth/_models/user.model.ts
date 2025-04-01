import { BaseModel } from "../../_base/crud";

export class User extends BaseModel {
  _id: string;
  password: string;
  email: string;
  role: string;
  provider: string;
  roles: string[];
  permissions: Array<any>;
  pic: string;
  firstName: string;
  lastName: string;
  accessToken?: string;
  refreshToken?: string;
  enabled: boolean;
  defaultPage: string;
  landingPage: string;
  organization: string;
  rolePermissions: any[];
  market:  Array<any>;
  region:  Array<any>;
  locales:  Array<any>;
  modules:  Array<any>;
  markets: Array<any>;
  

  clear(): void {
    this._id = "";
    this.password = "";
    this.email = "";
    this.role = "user";
    this.role = "";
    this.firstName = "";
    this.lastName = "";
    this.pic = "./assets/media/users/default.jpg";
    this.enabled = true;
    this.defaultPage = "";
    this.landingPage = "";
    this.organization = "";
    this.rolePermissions = [];
  }
}
