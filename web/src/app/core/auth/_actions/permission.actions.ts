// NGRX
import { Action } from '@ngrx/store';
// Models
import { Permission } from '../_models/permission.model';

export enum PermissionActionTypes {
    PermissionActionTypesAllPermissionsRequested = '[Init] All Permissions Requested',
    PermissionActionTypesAllPermissionsLoaded = '[Init] All Permissions Loaded'
}

export class AllPermissionsRequested implements Action {
    readonly type = PermissionActionTypes.PermissionActionTypesAllPermissionsRequested;
}

export class AllPermissionsLoaded implements Action {
    readonly type = PermissionActionTypes.PermissionActionTypesAllPermissionsLoaded;
    constructor(public payload: { permissions: Permission[] }) { }
}

export type PermissionActions = AllPermissionsRequested | AllPermissionsLoaded;
