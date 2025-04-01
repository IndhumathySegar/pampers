// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// RxJS
import { Observable } from 'rxjs';
// Models
import { DataTableItemModel } from '../models/datatable-item.model';

@Injectable()
export class DataTableService {
	/**
	 * Service Constructor
	 *
	 * @param http: HttpClient
	 */
	constructor(private http: HttpClient) { }

	/**
	 * Returns data from fake server
	 */
	getAllItems(apiUrl): Observable<DataTableItemModel[]> {
		return this.http.get<DataTableItemModel[]>(apiUrl);
	}
}
