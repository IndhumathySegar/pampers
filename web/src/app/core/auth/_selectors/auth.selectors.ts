// NGRX
import { createSelector } from "@ngrx/store";

export const selectAuthState = (state) => state.auth;

export const isLoggedIn = createSelector(selectAuthState, (auth) => {
  return auth.loggedIn;
});

export const selectUserPermissions = createSelector(selectAuthState, (auth) => {
  const permissions = auth.user ? auth.user.rolePermissions : [];
  const sanitizedPermissions = {};

  permissions.forEach((permission) => {
    const subResources = {};

    // sub resources
    permission.subResources.forEach((subResource) => {
      const services = {};

      subResource.services.forEach((service) => {
        services[service.uniqueServiceName] = true;
      });

      subResources[subResource.uniqueSubResourceName] = services;

      if (subResource.redirectURI && !subResources["redirectURI"]) {
        subResources["redirectURI"] = subResource.redirectURI;
      }
    });

    // main resources
    sanitizedPermissions[permission.uniqueResourceName] = subResources;
  });

  return sanitizedPermissions;
});

export const isLoggedOut = createSelector(isLoggedIn, (loggedIn) => !loggedIn);

export const currentAuthToken = createSelector(
  selectAuthState,
  (auth) => auth.accessToken
);

export const isUserLoaded = createSelector(
  selectAuthState,
  (auth) => auth.isUserLoaded
);

export const currentUser = createSelector(selectAuthState, (auth) => auth.user);

export const currentUserRoleIds = createSelector(currentUser, (user) => {
  if (!user) {
    return [];
  }

  return user.roles;
});
