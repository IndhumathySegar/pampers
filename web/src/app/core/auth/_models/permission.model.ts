import { BaseModel } from '../../_base/crud';

export interface IPermission{
    id: number;
    title: string;
    level: number;
    parentId: number;
    isSelected: boolean;
    name: string;
    _children: IPermission[];
}
export class Permission extends BaseModel {
    id: string;
    title: string;
    level: number;
    parentId: string;
    isSelected: boolean;
    name: string;
    frontModule: string;
    _children: Permission[];

    clear(): void {
        this.id = '';
        this.title = '';
        this.level = 1;
        this.parentId = '';
        this.isSelected = false;
        this.name = '';
        this._children = [];
	}
}
