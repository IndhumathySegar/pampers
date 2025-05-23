// NGRX
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { createFeatureSelector } from '@ngrx/store';
// Actions
import { PermissionActionTypes, PermissionActions } from '../_actions/permission.actions';
// Models
import { Permission } from '../_models/permission.model';

export default interface PermissionsState extends EntityState<Permission> {
    _isAllPermissionsLoaded: boolean;
}

export const adapter: EntityAdapter<Permission> = createEntityAdapter<Permission>();

export const initialPermissionsState: PermissionsState = adapter.getInitialState({
    _isAllPermissionsLoaded: false
});

export function permissionsReducer(state = initialPermissionsState, action: PermissionActions | any = {}): PermissionsState {
    switch (action.type) {
        case PermissionActionTypes.PermissionActionTypesAllPermissionsRequested:
            return {
                ...state,
                _isAllPermissionsLoaded: false
            };
        case PermissionActionTypes.PermissionActionTypesAllPermissionsLoaded:
            return adapter.addAll(action.payload.permissions, {
                ...state,
                _isAllPermissionsLoaded: true
            });
        default:
            return state;
    }
}

export const getRoleState = createFeatureSelector<PermissionsState>('permissions');

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal
} = adapter.getSelectors();
