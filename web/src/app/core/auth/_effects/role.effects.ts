// Angular
import { Injectable } from '@angular/core';
// RxJS
import { of, forkJoin } from 'rxjs';
import { mergeMap, map, withLatestFrom, filter, catchError, finalize } from 'rxjs/operators';
// NGRX
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
// CRUD
import { QueryResultsModel, QueryParamsModel } from '../../_base/crud';
// Services
import { AuthService } from '../_services';
// State
import { AppState } from '../../../core/reducers';
// Selectors
import { allRolesLoaded } from '../_selectors/role.selectors';
// Actions
import {
    AllRolesLoaded,
    AllRolesRequested,
    RoleActionTypes,
    RolesPageRequested,
    RolesPageLoaded,
    RoleUpdated,
    RolesPageToggleLoading,
    RoleDeleted,
    RoleCreationRequest,
    RoleCreationSuccess,
    RoleCreationError,
    RolesActionToggleLoading,
    RolesRequesting
} from '../_actions/role.actions';

@Injectable()
export class RoleEffects {
    showPageLoadingDistpatcher = new RolesPageToggleLoading({ isLoading: true });
    hidePageLoadingDistpatcher = new RolesPageToggleLoading({ isLoading: false });

    showActionLoadingDistpatcher = new RolesActionToggleLoading({ isLoading: true });
    hideActionLoadingDistpatcher = new RolesActionToggleLoading({ isLoading: false });

    @Effect()
    loadAllRoles$ = this.actions$
        .pipe(
            ofType<AllRolesRequested>(RoleActionTypes.RoleActionAllRolesRequested),
            withLatestFrom(this.store.pipe(select(allRolesLoaded))),
            filter(([action, isAllRolesLoaded]) => !isAllRolesLoaded),
            mergeMap(() => {
                this.store.dispatch(new RolesRequesting({ isLoading: true }))
                return this.auth.getAllRoles()
            }),
            map(roles => {
                return new AllRolesLoaded({ roles });
            })
        );

    @Effect()
    loadRolesPage$ = this.actions$
        .pipe(
            ofType<RolesPageRequested>(RoleActionTypes.RoleActionRolesPageRequested),
            mergeMap(({ payload }) => {
                this.store.dispatch(new RolesRequesting({ isLoading: true }))
                this.store.dispatch(this.showPageLoadingDistpatcher);
                const requestToServer = this.auth.findRoles(payload.page);
                const lastQuery = of(payload.page);
                return forkJoin([requestToServer, lastQuery]);
            }),
            map(response => {
                this.store.dispatch(new RolesRequesting({ isLoading: false }));

                const result: QueryResultsModel = response[0];
                const lastQuery: QueryParamsModel = response[1];
                this.store.dispatch(this.hidePageLoadingDistpatcher);

                return new RolesPageLoaded({
                    roles: result.items,
                    totalCount: result.totalCount,
                    page: lastQuery,
                    allPermissions: result.allPermissions
                });
            }),
            catchError(error => {
                return of(this.hidePageLoadingDistpatcher);
            })
        );

    @Effect()
    deleteRole$ = this.actions$
        .pipe(
            ofType<RoleDeleted>(RoleActionTypes.RoleActionRoleDeleted),
            mergeMap(
                ({ payload }) => {
                    this.store.dispatch(this.showActionLoadingDistpatcher);
                    return this.auth.deleteRole(payload.roleName);
                }
            ),
            map(() => {
                return this.hideActionLoadingDistpatcher;
            }),
        );

    @Effect()
    updateRole$ = this.actions$
        .pipe(
            ofType<RoleUpdated>(RoleActionTypes.RoleActionRoleUpdated),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.updateRole(payload.roleName, payload.roles);
            }),
            map(() => {
                return this.hideActionLoadingDistpatcher;
            }),
        );


    @Effect()
    createRole$ = this.actions$
        .pipe(
            ofType<RoleCreationRequest>(RoleActionTypes.RoleActionRoleCreationRequest),
            mergeMap(({ payload }) => {
                this.store.dispatch(this.showActionLoadingDistpatcher);
                return this.auth.createRole(payload.roles).pipe(
                    map(data => new RoleCreationSuccess({ roles: payload.roles })),
                    catchError(err => {
                        let errorMessage = ''
                        if (err.status === 403) {
                            errorMessage = 'You do not have permission to add new role'
                        } else {
                            errorMessage = err.error.message
                        }
                        return of(new RoleCreationError({ errorMessage }));
                    }),
                    finalize(() => this.store.dispatch(this.hideActionLoadingDistpatcher))
                );
            })
        );

    constructor(private actions$: Actions, private auth: AuthService, private store: Store<AppState>) { }
}
