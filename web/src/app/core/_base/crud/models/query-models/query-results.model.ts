export class QueryResultsModel {
	// fields
	items: any;
	totalCount: number;
	errorMessage: string;
	allPermissions?: any;

	constructor(_items: any[] = [], _totalCount: number = 0, _errorMessage: string = '', _allPermissions: any = []) {
		this.items = _items;
		this.totalCount = _totalCount;
		this.allPermissions = _allPermissions;
	}
}
