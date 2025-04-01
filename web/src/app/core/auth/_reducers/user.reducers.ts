// NGRX
import { createFeatureSelector } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
// Actions
import { UserActions, UserActionTypes } from '../_actions/user.actions';
// CRUD
import { QueryParamsModel } from '../../_base/crud';
// Models
import { User } from '../_models/user.model';

// tslint:disable-next-line:no-empty-interface
export interface UsersState extends EntityState<User> {
    listLoading: boolean;
    actionsloading: boolean;
    totalCount: number;
    lastCreatedUserId: string;
    lastQuery: QueryParamsModel;
    showInitWaitingMessage: boolean;
}

export const adapter: EntityAdapter<User> = createEntityAdapter<User>({
    selectId: (model: User) => model._id
});

export const initialUsersState: UsersState = adapter.getInitialState({
    listLoading: false,
    actionsloading: false,
    totalCount: 0,
    lastQuery: new QueryParamsModel({}),
    lastCreatedUserId: undefined,
    showInitWaitingMessage: true
});

export function usersReducer(state = initialUsersState, action: UserActions | any = {}): UsersState {
    switch (action.type) {
        case UserActionTypes.UserActionUsersPageToggleLoading: return {
            ...state, listLoading: action.payload.isLoading, lastCreatedUserId: undefined
        };
        case UserActionTypes.UserActionUsersActionToggleLoading: return {
            ...state, actionsloading: action.payload.isLoading
        };
        case UserActionTypes.UserActionUserOnServerCreated: return {
            ...state
        };
        case UserActionTypes.UserActionUserCreated: return adapter.addOne(action.payload.user, {
            ...state, lastCreatedUserId: action.payload.user._id
        });
        case UserActionTypes.UserActionUserUpdated: return adapter.updateOne(action.payload.partialUser, state);
        case UserActionTypes.UserActionUserDeleted: return adapter.removeOne(action.payload._id, state);
        case UserActionTypes.UserActionUsersPageCancelled: return {
            ...state, listLoading: false, lastQuery: new QueryParamsModel({})
        };
        case UserActionTypes.UserActionUsersPageLoaded: {
            return adapter.addMany(action.payload.users, {
                ...initialUsersState,
                totalCount: action.payload.totalCount,
                lastQuery: action.payload.page,
                listLoading: false,
                showInitWaitingMessage: false
            });
        }
        default: return state;
    }
}

export const getUserState = createFeatureSelector<UsersState>('users');

export const {
    selectAll,
    selectEntities,
    selectIds,
    selectTotal
} = adapter.getSelectors();
