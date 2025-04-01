// Actions
import { AuthActions, AuthActionTypes } from '../_actions/auth.actions';
// Models
import { User } from '../_models/user.model';

export interface AuthState {
    loggedIn: boolean;
    accessToken: string;
    user: User;
    isUserLoaded: boolean;
}

export const initialAuthState: AuthState = {
    loggedIn: false,
    accessToken: undefined,
    user: undefined,
    isUserLoaded: false
};

export function authReducer(state = initialAuthState, action: AuthActions | any = {}): AuthState {
    switch (action.type) {
        case AuthActionTypes.AuthLogin: {
            const _token: string = action.payload.accessToken;
            return {
                loggedIn: true,
                accessToken: _token,
                user: action.payload._user,
                isUserLoaded: false
            };
        }

        case AuthActionTypes.AuthLogout: {
            return initialAuthState;
        }

        case AuthActionTypes.AuthUserLoaded: {
            const _user: User = action.payload.user;
            return {
                ...state,
                user: _user,
                isUserLoaded: true
            };
        }

        default:
            return state;
    }
}