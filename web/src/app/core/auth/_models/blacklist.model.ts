import { BaseModel } from "../../_base/crud";

export class BlackListModel extends BaseModel {
  ip: string;
  deviceId: string;
  locale: string;
  reason: string;
  _id: string;

  clear(): void {
    this.ip = "";
    this.deviceId = "";
    this.locale = "";
    this.reason = "";
    this._id = "";
  }
}
