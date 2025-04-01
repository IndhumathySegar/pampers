interface ICars {
	id: number;
	cModel: string;
	cManufacture: string;
	cModelYear: number;
	cMileage: number;
	cDescription: string;
	cColor: string;
	cPrice: number;
	cCondition: number;
	cStatus: number;
	cVINCode: string;
}
interface IUser {
	id: number;
	username: string;
	email: string
}

interface ICustomerModel {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	userName: string;
	gender: string
	dateOfBbirth: string;
	ipAddress: string
}
export type DataTableItemModel = ICars | IUser
