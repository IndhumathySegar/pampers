import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { environment } from "@env/environment";

const { API_URL: baseUrl } = environment;

@Injectable({
  providedIn: "root",
})
export class MarketService {
  constructor(private http: HttpClient) {}

  UpdateContent(data, currentEnv) {
    const URL = `${baseUrl}/api/market-review/updateContentful?environment=${currentEnv}`;
    return this.http.post(URL, data);
  }

  fetchContentModel(data?) {
    const URL = `${baseUrl}/api/market-review/fetchContentModel`;
    return this.http.post(URL, data );
  }

  public listContentTranlationHistory(pageParams): Observable<Object> {
    const pgQuery: any = pageParams
      ? Object.keys(pageParams)
          .map((key) => `${key}=${pageParams[key]}`)
          .join("&")
      : "";
    const URL = `${baseUrl}/api/market-review/fetchContentTranslationHistory?${pgQuery}`;
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
}
