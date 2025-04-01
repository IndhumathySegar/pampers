// NGRX
import { createFeatureSelector, createSelector } from "@ngrx/store";
// CRUD
import { QueryResultsModel } from "../../_base/crud";
// State
import RolesState, { selectAll, selectIds } from "../_reducers/role.reducers";

export const selectRolesState = createFeatureSelector<RolesState>("roles");

export const selectRoleById = (roleId: string) =>
  createSelector(selectRolesState, (rolesState) => rolesState.entities[roleId]);

export const selectDistinctRoles = createSelector(selectRolesState, (state) => {
  debugger;
  return Object.values(state.ids);
});
export const selectAllRoles = createSelector(selectRolesState, selectAll);

export const selectAllRolesIds = createSelector(selectRolesState, selectIds);

export const allRolesLoaded = createSelector(
  selectRolesState,
  (rolesState) => rolesState.isAllRolesLoaded
);

export const selectRolesPageLoading = createSelector(
  selectRolesState,
  (rolesState) => rolesState.listLoading
);

export const selectRolesActionLoading = createSelector(
  selectRolesState,
  (rolesState) => rolesState.actionsloading
);

export const selectLastCreatedRoleId = createSelector(
  selectRolesState,
  (rolesState) => rolesState.lastCreatedRoleId
);

export const selectRolesShowInitWaitingMessage = createSelector(
  selectRolesState,
  (rolesState) => rolesState.showInitWaitingMessage
);

export const selectQueryResult = createSelector(
  selectRolesState,
  (rolesState) => {
    return new QueryResultsModel(
      rolesState.queryResult,
      rolesState.queryRowsCount,
      null,
      rolesState.allPermissions
    );
  }
);

export const isRequesting = createSelector(
  selectRolesState,
  (roleState) => roleState.isRequesting
);
