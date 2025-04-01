// Angular
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
// Components
import { BaseComponent } from "./views/theme/base/base.component";
import { ErrorPageComponent } from "./views/theme/content/error-page/error-page.component";
// Auth
import { AuthGuard } from "./core/auth";
import { PageNotFoundComponent } from "./views/theme/content/page-not-found/page-not-found.component";

import { ParentRoute } from "app/constents/resources";

const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("app/views/pages/auth/auth.module").then((m) => m.AuthModule),
  }, 

  {
    path: ParentRoute.contentManagement,
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        loadChildren: () =>
          import("../app/views/pages/apps/contentful/contentful.module").then(
            (m) => m.ContentfulModule
          ),
      },
    ],
  },


  {
    path: ParentRoute.marketReview,
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        loadChildren: () =>
          import("../app/views/pages/apps/market-review/market-review.module").then(
            (m) => m.MarketReviewModule
          ),
      },
    ],
  },

  {
    path: ParentRoute.crmManagement,
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        loadChildren: () =>
          import("../app/views/pages/apps/contentful/contentful.module").then(
            (m) => m.ContentfulModule
          ),
      },
    ],
  },

  {
    path: ParentRoute.adminPanelAudit,
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: "",
        loadChildren: () =>
          import("../app/views/pages/apps/admin-panel/admin-panel.module").then(
            (m) => m.AdminPanelModule
          ),
      },
    ],
  },
  
  {
    path: "error/403",
    component: BaseComponent,
    children: [
      {
        path: "",
        component: ErrorPageComponent,
        data: {
          type: "error-v6",
          code: 403,
          title: "403... Access forbidden",
          desc: "Looks like you don't have permission to access for requested page.<br> Please, contact administrator",
        },
      },
    ],
  },
  { path: "error/:type", component: PageNotFoundComponent },
  { path: "", redirectTo: ParentRoute.contentManagement, pathMatch: "full" },
  { path: "**", redirectTo: "error/400", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
