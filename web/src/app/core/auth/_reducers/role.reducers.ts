// NGRX
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
// Actions
import { RoleActions, RoleActionTypes } from '../_actions/role.actions';
// Models
import { Role } from '../_models/role.model';
import { QueryParamsModel } from '../../_base/crud';

export default interface RolesState extends EntityState<Role> {
    isAllRolesLoaded: boolean;
    queryRowsCount: number;
    queryResult: Role[];
    lastCreatedRoleId: string;
    listLoading: boolean;
    actionsloading: boolean;
    lastQuery: QueryParamsModel;
    showInitWaitingMessage: boolean;
    isRequesting: boolean;
    allPermissions: any[];
}

export const adapter: EntityAdapter<Role> = createEntityAdapter<Role>({ selectId: (model: Role) => model._id });

export const initialRolesState: RolesState = adapter.getInitialState({
    isAllRolesLoaded: false,
    queryRowsCount: 0,
    queryResult: [],
    lastCreatedRoleId: undefined,
    listLoading: false,
    actionsloading: false,
    lastQuery: new QueryParamsModel({}),
    showInitWaitingMessage: true,
    isRequesting: false,
    allPermissions: []
});

export function rolesReducer(state = initialRolesState, action: RoleActions | any = {}): RolesState {
    switch (action.type) {
        case RoleActionTypes.RoleActionRolesPageToggleLoading: return {
            ...state, listLoading: action.payload.isLoading, lastCreatedRoleId: undefined
        };
        case RoleActionTypes.RoleActionRolesActionToggleLoading: return {
            ...state, actionsloading: action.payload.isLoading
        };
        case RoleActionTypes.RoleActionRoleOnServerCreated: return {
            ...state
        };
        case RoleActionTypes.RoleActionRoleUpdated: return adapter.updateMany(action.payload.partialrole, state);
        case RoleActionTypes.RoleActionRoleDeleted: return adapter.removeOne(action.payload.roleName, state);
        case RoleActionTypes.RoleActionAllRolesLoaded: return adapter.addAll(action.payload.roles, {
            ...state, isAllRolesLoaded: true
        });
        case RoleActionTypes.RoleActionRolesPageCancelled: return {
            ...state, listLoading: false, queryRowsCount: 0, queryResult: [], lastQuery: new QueryParamsModel({})
        };
        case RoleActionTypes.RoleActionRolesPageLoaded: return adapter.addMany(action.payload.roles, {
            ...initialRolesState,
            listLoading: false,
            queryRowsCount: action.payload.totalCount,
            queryResult: action.payload.roles,
            lastQuery: action.payload.page,
            showInitWaitingMessage: false,
            allPermissions: action.payload.allPermissions
        });

        case RoleActionTypes.RoleActionRolesRequesting: {
            return {
                ...state,
                isRequesting: action.payload.isLoading
            }

        }
        default: return state;
    }
}

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal
} = adapter.getSelectors();
