import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Router } from "@angular/router";

import { environment } from "@env/environment";

const { API_URL: baseUrl } = environment;

@Injectable({
  providedIn: "root",
})
export class ContentfulService {
  
  constructor(private http: HttpClient,private router: Router) {}

  public getProjects(isCRM?: boolean): Observable<Object> {
    const URL = `${baseUrl}/api/getProjects`;
    return this.http.get(URL);
  }

  public getEnvironments(query): Observable<Object> {
    const URL = `${baseUrl}/api/getEnvironments`;
    return this.http.get(URL, { params: query });
  }

  public getCrmEnvironments(query): Observable<Object> {
    const URL = `${baseUrl}/api/getCrmEnvironments`;
    return this.http.get(URL, { params: query });
  }

  public getTags(query): Observable<Object> {
    const URL = `${baseUrl}/api/getAllTags`;
    return this.http.get(URL, { params: query });
  }

  public postMigration(data): Observable<Object> {
    const URL = `${baseUrl}/api/migration`;
    return this.http.post(URL, data);
  }

  public migrationRollBack(data): Observable<Object> {
    const URL = `${baseUrl}/api/migrationRollBack`;
    return this.http.post(URL, data);
  }

  public postCRMMigration(data): Observable<Object> {
    const URL = `${baseUrl}/api/crm-contentful/crm-migration`;
    return this.http.post(URL, data);
  }

  public createLocale(payload): Observable<Object> {
    const URL = `${baseUrl}/api/contentful/create-locale`;
    return this.http.post(URL, payload);
  }

  public listMigration(pageParams): Observable<Object> {
    pageParams.isCRM =  this.router.url.startsWith("/crm");
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/listMigration?${pgQuery}`;
    return this.http.get(URL);
  }

  public listNewLocaleHistory(pageParams): Observable<Object> {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/contentful/new-locale-history?${pgQuery}`;
    return this.http.get(URL);
  }

  public listContentTranlationHistory(pageParams): Observable<Object> {
    pageParams.isCRM = this.router.url.startsWith("/crm");

    const pgQuery: any = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/contentful/content-translation-history?${pgQuery}`;
    return this.http.get(URL);
  }

  public listCrmContentTranlationHistory(pageParams): Observable<Object> {
    pageParams.isCRM = this.router.url.startsWith("/crm");

    const pgQuery: any = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/crm-contentful/content-translation-history?${pgQuery}`;
    return this.http.get(URL);
  }

