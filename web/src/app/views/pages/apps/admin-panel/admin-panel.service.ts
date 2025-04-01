import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Router } from "@angular/router";

import { environment } from "@env/environment";

const { API_URL: baseUrl } = environment;

@Injectable({
  providedIn: "root",
})
export class AdminPanelService {
  
  constructor(private http: HttpClient,private router: Router) {}

  public listAuditTrail(pageParams): Observable<Object> {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${encodeURIComponent(pageParams[key])}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/admin-panel/auditTrailHistory?${pgQuery}`;
    return this.http.get(URL);
  }

  public getAllDropdown(): Observable<Object> {    
    const URL = `${baseUrl}/api/admin-panel/getAllDropdown`;
    return this.http.get(URL);
  }

  public exportCsv(pageParams): Observable<Blob> {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
        .map((key) => `${key}=${encodeURIComponent(pageParams[key])}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/admin-panel/getExportData?${pgQuery}`;
    return this.http.get(URL, { responseType: "blob",});
  }

  fetchContentModel(spaceId?, isReviewPage?) {
    const isCRM =  this.router.url.startsWith("/crm");
    const URL = `${baseUrl}/api/contentful/fetchContentModel?isCRM=${isCRM}&spaceId=${spaceId}&isReviewPage=${isReviewPage}`;
    return this.http.get(URL);
  }

  public exportUser(pageParams): Observable<Blob> {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${encodeURIComponent(pageParams[key])}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/users/export/getExportData?${pgQuery}`;
    return this.http.get(URL, { responseType: "blob",});
  }

  getRegions() {
    const URL = `${baseUrl}/api/module/getRegion`;
    return this.http.get(URL);
  }

  getUserRegion() {
    const URL = `${baseUrl}/api/module/getUserRegion`;
    return this.http.get(URL);
  }


  getModules() {
    const URL = `${baseUrl}/api/module/getList`;
    return this.http.get(URL);
  }

  public checkEmailExist(payload): Observable<Object> {
    const URL = `${baseUrl}/api/users/checkEmailExists`;
    return this.http.post(URL, payload);
  }

  public checkRoleExist(payload): Observable<Object> {
    const URL = `${baseUrl}/api/roles/checkRoleExists`;
    return this.http.post(URL, payload);
  }
}
