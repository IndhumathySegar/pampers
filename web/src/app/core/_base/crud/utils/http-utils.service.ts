// Angular
import { Injectable } from '@angular/core';
import { HttpParams, HttpHeaders } from '@angular/common/http';
// CRUD
import { QueryResultsModel } from '../models/query-models/query-results.model';
import { QueryParamsModel } from '../models/query-models/query-params.model';
import { HttpExtenstionsModel } from '../../crud/models/http-extentsions-model';

@Injectable()
export class HttpUtilsService {
	/**
	 * Prepare query http params
	 * @param queryParams: QueryParamsModel
	 */
	getFindHTTPParams(queryParams): HttpParams {
		return new HttpParams()
			.set('pageNumber', queryParams.pageNumber.toString())
			.set('pageSize', queryParams.pageSize.toString());
	}

	/**
	 * get standard content-type
	 */
	getHTTPHeaders(): HttpHeaders {
		return new HttpHeaders().set('Content-Type', 'application/json');
	}

	baseFilter(_entities: any[], _queryParams: QueryParamsModel, _filtrationFields: string[] = []): QueryResultsModel {
		const httpExtention = new HttpExtenstionsModel();
		return httpExtention.baseFilter(_entities, _queryParams, _filtrationFields);
	}

	sortArray(_incomingArray: any[], _sortField: string = '', _sortOrder: string = 'asc'): any[] {
		const httpExtention = new HttpExtenstionsModel();
		return httpExtention.sortArray(_incomingArray, _sortField, _sortOrder);
	}

	searchInArray(_incomingArray: any[], _queryObj: any, _filtrationFields: string[] = []): any[] {
		const httpExtention = new HttpExtenstionsModel();
		return httpExtention.searchInArray(_incomingArray, _queryObj, _filtrationFields);
	}
}
