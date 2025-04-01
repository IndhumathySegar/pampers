// Angular
import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
// RxJS
import { Observable, Subscription } from "rxjs";
// Lodash
import { each, cloneDeep, get } from "lodash";
// NGRX
import { Store, select } from "@ngrx/store";
// State
import { AppState } from "../../../../../../../core/reducers";
// Services and Models
import {
  Role,
  selectLastCreatedRoleId,
  RoleDbModel,
  RoleCreationRequest,
  AuthService,
  Logout,
} from "../../../../../../../core/auth";
import { Permission } from "app/core/auth/_models/permission.model";

import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { AdminPanelService } from "../../../admin-panel.service";

@Component({
  selector: "kt-role-edit-dialog",
  templateUrl: "./role-edit.dialog.component.html",
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RoleEditDialogComponent implements OnInit, OnDestroy {
  // Public properties
  orginalRole: any;
  role: any;
  role$: Observable<Role>;
  hasFormErrors = false;
  viewLoading = false;
  loadingAfterSubmit = false;
  allPermissions: any[];
  rolePermissions: any[] = [];
  distinctRoleNames: string[];
  permission: any;
  safeGet = get;

  // Private properties
  private componentSubscriptions: Subscription[] = [];
  loggedinUser: any;
  displayEmailError: boolean = false;
  editRoleData: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<RoleEditDialogComponent>,
    private readonly store: Store<AppState>,
    private readonly auth: AuthService,
    private adminService: AdminPanelService,
    private readonly cdr: ChangeDetectorRef,

  ) {}

  ngOnInit() {
    this.componentSubscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions;
      })
    );

    this.role = { ...this.data.role };
    this.orginalRole = { ...this.data.role };
    this.distinctRoleNames = this.data.distinctRoleNames;
    this.allPermissions = this.initPermissions(
      cloneDeep(this.data.role),
      cloneDeep(this.data.allPermissions),
      true
    );
    console.log("alll", this.allPermissions);
    this.loadPermissions();
  }

  ngOnDestroy() {
    if (this.componentSubscriptions) {
      this.componentSubscriptions.forEach((subscription) =>
        subscription.unsubscribe()
      );
    }
  }

  loadPermissions() {
    this.rolePermissions = cloneDeep(this.allPermissions);
  }

  preparePermissionIds(): number[] {
    const result = [];
    each(this.rolePermissions, (_root: Permission) => {
      if (_root.isSelected) {
        result.push(_root.id);
        each(_root._children, (_child: Permission) => {
          if (_child.isSelected) {
            result.push(_child.id);
          }
        });
      }
    });
    return result;
  }

  prepareRoles(permissions: Permission[], role: Role): RoleDbModel[] {
    let _results: RoleDbModel[] = [];
    permissions.forEach((app) => {
      app._children.forEach((subModule) => {
        const crudPermissions = subModule._children.map((item) => item);
        const _role = new RoleDbModel();
        if (role._id) {
          _role._id = subModule.id;
        }
        _role.app = app.name;
        _role.subModule = subModule.name;
        _role.frontModule = subModule.frontModule;
        _role.role = role.title;
        _role.canRead = crudPermissions.find(
          (perm) => perm.name === "read"
        ).isSelected;
        _role.canCreate = crudPermissions.find(
          (perm) => perm.name === "create"
        ).isSelected;
        _role.canUpdate = crudPermissions.find(
          (perm) => perm.name === "update"
        ).isSelected;
        _role.canDelete = crudPermissions.find(
          (perm) => perm.name === "delete"
        ).isSelected;
        _results.push(_role);
      });
    });

    return _results;
  }

  onSubmit() {
    this.hasFormErrors = false;
    this.loadingAfterSubmit = false;
    /** check form */
    if (!this.isTitleValid()) {
      this.hasFormErrors = true;
      return;
    }

    const permissions = this.sanitizePermission(
      cloneDeep(this.rolePermissions)
    );

    this.role = {
      ...this.role,
      permissions,
    };

    this.createRole(this.role);
  }

  private sanitizePermission(permission) {
    permission.forEach((resource) => {
      Object.keys(resource).forEach((resourceKey) => {
        if (
          ["uniqueResourceName", "subResources", "displayResourceName"].indexOf(resourceKey) === -1
        ) {
          delete resource[resourceKey];
        }
      });

      // sanitize subResources
      resource.subResources.forEach((subResource, srIndex) => {
        Object.keys(subResource).forEach((subResourceKey) => {
          if (
            ["uniqueSubResourceName", "services", "redirectURI", "displaySubResourceName"].indexOf(
              subResourceKey
            ) === -1
          ) {
            delete subResource[subResourceKey];
          }
        });

        // sanitize services
        subResource.services = subResource.services.filter(
          ({ isSelected }) => isSelected
        );
        subResource.services.forEach((service) => {
          Object.keys(service).forEach((serviceKey) => {
            if (["uniqueServiceName", "displayServiceName"].indexOf(serviceKey) === -1) {
              delete service[serviceKey];
           }
          });
        });

        if (subResource.services.length === 0) {
          resource.subResources[srIndex] = null;
        }
      });

      resource.subResources = resource.subResources.filter(Boolean);
    });

    permission = permission.filter(
      ({ subResources }) => subResources.length > 0
    );

    return permission;
  }

  private createRole(_role: RoleDbModel[]) {
    let tempRole: any = _role;
    this.loadingAfterSubmit = true;
    this.viewLoading = true;
    this.store.dispatch(new RoleCreationRequest({ roles: _role }));
    this.componentSubscriptions.push(
      this.store.pipe(select(selectLastCreatedRoleId)).subscribe(() => {
        this.viewLoading = false;
        let loggedInData = localStorage.getItem("_user")
        this.loggedinUser = JSON.parse(loggedInData);
        let userPermissions = this.loggedinUser.rolePermissions;
        let permissionsData = tempRole.permissions;

        const isUpdatePermission = !userPermissions.some(resource => 
          resource.uniqueResourceName === permissionsData.uniqueResourceName &&
          resource.subResources.length === permissionsData.subResources.length &&
          resource.subResources.every(userSubResource =>
            permissionsData.subResources.some(permissionSubResource =>
              userSubResource.uniqueSubResourceName === permissionSubResource.uniqueSubResourceName &&
              userSubResource.services.length === permissionSubResource.services.length &&
              userSubResource.services.every(userService =>
                permissionSubResource.services.some(permissionService =>
                  userService.uniqueServiceName === permissionService.uniqueServiceName
                )
              )
            )
          )
        );

        if(this.loggedinUser.role == tempRole.name && isUpdatePermission){
          this.logoutWeb();
        }else{
          this.dialogRef.close({
            _role,
            isEdit: false,
          });
        }       
      })
    );
  }

  private initPermissions({ permissions }, allPermissions, isInit) {
    permissions.forEach((resource) => {
      const allPermissionResourceIndex = allPermissions.findIndex(
        ({ uniqueResourceName }) =>
          uniqueResourceName === resource.uniqueResourceName
      );

      resource.subResources.forEach((subResource) => {
        const allPermissionSubResourceIndex = allPermissions[
          allPermissionResourceIndex
        ]["subResources"].findIndex(
          ({ uniqueSubResourceName }) =>
            uniqueSubResourceName === subResource.uniqueSubResourceName
        );

        subResource.services.forEach((service) => {
          const allPermissionServiceIndex = allPermissions[
            allPermissionResourceIndex
          ]["subResources"][allPermissionSubResourceIndex][
            "services"
          ].findIndex(
            ({ uniqueServiceName }) =>
              uniqueServiceName === service.uniqueServiceName
          );
          const newService =
            allPermissions[allPermissionResourceIndex]["subResources"][
              allPermissionSubResourceIndex
            ]["services"][allPermissionServiceIndex];

          if (!newService.hasOwnProperty("isSelected")) {
            newService.isSelected = isInit ? service.isSelected : false;
          }
        });

        allPermissions[allPermissionResourceIndex]["subResources"][
          allPermissionSubResourceIndex
        ].isSelected = allPermissions[allPermissionResourceIndex][
          "subResources"
        ][allPermissionSubResourceIndex]["services"].every(
          ({ isSelected = false }) => isSelected
        );
      });
      allPermissions[allPermissionResourceIndex].isSelected = allPermissions[
        allPermissionResourceIndex
      ]["subResources"].every(({ isSelected = false }) => isSelected);
    });

    return allPermissions;
  }

  async isSelectedChanged({ checked }, resource, level) {
    resource.isSelected = checked;
    if (level === 1) {
      resource.subResources.forEach((subResource) => {
        subResource.isSelected = checked;
        subResource.services.forEach((service) => {
          service.isSelected = checked;
        });
      });
    } else if (level === 2) {
      resource.services.forEach((service) => {
        service.isSelected = checked;
      });
    }

    this.rolePermissions = this.initPermissions(
      { permissions: this.allPermissions },
      this.rolePermissions,
      false
    );
  }

  getTitle(): string {
    if (this.role && this.role._id) {
      this.editRoleData = true;
      return `Edit role '${this.role.name}'`;
    }
    this.editRoleData = false;
    return "New role";
  }

  get roleNameExists(): boolean {
    return (
      this.orginalRole.name !== this.role.name &&
      this.distinctRoleNames.filter(
        (item) => item.toLowerCase() === this.role.name
      ).length > 0
    );
  }

  roleExists(event){
    this.checkRole(event.target.value);
  }

  checkRole(role) {
    const emailModel = this.adminService
      .checkRoleExist({role: role})
      .subscribe(
        (res: any) => {
         if(res.status === "Role already exists"){
          this.displayEmailError = true;
          this.cdr.detectChanges();
         }else{
          this.displayEmailError = false;
          this.cdr.detectChanges();
         }
        },
        (error) => {}
      )
      .add(() => {
        emailModel.unsubscribe();
      });
  }
  isTitleValid(): boolean {
    return true;
  }
  logoutWeb() {
    this.auth.logout()
      .subscribe(
        () => {
          this.store.dispatch(new Logout())
        }
      ).add(() => {
        localStorage.clear();
        window.location.reload();
      })
  }
}
