// NGRX
import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
// CRUD
import { User } from '../_models/user.model';
// Models
import { QueryParamsModel } from '../../_base/crud';

export enum UserActionTypes {
    UserActionAllUsersRequested = '[Users Module] All Users Requested',
    UserActionAllUsersLoaded = '[Users API] All Users Loaded',
    UserActionUserOnServerCreated = '[Edit User Component] User On Server Created',
    UserActionUserCreated = '[Edit User Dialog] User Created',
    UserActionUserUpdated = '[Edit User Dialog] User Updated',
    UserActionUserDeleted = '[Users List Page] User Deleted',
    UserActionUsersPageRequested = '[Users List Page] Users Page Requested',
    UserActionUsersPageLoaded = '[Users API] Users Page Loaded',
    UserActionUsersPageCancelled = '[Users API] Users Page Cancelled',
    UserActionUsersPageToggleLoading = '[Users] Users Page Toggle Loading',
    UserActionUsersActionToggleLoading = '[Users] Users Action Toggle Loading',
    UserActionUsersExport = '[Users] Users Export  Toggle Loading'
}

export class UserOnServerCreated implements Action {
    readonly type = UserActionTypes.UserActionUserOnServerCreated;
    constructor(public payload: { user: User }) { }
}

export class UserCreated implements Action {
    readonly type = UserActionTypes.UserActionUserCreated;
    constructor(public payload: { user: User }) { }
}

export class UsersExport implements Action {
    readonly type = UserActionTypes.UserActionUsersExport;
    constructor(public payload: { page: QueryParamsModel }) { }
}

export class UserUpdated implements Action {
    readonly type = UserActionTypes.UserActionUserUpdated;
    constructor(public payload: {
        partialUser: Update<User>,
        user: User
    }) { }
}

export class UserDeleted implements Action {
    readonly type = UserActionTypes.UserActionUserDeleted;
    constructor(public payload: { _id: string }) { }
}

export class UsersPageRequested implements Action {
    readonly type = UserActionTypes.UserActionUsersPageRequested;
    constructor(public payload: { page: QueryParamsModel }) { }
}

export class UsersPageLoaded implements Action {
    readonly type = UserActionTypes.UserActionUsersPageLoaded;
    constructor(public payload: { users: User[], totalCount: number, page: QueryParamsModel }) { }
}


export class UsersPageCancelled implements Action {
    readonly type = UserActionTypes.UserActionUsersPageCancelled;
}

export class UsersPageToggleLoading implements Action {
    readonly type = UserActionTypes.UserActionUsersPageToggleLoading;
    constructor(public payload: { isLoading: boolean }) { }
}

export class UsersActionToggleLoading implements Action {
    readonly type = UserActionTypes.UserActionUsersActionToggleLoading;
    constructor(public payload: { isLoading: boolean }) { }
}

export type UserActions = UserCreated
    | UserUpdated
    | UserDeleted
    | UserOnServerCreated
    | UsersPageLoaded
    | UsersPageCancelled
    | UsersPageToggleLoading
    | UsersPageRequested
    | UsersExport
    | UsersActionToggleLoading;
