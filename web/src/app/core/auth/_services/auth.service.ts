import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { User } from "../_models/user.model";
import { Permission } from "../_models/permission.model";
import { Role, RoleDbModel } from "../_models/role.model";
import { catchError, map, mergeMap } from "rxjs/operators";
import {
  QueryParamsModel,
  QueryResultsModel,
  HttpUtilsService,
} from "../../_base/crud";
import { environment } from "@env/environment";

const API_AUTH_LOGIN_URL = `${environment.API_URL}/api/auth/login`;
const API_AUTH_SSO_LOGIN_URL = `${environment.API_URL}/api/auth/loginSSO`;
const API_AUTH_LOGOUT = `${environment.API_URL}/api/auth/logout`;
const API_USERS_URL = `${environment.API_URL}/api/users`;
const API_PERMISSION_URL = `${environment.API_URL}/api/permissions`;
const API_ROLES_URL = `${environment.API_URL}/api/roles`;
const API_TC_URL = `${environment.API_URL}/api/getTCStatus`;
@Injectable()
export class AuthService {
  constructor(private http: HttpClient, private httpUtils: HttpUtilsService) {}
  // Authentication/Authorization
  loginSSO(token: string): Observable<User> {
    return this.http.post<User>(API_AUTH_SSO_LOGIN_URL, { ssoToken: token });
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(API_AUTH_LOGIN_URL, { email, password });
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${environment.BASE_URL}.auth/me`);
  }

  logout(type?): Observable<any> {
    const userToken = localStorage.getItem(environment.authTokenKey);

    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Authorization", "Bearer " + userToken);
    let logoutUrl = type ? this.http.get(`${API_AUTH_LOGOUT}?type=${type}`) : this.http.get(API_AUTH_LOGOUT)
    return logoutUrl;
  }

  isUserLoggedIn() {
    return Boolean(localStorage.getItem(environment.authTokenKey));
  }

  getUserByToken(): Observable<User> {
    const userToken = localStorage.getItem(environment.authTokenKey);
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Authorization", "Bearer " + userToken);
    return this.http.get<User>(API_USERS_URL, { headers: httpHeaders });
  }

  register(user: User): Observable<any> {
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");

    return this.http
      .post<User>(API_USERS_URL, user, { headers: httpHeaders })
      .pipe(
        map((res: User) => {
          return res;
        }),
        catchError((_: any) => {
          return null;
        })
      );
  }

  changePassword(
    email: string,
    password: string,
    newPassword: string
  ): Observable<any> {
    const URL = `${environment.API_URL}/api/auth/password/change`;
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http.post(
      URL,
      { email, password, newPassword },
      { headers: httpHeaders }
    );
  }

  public requestPassword(email: string): Observable<any> {
    return this.http
      .get(API_USERS_URL + "/forgot?=" + email)
      .pipe(catchError(this.handleError([])));
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(API_USERS_URL);
  }

  getUserById(_id: string): Observable<User> {
    return this.http.get<User>(API_USERS_URL + `/${_id}`);
  }

  // DELETE => delete the user from the server
  // deleteUser(userId: string) {
  //   const url = `${API_USERS_URL}/${userId}`;
  //   return this.http.delete(url);
  // }

  deleteUser(userId: string): Observable<any> {
    console.log("Deleting user with ID:", userId);

    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${API_USERS_URL}/${userId}`, { headers: httpHeaders });
  }

  deleteUserDetails(userId: string): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${API_USERS_URL}/deleteUser`,{userId}, { headers: httpHeaders });
  }
  // UPDATE => PUT: update the user on the server
  updateUser(_user: User): Observable<any> {
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http.patch(`${API_USERS_URL}/${_user._id}`, _user, {
      headers: httpHeaders,
    });
  }

  // CREATE =>  POST: add a new user to the server
  createUser(user: User): Observable<User> {
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http.post<User>(API_USERS_URL, user, { headers: httpHeaders });
  }

  // Method from server should return QueryResultsModel(items: any[], totalsCount: number)
  // items => filtered/sorted result
  findUsers(queryParams: QueryParamsModel): Observable<QueryResultsModel> {
    const httpHeaders = new HttpHeaders();
    console.log("queryParams.filter", queryParams.filter)
    httpHeaders.set("Content-Type", "application/json");

   
    const params = new HttpParams()
    .set('page', queryParams.pageNumber.toString())
    .set('pageSize', queryParams.pageSize.toString())
    .set('filter', queryParams.filter.toString());

    
    
    return this.http.get<User[]>(API_USERS_URL, {params}).pipe(
      mergeMap((res) => {
        const result = this.httpUtils.baseFilter(res, queryParams, []);
        return of(result);
      })
    );
  }

  //Export user data
  export() {
    return this.http.get(API_USERS_URL + `/export/getExportData`, {
      responseType: "blob",
    });
  }

  updateTcData(payload) {
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http.post<any>(API_USERS_URL + `/updateTC`, payload, { headers: httpHeaders });
  }

  // Permission
  getAllPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(API_PERMISSION_URL);
  }

  getRolePermissions(roleId: number): Observable<Permission[]> {
    return this.http.get<Permission[]>(
      API_PERMISSION_URL + "/getRolePermission?=" + roleId
    );
  }

  // Roles
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(API_ROLES_URL);
  }

  getRoleById(roleId: number): Observable<Role> {
    return this.http.get<Role>(API_ROLES_URL + `/${roleId}`);
  }

  // CREATE =>  POST: add a new role to the server
  createRole(role: RoleDbModel[]): Observable<any> {
    // Note: Add headers if needed (tokens/bearer)
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http.post<any>(API_ROLES_URL, role, { headers: httpHeaders });
  }

  // UPDATE => PUT: update the role on the server
  updateRole(roleName: string, permissions: RoleDbModel[]): Observable<any> {
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    const payload = {
      role: roleName,
      permissions,
    };
    return this.http.patch(API_ROLES_URL, payload, { headers: httpHeaders });
  }

  // DELETE => delete the role from the server
  deleteRole(roleName: string): Observable<any> {
    console.log("role name", roleName);
    const url = API_ROLES_URL + "/deleteRole";
    return this.http.post<any>(url, { roleName });
  }

  // Check Role Before deletion
  isRoleAssignedToUsers(roleId: number): Observable<boolean> {
    return this.http.get<boolean>(
      API_ROLES_URL + "/checkIsRollAssignedToUser?roleId=" + roleId
    );
  }

  findRoles(queryParams: QueryParamsModel): Observable<QueryResultsModel> {
    // This code imitates server calls
    const httpHeaders = new HttpHeaders();
    httpHeaders.set("Content-Type", "application/json");
    return this.http
      .get<Role[]>(API_ROLES_URL, {
        params: {
          role: queryParams.filter || "",
          page: String(queryParams.pageNumber),
          pageSize: String(queryParams.pageSize),
        },
      })
      .pipe(
        mergeMap((res) => {
          const result = this.httpUtils.baseFilter(res, queryParams, []);

          return of(result);
        })
      );
  }

  mappedToRoleViewModel(roles): Array<Role> {
    const PERMISSIONS = [
      { key: "canRead", title: "Read" },
      { key: "canCreate", title: "Create" },
      { key: "canUpdate", title: "Update" },
      { key: "canDelete", title: "Delete" },
    ];
    const result: Role[] = [];
    const uniqueRoles = Array.from(new Set(roles.map((item) => item.role)));

    uniqueRoles.forEach((role: string) => {
      const newRole = new Role();
      newRole._id = role;
      newRole.title = role;
      newRole.isCoreRole = role.toLowerCase() === "admin";
      const uniqueApps = Array.from(new Set(roles.map((item) => item.app)));

      newRole.permissions = uniqueApps.map((app: string) => {
        const subModules = roles.filter(
          (item) => item.app === app && item.role === role
        );
        const rootPermission = new Permission();
        rootPermission.id = app;
        rootPermission.title = app;
        rootPermission.name = app;
        rootPermission.level = 0;
        rootPermission.isSelected = true;
        rootPermission.parentId = null;
        rootPermission._children = subModules.map((module) => {
          const moduleData = new Permission();
          moduleData.id = module.subModule;
          moduleData.title = module.subModule;
          moduleData.level = 1;
          moduleData.parentId = app;
          moduleData.isSelected =
            module.canRead ||
            module.canCreate ||
            module.canUpdate ||
            module.canDelete;
          moduleData._children = rootPermission._children = PERMISSIONS.map(
            (perm) => {
              const permData = new Permission();
              permData.id = perm.key;
              permData.title = perm.title;
              permData.parentId = moduleData.id;
              permData.level = 2;
              permData.isSelected = this.mapCrudPermission(module, perm.key);
              permData._children = [];

              return permData;
            }
          );
          return moduleData;
        });
        return rootPermission;
      });

      result.push(newRole);
    });

    return result;
  }

  mapCrudPermission(permissionData: any, key: string) {
    switch (key) {
      case "canRead":
        return permissionData.canRead;
      case "canCreate":
        return permissionData.canCreate;
      case "canUpdate":
        return permissionData.canUpdate;
      case "canDelete":
        return permissionData.canDelete;
    }
  }

  /*
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(result?: any) {
    return (_: any): Observable<any> => {
      // Let the app keep running by returning an empty result.
      return of(result);
    };
  }

  getTCStatus(_id: string): Observable<any> {
    return this.http.get<User>(API_TC_URL + `/${_id}`);
  }

}
