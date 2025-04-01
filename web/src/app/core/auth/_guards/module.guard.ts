// Angular
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
// RxJS
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";
// NGRX
import { select, Store } from "@ngrx/store";

import { get } from "lodash";
// Module reducers and selectors
import { AppState } from "../../../core/reducers/";
import { selectUserPermissions } from "../_selectors/auth.selectors";

@Injectable()
export class ModuleGuard implements CanActivate {
  landingPage = "";
  constructor(private store: Store<AppState>, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const subPath = state.url.split("/")[state.url.split("/").length - 1];
    console.log('selectUserPermissions----------', selectUserPermissions);

    return this.store.pipe(
      select(selectUserPermissions),
      map((permissions) => {
        let isInitialRouteValid = false;
        route.routeConfig.children.forEach((child) => {

          if (child.path === subPath) {
            const uniqueServiceName = get(
              child,
              "data.uniqueServiceName",
              ""
            ) as string;
            const resourceTree = uniqueServiceName.split(":");
            const resource = resourceTree[0];
            const subResource = resourceTree[1];
            const serviceName = resourceTree[2];
            isInitialRouteValid = get(
              permissions,
              `${resource}.${resource}:${subResource}.${resource}:${subResource}:${serviceName}`,
              false
            );
          }
        });
        console.log('isInitialRouteValid---------', isInitialRouteValid)
        // if initial route is not valud
        if (!isInitialRouteValid) {
          const isAnyRouteValid = route.routeConfig.children.findIndex(
            (child) => {
              const uniqueServiceName = get(
                child,
                "data.uniqueServiceName",
                ""
              ) as string;

              const resourceTree = uniqueServiceName.split(":");
              const resource = resourceTree[0];
              const subResource = resourceTree[1];
              const serviceName = resourceTree[2];

              return get(
                permissions,
                `${resource}.${resource}:${subResource}.${resource}:${subResource}:${serviceName}`,
                false
              );
            }
          );

          if (isAnyRouteValid !== -1) {
            const redirectRoute = state.url
              .split("/")
              .filter((_, index) => index != state.url.split("/").length - 1)
              .join("");
            this.router.navigateByUrl(
              `${redirectRoute}/${route.routeConfig.children[isAnyRouteValid].path}`
            );

            return true;
          }

          let redirectURI = "";

          for (const [
            _,
            { redirectURI: subResourceRedirectURI = "" },
          ] of Object.entries<any>(permissions)) {

            if (!redirectURI && subResourceRedirectURI) {
              redirectURI = subResourceRedirectURI;
            }
          }

          if (redirectURI) {
            this.router.navigateByUrl(redirectURI);

            return true;
          }

          return false;
        }

        return true;
      }),
      tap((hasPermission) => {
        console.log('hasPermission-----------', hasPermission)
        if (!hasPermission) {
          localStorage.setItem("access-url", this.landingPage);
          this.router.navigateByUrl("/error/403");
        }
      })
    );
  }
}