  public listContentTranlationAllHistory(pageParams): Observable<Object> {
    pageParams.isCRM = this.router.url.startsWith("/crm");

    const pgQuery: any = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/contentful/content-translation-allhistory?${pgQuery}`;
    return this.http.get(URL);
  }

  getVersions(query) {
    const URL = `${baseUrl}/api/contentful/deeplinks-versions`;
    return this.http.get(URL, { params: query });
  }

  getDeeplinks(query) {
    const URL = `${baseUrl}/api/contentful/deeplinks-view`;
    return this.http.get(URL, { params: query });
  }

  manageDeeplinks(deeplinktUpdate, market, version) {
    const URL = `${baseUrl}/api/contentful/deeplinks-manage`;
    return this.http.post(URL, { deeplinktUpdate, market, version });
  }

  translate(content, destLocale, sourceLocale) {
    const isCRM = this.router.url.startsWith("/crm");

    const URL = `${baseUrl}/api/contentful/translate?isCRM=${isCRM}`;
    return this.http.post(URL, { content, destLocale, sourceLocale });
  }

  updateStatus(data) {
    const URL = `${baseUrl}/api/contentful/update-status`;
    return this.http.post(URL, data);
  }

  UpdateContent(query) {
   const isCRM = this.router.url.startsWith("/crm");
    const URL = `${baseUrl}/api/contentful/updateTranslation?isCRM=${isCRM}`;
    return this.http.post(URL, { params: query });
  }

  updateCrmContent(query) {
    const isCRM = this.router.url.startsWith("/crm");
     const URL = `${baseUrl}/api/crm-contentful/updateTranslation?isCRM=${isCRM}`;
     return this.http.post(URL, { params: query });
   }

  searchContent(query) {
    const pgQuery = query
    ? Object.keys(query)
        .map((key) => `${key}=${encodeURIComponent(query[key])}`)
        .join("&")
    : "";
    query.isCRM = this.router.url.startsWith("/crm");
    const URL = `${baseUrl}/api/contentful/searchTranslation?${pgQuery}`;  
    return this.http.get(URL);
  }

  searchCrmContent(query) {
    const pgQuery = query
    ? Object.keys(query)
        .map((key) => `${key}=${encodeURIComponent(query[key])}`)
        .join("&")
    : "";
    query.isCRM = this.router.url.startsWith("/crm");
    const URL = `${baseUrl}/api/crm-contentful/searchCrmTranslation?${pgQuery}`;  
    return this.http.get(URL);
  }

  fetchContentModel(spaceId?, isReviewPage?) {
    const isCRM =  this.router.url.startsWith("/crm");
    const URL = `${baseUrl}/api/contentful/fetchContentModel?isCRM=${isCRM}&spaceId=${spaceId}&isReviewPage=${isReviewPage}`;
    return this.http.get(URL);
  }

  fetchUserRegion() {
   
    const URL = `${baseUrl}/api/module/getUserRegion`;
    return this.http.get(URL);
  }
  fetchIsoCode(data) {   
    const URL = `${baseUrl}/api/contentful/get-isocode-list`;
    return this.http.post(URL, data);
  }

  fetchMigrationModel(spaceId?, environment?) {
    const URL = `${baseUrl}/api/contentful/fetchMigrationModel?environment=${environment}&spaceId=${spaceId}`;
    return this.http.get(URL);
  }

  createRegionMapping(data) {
    const URL = `${baseUrl}/api/region-mapping/create-region-mapping`;
    return this.http.post(URL, data);
  }

  getRegionMapping(pageParams): Observable<Object> {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/region-mapping/get-region-mapping?${pgQuery}`;
    return this.http.get(URL);
  }

  startTranslationJob(query) {
    const URL = `${baseUrl}/api/contentful/startTranslationJob`;
    return this.http.post(URL, { params: query });
  }

  getTranslation(isCrm?) {
    const URL = `${baseUrl}/api/contentful/getUpdatedTranslation?isCRM=${isCrm}`;
    return this.http.get(URL);
  }

  fetchTranslationHistory(pageParams) {
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/contentful/fetchTranslationHistory?${pgQuery}`;
    return this.http.get(URL);
  }

  submitReviewer(data) {
    const URL = `${baseUrl}/api/contentful/submit-reviewer`;
    return this.http.post(URL, data);

  }

  approveMessages(data) {
    const URL = `${baseUrl}/api/contentful/approve-messages`;
    return this.http.post(URL, data);

  }

  approveCrmMessages(data) {
    const URL = `${baseUrl}/api/crm-contentful/approve-messages`;
    return this.http.post(URL, data);

  }



  bulkMigrationUpload(
    contentFile: File,
    mediaFile: File,
    models: string[]
  ): Observable<any> {
    const formData: FormData = new FormData();
    formData.append("content", contentFile, contentFile.name);
    formData.append("media", mediaFile, mediaFile.name);
    formData.append("contentModels", JSON.stringify(models));
    const URL = `${baseUrl}/api/contentful/upload-file`;
    return this.http.post<any>(URL, formData, {});
  }

  public listBulkMigration(pageParams): Observable<Object> {
    pageParams.isCRM =  this.router.url.startsWith("/crm");
    const pgQuery = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/contentful/csv-upload-history?${pgQuery}`;
    return this.http.get(URL);
  }

  public downloadFile(payload): Observable<Blob> {
    return this.http.get(`${baseUrl}/api/contentful/download-file?file=${payload.file}&type=${payload.type}`, { responseType: 'blob' });
  }

  public downloadZipFile(payload): Observable<ArrayBuffer> {
    return this.http.get(`${baseUrl}/api/contentful/download-file?file=${payload.file}&type=${payload.type}`, { responseType: 'arraybuffer' });
  }

  public getPublishedDate(query): Observable<Object> {
    const URL = `${baseUrl}/api/migration/get-published-date`;
    return this.http.post(URL, query, {     
    });
  }
}
