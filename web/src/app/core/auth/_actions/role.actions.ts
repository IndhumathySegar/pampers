// NGRX
import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
// CRUD
import { QueryParamsModel } from '../../_base/crud';
// Models
import { Role, RoleDbModel } from '../_models/role.model';

export enum RoleActionTypes {
    RoleActionAllRolesRequested = '[Roles Home Page] All Roles Requested',
    RoleActionAllRolesLoaded = '[Roles API] All Roles Loaded',
    RoleActionRoleOnServerCreated = '[Edit Role Dialog] Role On Server Created',
    RoleActionRoleCreationRequest = '[Edit Roles Dialog] Roles Creation Request',
    RoleActionRoleCreationSuccess = '[Edit Roles Dialog] Roles Creation Success',
    RoleActionRoleCreationError = '[Edit Roles Dialog] Roles Creation Error',
    RoleActionRoleUpdated = '[Edit Role Dialog] Role Updated',
    RoleActionRoleDeleted = '[Roles List Page] Role Deleted',

    RoleActionRolesPageRequested = '[Roles List Page] Roles Page Requested',
    RoleActionRolesPageLoaded = '[Roles API] Roles Page Loaded',
    RoleActionRolesPageCancelled = '[Roles API] Roles Page Cancelled',
    RoleActionRolesPageToggleLoading = '[Roles page] Roles Page Toggle Loading',
    RoleActionRolesActionToggleLoading = '[Roles] Roles Action Toggle Loading',

    RoleActionRolesRequesting = '[Roles] Roles requesting'
}

export class RoleOnServerCreated implements Action {
    readonly type = RoleActionTypes.RoleActionRoleOnServerCreated;
    constructor(public payload: { role: Role }) { }
}

export class RoleCreationRequest implements Action {
    readonly type = RoleActionTypes.RoleActionRoleCreationRequest;
    constructor(public payload: { roles: RoleDbModel[] }) { }
}
export class RoleCreationSuccess implements Action {
    readonly type = RoleActionTypes.RoleActionRoleCreationSuccess;
    constructor(public payload: { roles: RoleDbModel[] }) { }
}
export class RoleCreationError implements Action {
    readonly type = RoleActionTypes.RoleActionRoleCreationError;
    constructor(public payload: { errorMessage: string }) { }
}

export class RoleUpdated implements Action {
    readonly type = RoleActionTypes.RoleActionRoleUpdated;
    constructor(public payload: {
        roleName: string,
        partialrole: Update<RoleDbModel>[],
        roles: RoleDbModel[]
    }) { }
}

export class RoleDeleted implements Action {
    readonly type = RoleActionTypes.RoleActionRoleDeleted;
    constructor(public payload: { roleName: string }) { }
}

export class RolesPageRequested implements Action {
    readonly type = RoleActionTypes.RoleActionRolesPageRequested;
    constructor(public payload: { page: QueryParamsModel }) { }
}

export class RolesRequesting implements Action {
    readonly type = RoleActionTypes.RoleActionRolesRequesting;
    constructor(public payload: { isLoading: boolean }) { }
}

export class RolesPageLoaded implements Action {
    readonly type = RoleActionTypes.RoleActionRolesPageLoaded;
    constructor(public payload: { roles: any[], totalCount: number, page: QueryParamsModel, allPermissions: any[] }) { }
}

export class RolesPageCancelled implements Action {
    readonly type = RoleActionTypes.RoleActionRolesPageCancelled;
}

export class AllRolesRequested implements Action {
    readonly type = RoleActionTypes.RoleActionAllRolesRequested;
}

export class AllRolesLoaded implements Action {
    readonly type = RoleActionTypes.RoleActionAllRolesLoaded;
    constructor(public payload: { roles: Role[] }) { }
}

export class RolesPageToggleLoading implements Action {
    readonly type = RoleActionTypes.RoleActionRolesPageToggleLoading;
    constructor(public payload: { isLoading: boolean }) { }
}

export class RolesActionToggleLoading implements Action {
    readonly type = RoleActionTypes.RoleActionRolesActionToggleLoading;
    constructor(public payload: { isLoading: boolean }) { }
}

export type RoleActions = RoleCreationRequest
    | RoleCreationSuccess
    | RoleCreationError
    | RoleUpdated
    | RoleDeleted
    | RolesPageRequested
    | RolesPageLoaded
    | RolesPageCancelled
    | AllRolesLoaded
    | AllRolesRequested
    | RoleOnServerCreated
    | RolesPageToggleLoading
    | RolesActionToggleLoading
    | RolesRequesting;
