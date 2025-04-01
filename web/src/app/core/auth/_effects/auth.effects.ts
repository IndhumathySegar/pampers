// Angular
import { Injectable } from '@angular/core';
// RxJS
import { mergeMap, tap, withLatestFrom, catchError, map } from 'rxjs/operators';
import { defer, Observable, of } from 'rxjs';
// NGRX
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
// Auth actions
import { AuthActionTypes, Login, Logout, UserLoaded, UserRequested, ChangePasswordInit, ChangePasswordSuccess, ChangePasswordError } from '../_actions/auth.actions';
import { AuthService } from '../_services/index';
import { AppState } from '../../reducers';
import { environment } from '../../../../environments/environment';
import { isUserLoaded } from '../_selectors/auth.selectors';


@Injectable()
export class AuthEffects {
    APPLICATION_TIMEOUT_TIME = (1000 * 60 * 60); // 60 minutes

    @Effect({ dispatch: false })
    login$ = this.actions$.pipe(
        ofType<Login>(AuthActionTypes.AuthLogin),
        tap(action => {
            localStorage.setItem(environment.authTokenKey, action.payload.accessToken);
            localStorage.setItem('_user', JSON.stringify(action.payload._user));
        }),
    );

    @Effect({ dispatch: false })
    logout$ = this.actions$.pipe(
        ofType<Logout>(AuthActionTypes.AuthLogout)
    );

    @Effect({ dispatch: false })
    loadUser$ = this.actions$
        .pipe(
            ofType<UserRequested>(AuthActionTypes.AuthUserRequested),
            withLatestFrom(this.store.pipe(select(isUserLoaded))),
            mergeMap(([action, _isUserLoaded]) => this.auth.getUserById(action.payload._id)),
            tap(_user => {
                if (_user) {
                    localStorage.setItem('_user', JSON.stringify(_user));
                    this.store.dispatch(new UserLoaded({ user: _user }));
                } else {
                    this.store.dispatch(new Logout());
                }
            })
        );

    @Effect({ dispatch: false })
    changePassword$ = this.actions$
        .pipe(
            ofType<ChangePasswordInit>(AuthActionTypes.AuthChangePasswordInit),
            mergeMap(({ payload }) => {
                return this.auth.changePassword(payload.email, payload.password, payload.newPassword).pipe(
                    map(({ message }) => {
                        return this.store.dispatch(new ChangePasswordSuccess({ message }));
                    }),
                    catchError(err => {
                        this.store.dispatch(new ChangePasswordError({ message: err.error }));
                        return of(new ChangePasswordError({ message: err.error }));
                    })
                );
            })
        );

    @Effect()
    init$: Observable<Action> = defer(() => {
        const userToken = localStorage.getItem(environment.authTokenKey);
        const _user = JSON.parse(localStorage.getItem("_user"));
        let observableResult = of({ type: 'NO_ACTION' });

        if (userToken && _user) {
            observableResult = of(new Login({ _user, accessToken: userToken }));
        }

        return observableResult;
    });

    constructor(
        private readonly actions$: Actions,
        private readonly auth: AuthService,
        private readonly store: Store<AppState>) {
    }
}
