// Angular
import { Injectable } from '@angular/core';

// RXJS
import { defer, Observable, of } from 'rxjs';
// NGRX
import { Effect } from '@ngrx/effects';
import { Action } from '@ngrx/store';

// Actions
import {
    AllPermissionsRequested
} from '../_actions/permission.actions';

@Injectable()
export class PermissionEffects {
    @Effect()
    init$: Observable<Action> = defer(() => {
        return of(new AllPermissionsRequested());
    });
}
