import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { MarketTranslateComponent } from "./market-translate/market-translate.component";

import { Services } from "app/constents/resources";
import { AppGuard, ModuleGuard } from "app/core/auth";

import { MarketReviewTranslationHistory } from "./market-translate-history/market-translate-history.component";
import { MarketReviewComponent } from "./market-review.component";

const routes: Routes = [
  {
    path: "",
    component: MarketReviewComponent,
    canActivate: [ModuleGuard],
    children: [
      {
        path: "",
        redirectTo: "market-review-translate",
        pathMatch: "full",
      },
      {
        path: "market-review-translate",
        component: MarketTranslateComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
          Services["marketManagement:translation:createTranslation"],        },
      },
      {
        path: "market-review-translate-history",
        component: MarketReviewTranslationHistory,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["marketManagement:translationHistory:translationHistory"],
        },
      },
     
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketReviewRoutingModule {}
