import { cloneDeep } from "lodash";

// CRUD
import { QueryParamsModel } from "./query-models/query-params.model";
import { QueryResultsModel } from "./query-models/query-results.model";

export class HttpExtenstionsModel {
  /**
   * Filtration with sorting
   * First do Sort then filter
   *
   * @param _entities: any[]
   * @param _queryParams: QueryParamsModel
   * @param _filtrationFields: string[]
   */
  baseFilter(
    _entities: any,
    _queryParams: QueryParamsModel,
    _filtrationFields: string[] = []
  ): QueryResultsModel {
    // Filtration
    let entitiesResult;
    if (typeof _entities == "object") {
      entitiesResult = this.searchInArray(
        _entities.items ? _entities.items : _entities,
        _queryParams.filter,
        _filtrationFields
      );
    }
  

    // Paginator
    const totalCount = _entities.totalCount
      ? _entities.totalCount
      : entitiesResult.length;

    const queryResults = new QueryResultsModel();
    queryResults.items = entitiesResult;
    queryResults.totalCount = totalCount;
    if (typeof _entities === "object" && _entities.allPermissions) {
      queryResults.allPermissions = _entities.allPermissions || [];
    }
    return queryResults;
  }

  /**
   * Sort array by field name and order-type
   * @param _incomingArray: any[]
   * @param _sortField: string
   * @param _sortOrder: string
   */
  sortArray(
    _incomingArray: any[],
    _sortField: string = "",
    _sortOrder: string = "asc"
  ): any[] {
    if (!_sortField) {
      return _incomingArray;
    }

    return cloneDeep(_incomingArray).sort((a, b) => {
      if (a[_sortField] < b[_sortField]) {
        return _sortOrder === "asc" ? -1 : 1;
      }

      if (a[_sortField] > b[_sortField]) {
        return _sortOrder === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  /**
   * Filter array by some fields
   *
   * @param _incomingArray: any[]
   * @param _queryObj: any
   * @param _filtrationFields: string[]
   */
  searchInArray(
    _incomingArray: any[],
    _queryObj: any,
    _filtrationFields: string[] = []
  ): any[] {
    const result: any[] = [];
    const indexes: number[] = [];
    return _incomingArray;
 
  }

  incomingData(_queryObj, _filtrationFields, indexes, _incomingArray) {
    let doSearch = false;
    console.log("_queryObj", _queryObj)
    console.log("_incomingArray", _incomingArray)

    return true;
  }

  filteration(_filtrationFields, _queryObj, _incomingArray) {
    let resultBuffer: any[] = [];
    let firstIndexes: number[] = [];

    _filtrationFields.forEach((item) => {
      if (item in _queryObj) {
        _incomingArray.forEach((element, index) => {
          if (
            element[item].toLowerCase().includes(_queryObj[item].toLowerCase())
          ) {
            firstIndexes.push(index);
          }
        });

        firstIndexes.forEach((element) => {
          resultBuffer.push(_incomingArray[element]);
        });

        _incomingArray = resultBuffer.slice(0);
        resultBuffer = [].slice(0);
        firstIndexes = [].slice(0);
      }
    });
  }
}
