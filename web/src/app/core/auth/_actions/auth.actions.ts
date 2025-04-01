import { Action } from '@ngrx/store';
import { User } from '../_models/user.model';

export enum AuthActionTypes {
    AuthLogin = '[Login] Action',
    AuthLogout = '[Logout] Action',
    AuthUserRequested = '[Request User] Action',
    AuthUserLoaded = '[Load User] Auth API',
    AuthChangePasswordInit = '[Change Password Init] Auth API',
    AuthChangePasswordSuccess = '[Change Password Success] Auth API',
    AuthChangePasswordError = '[Change Password Error] Auth API'
}

export class Login implements Action {
    readonly type = AuthActionTypes.AuthLogin;
    constructor(public payload: { _user: User, accessToken: string }) { }
}

export class Logout implements Action {
    readonly type = AuthActionTypes.AuthLogout;
}

export class UserRequested implements Action {
    readonly type = AuthActionTypes.AuthUserRequested;
    constructor(public payload: { _id: string }) { }
}

export class UserLoaded implements Action {
    readonly type = AuthActionTypes.AuthUserLoaded;
    constructor(public payload: { user: User }) { }
}

export class ChangePasswordInit implements Action {
    readonly type = AuthActionTypes.AuthChangePasswordInit;
    constructor(public payload: { email: string, password: string, newPassword: string }) { }
}

export class ChangePasswordSuccess implements Action {
    readonly type = AuthActionTypes.AuthChangePasswordSuccess;
    constructor(public payload: { message: string }) { }
}

export class ChangePasswordError implements Action {
    readonly type = AuthActionTypes.AuthChangePasswordError;
    constructor(public payload: { message: string }) { }
}



export type AuthActions = Login | Logout | UserRequested | UserLoaded | ChangePasswordInit | ChangePasswordSuccess | ChangePasswordError;
