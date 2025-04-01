import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminPanelComponent } from "./admin-panel.component";


import { Services } from "app/constents/resources";
import { AppGuard, ModuleGuard } from "app/core/auth";
import { AuditTrailHistoryComponent } from "./audit-trail-history/audit-trail-history.component";
import { UsersListComponent } from "./user-management/users/users-list/users-list.component";
import { RolesListComponent } from "./user-management/roles/roles-list/roles-list.component";


const commonGuardConfig = {
  canActivate: [AppGuard],
};



const routes: Routes = [
  {
    path: "",
    component: AdminPanelComponent,
    canActivate: [ModuleGuard],
    children: [
      {
        path: "",
        redirectTo: "admin-panel",
        pathMatch: "full",
      },
      {
        path: "audit-trail-history",
        component: AuditTrailHistoryComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["adminPanel:auditTrail:auditTrail"],
        },
      },
      {
        path: "users",
        component: UsersListComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["adminPanel:users:getAllUsers"],
        },
      },
      {
        path: "roles",
        component: RolesListComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["adminPanel:roles:getAllRoles"],
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminPanelRoutingModule {}
