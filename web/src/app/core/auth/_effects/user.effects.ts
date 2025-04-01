// Angular
import { Injectable } from '@angular/core';
// RxJS
import { mergeMap, map, tap, catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
// NGRX
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
// Services
import { AuthService } from '../../../core/auth/_services';
// State
import { AppState } from '../../../core/reducers';

import { ToastrService } from "ngx-toastr";
import {
    UserActionTypes,
    UsersPageRequested,
    UsersPageLoaded,
    UserCreated,
    UserDeleted,
    UserUpdated,
    UserOnServerCreated,
    UsersActionToggleLoading,
    UsersPageToggleLoading,
    UsersExport,
} from '../_actions/user.actions';
import { saveAs } from "file-saver";
import moment from "moment";

@Injectable()
export class UserEffects {
    showPageLoadingDistpatcher = new UsersPageToggleLoading({ isLoading: true });
    hidePageLoadingDistpatcher = new UsersPageToggleLoading({ isLoading: false });

    showActionLoadingDistpatcher = new UsersActionToggleLoading({ isLoading: true });
    hideActionLoadingDistpatcher = new UsersActionToggleLoading({ isLoading: false });

    @Effect()
    loadUsersPage$ = this.actions$
        .pipe(
            ofType<UsersPageRequested>(UserActionTypes.UserActionUsersPageRequested),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showPageLoadingDistpatcher);
                const requestToServer = this.auth.findUsers(payload.page);
                const lastQuery = of(payload.page);
                return forkJoin([requestToServer, lastQuery]).pipe(
                    map(([result, lastQuery]) => new UsersPageLoaded({
                        users: result.items,
                        totalCount: result.totalCount,
                        page: lastQuery
                    })),
                    catchError(error => {
                        if(error.error.message != "Please accept the terms and condition"){
                            this.toastr.error(error.error.message, "Error");                            
                        }
                        return of(this.hidePageLoadingDistpatcher);
                    })
                );
            }),
        );

    @Effect()
    deleteUser$ = this.actions$
        .pipe(
            ofType<UserDeleted>(UserActionTypes.UserActionUserDeleted),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.deleteUser(payload._id).pipe(
                    map(() => this.hideActionLoadingDistpatcher),
                    catchError(error => {
                        this.toastr.error(error.message, "Error");
                        return of(this.hideActionLoadingDistpatcher);
                    })
                );
            })
        );

    @Effect()
    updateUser$ = this.actions$
        .pipe(
            ofType<UserUpdated>(UserActionTypes.UserActionUserUpdated),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.updateUser(payload.user).pipe(
                    map(() => this.hideActionLoadingDistpatcher),
                    catchError(error => {
                        this.toastr.error(error.message, "Error");
                        return of(this.hideActionLoadingDistpatcher);
                    })
                );
            })
        );

    @Effect()
    createUser$ = this.actions$
        .pipe(
            ofType<UserOnServerCreated>(UserActionTypes.UserActionUserOnServerCreated),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.createUser(payload.user).pipe(
                    tap(res => {
                        this.store.dispatch(new UserCreated({ user: res }));
                    }),
                    map(() => this.hideActionLoadingDistpatcher),
                    catchError((err: any) => {
                        this.toastr.error(err.error.error, err.statusText);
                        return of(this.hideActionLoadingDistpatcher);
                    })
                );
            })
        );

    @Effect()
    exportUser$ = this.actions$
        .pipe(
            ofType<UsersExport>(UserActionTypes.UserActionUsersExport),
            mergeMap(() => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.export().pipe(
                    tap(res => {
                        saveAs(res, `Users-${moment().format("DD-MM-YY")}.csv`);
                    }),
                    map(() => this.hideActionLoadingDistpatcher),
                    catchError(error => {
                        this.toastr.error(error.message, "Error");
                        return of(this.hideActionLoadingDistpatcher);
                    })
                );
            }),
        );

    constructor(
        private actions$: Actions,
        private auth: AuthService,
        private store: Store<AppState>,
        private readonly toastr: ToastrService
    ) { }
}
