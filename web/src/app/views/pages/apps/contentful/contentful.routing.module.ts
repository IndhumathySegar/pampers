import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ContentfulComponent } from "./contentful.component";
import { ContentfulMigrationComponent } from "./contentful-migration/contentful-migration.component";
import { CRMContentfulMigrationComponent } from "./crm-contentful-migration/crm-contentful-migration.component";
import { MigrationHistoryComponent } from "./migration-history/migration-history.component";
import { CRMMigrationHistoryComponent } from "./crm-migration-history/crm-migration-history.component";
import { TranslateComponent } from "./translate/translate.component";

import { Services } from "app/constents/resources";
import { AppGuard, ModuleGuard } from "app/core/auth";
import { DeeplinksViewComponent } from "./deeplinks-view/deeplinks-view.component";
import { DeeplinksManageComponent } from "./deeplinks-manage/deeplinks-manage.component";
import { NewMarketTranslations } from "./contentful-market-expansion/contentful-market-expansion.component";
import { CreateNewLocaleComponent } from "./create-new-locale/create-new-locale.component";
import { NewLocaleHistory } from "./new-locale-history/new-locale-history.component";
import { ContentTranslationHistory } from "./translate-history/translate-history.component";
import { BulkMigrationsComponent } from "./bulk-migrations/bulk-migrations.component";
import { TranslateAllHistoryComponent } from "./translate-all-history/translate-all-history.component";
import { CrmTranslateComponent } from "./crm-translate/translate.component";
import { CrmContentTranslationHistory } from "./crm-translate-history/translate-history.component";
import { NewMarketTranslationHistory } from "./new-market-translation-history/new-market-translation-history.component";
import { CreateNewRegionComponent } from "./create-new-region/create-new-region.component";
import { NewRegionHistory } from "./new-region-history/new-region-history.component";
import { RollbackHistoryComponent } from "./rollback-history/rollback-history.component";

const commonGuardConfig = {
  canActivate: [AppGuard],
};



const routes: Routes = [
  {
    path: "",
    component: ContentfulComponent,
    canActivate: [ModuleGuard],
    children: [
      {
        path: "",
        redirectTo: "contentful-migration",
        pathMatch: "full",
      },
      {
        path: "contentful-migration",
        component: ContentfulMigrationComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:migration:createMigration"],
        },
      },
      {
        path: "translate",
        component: TranslateComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:translation:createTranslation"],
        },
      },
      {
        path: "market-clone-history",
        component: NewMarketTranslationHistory,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:cloneHistory:cloneHistory"],
        },
      },
      {
        path: "translate-history",
        component: ContentTranslationHistory,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:translationHistory:translationHistory"],
        },
      },
      {
        path: "translate-allhistory",
        component: TranslateAllHistoryComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:translationAllHistory:translationAllHistory"],
        },
      },
      
      {
        path: "migration-history",
        component: MigrationHistoryComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:history:getAllMigrationHistory"],
        },
      },

      {
        path: "crm-migration",
        component: CRMContentfulMigrationComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:migration:createMigration"],
        },
      },
      {
        path: "crm-translate",
        component: CrmTranslateComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:translation:createTranslation"],
        },
      },
      {
        path: "crm-translate-history",
        component: CrmContentTranslationHistory,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:translationHistory:translationHistory"],
        },
      },
      {
        path: "reviewer-translate",
        component: TranslateComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["contentManagement:reviewer:createTranslation"],
        },
      },
      {
        path: "reviewer-translate-history",
        component: ContentTranslationHistory,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["contentManagement:reviewerHistory:reviewerHistory"],
        },
      },
      {
        path: "crm-reviewer-translate",
        component: CrmTranslateComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:reviewer:createTranslation"],
        },
      },
      {
        path: "crm-reviewer-translate-history",
        component: CrmContentTranslationHistory,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:reviewerHistory:reviewerHistory"],
        },
      },
      {
        path: "crm-migration-history",
        component: CRMMigrationHistoryComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["crmManagement:history:getAllMigrationHistory"],
        },
      },
      {
        path: "deeplinks-view",
        component: DeeplinksViewComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:history:getAllMigrationHistory"],
        },
      },
      {
        path: "deeplinks-manage",
        component: DeeplinksManageComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:history:getAllMigrationHistory"],
        },
      },
      {
        path: "market-clone",
        component: NewMarketTranslations,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:createClone:createClone"],
        },
      },
    

      {
        path: "app-contentful-market-expansion",
        component: NewMarketTranslations,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:cloneTranslate:translateOrClone"],
        },
      },
    
      {
        path: "contentful-new-locale",
        component: CreateNewLocaleComponent,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName: Services["contentManagement:createLocale:createLocale"],
        },
      },
      {
        path: "new-locale-history",
        component: NewLocaleHistory,
        canActivate: [AppGuard],
        data: {
          uniqueServiceName:
            Services["contentManagement:localeHistory:getLocaleHistory"],
        },
      },
      {
          path: "contentful-new-region",  
          component: CreateNewRegionComponent,  
          canActivate: [AppGuard],  
          data: {  
            uniqueServiceName: Services["contentManagement:createRegion:createRegion"],  
          },  
      },  
      {  
          path: "new-region-history",  
          component: NewRegionHistory,  
          canActivate: [AppGuard],  
          data: {  
            uniqueServiceName:  
              Services["contentManagement:regionHistory:getRegionHistory"],  
          },  
      },
      {
        path: "rollback-history",
        component: RollbackHistoryComponent,
        ...commonGuardConfig,
        data: {
          uniqueServiceName:
            Services["contentManagement:rollbackHistory:getRollbackHistory"],
        },
      },
      
            // Services["crmManagement:bulkMigration:bulkMigration"],
            {
              path: "crm-bulk-migration",
              component: BulkMigrationsComponent,
              canActivate: [AppGuard],
              data: {
                uniqueServiceName:
                Services["crmManagement:bulkMigration:bulkMigration"],
              },
            },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContentfulRoutingModule {}
