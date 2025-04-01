import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { BulkMigrationsComponent } from './bulk-migrations/bulk-migrations.component';
import { FileDragNDropDirective } from '../../../../directives/file-drag-n-drop.directive';
import { StylePaginatorDirective } from '../../../../directives/style-paginator.directive';
import { NewMarketTranslationHistory } from "./new-market-translation-history/new-market-translation-history.component";
import { RollbackHistoryComponent } from './rollback-history/rollback-history.component';

import {
  MatTableModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatChipsModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatPaginatorModule,
  MatTooltipModule,
  MatRadioModule,
  MatDatepickerModule,
  MatSortModule,
} from "@angular/material";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";

import { MatTableExporterModule } from "mat-table-exporter";

import { PartialsModule } from "../../../partials/partials.module";

import { ModuleGuard } from "../../../../core/auth";
import { ContentfulRoutingModule } from "./contentful.routing.module";
import { ContentfulComponent } from "./contentful.component";
import { ContentfulMigrationComponent } from "./contentful-migration/contentful-migration.component";
import { CRMContentfulMigrationComponent } from "./crm-contentful-migration/crm-contentful-migration.component";
import { MigrationHistoryComponent } from "./migration-history/migration-history.component";
import { CRMMigrationHistoryComponent } from "./crm-migration-history/crm-migration-history.component";
import { DownloadsDialogComponent } from "./downloads/downloads.component";
import { DeeplinksViewComponent } from "./deeplinks-view/deeplinks-view.component";
import { DeeplinksManageComponent } from "./deeplinks-manage/deeplinks-manage.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { TranslateComponent } from "./translate/translate.component";
import { TranslateTableComponent } from "./translate/translate-table/translate-table.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { TranslateDialogComponent } from "./translate/confirm-dialog/confirm-dialog.component";
import { NewMarketTranslations } from "./contentful-market-expansion/contentful-market-expansion.component";
import { CreateNewLocaleComponent } from "./create-new-locale/create-new-locale.component";
import { NewLocaleHistory } from "./new-locale-history/new-locale-history.component";
import { ContentTranslationHistory } from "./translate-history/translate-history.component";
import {CKEditorComponent} from "./translate/ckeditor/ck-editor.component"
import { CKEditorModule } from 'ckeditor4-angular';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateAllHistoryComponent } from './translate-all-history/translate-all-history.component';
import { CrmTranslateComponent } from "./crm-translate/translate.component";
import { CrmContentTranslationHistory } from "./crm-translate-history/translate-history.component";
import { CrmTranslateTableComponent } from "./crm-translate/translate-table/translate-table.component";
import { CRMTranslateDialogComponent } from "./crm-translate/confirm-dialog/confirm-dialog.component";
import { CRMCKEditorComponent } from "./crm-translate/ckeditor/ck-editor.component";
import { EditorModule } from '@tinymce/tinymce-angular';
import { CreateNewRegionComponent } from "./create-new-region/create-new-region.component";
import { NewRegionHistory } from "./new-region-history/new-region-history.component";
import { ConfirmRegionMappingDialogComponent } from './confirm-region-mapping/confirm-region-mapping.dialog.component';
import { ConfirmMigrationDialogComponent } from './confirm-migration/confirm-migration.dialog.component';
import { ConfirmRollbackDialogComponent } from './confirm-rollback/confirm-rollback.dialog.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    PartialsModule,
    ContentfulRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({}),
    FormlyMaterialModule,
    FontAwesomeModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableExporterModule,
    MatInputModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    CKEditorModule,
    NgxSpinnerModule,
    MatSortModule,
    MatExpansionModule,
    EditorModule
  ],
  providers: [DatePipe, ModuleGuard],
  entryComponents: [DownloadsDialogComponent, TranslateDialogComponent, CKEditorComponent, CRMTranslateDialogComponent,
    CRMCKEditorComponent, ConfirmRegionMappingDialogComponent, ConfirmMigrationDialogComponent, ConfirmRollbackDialogComponent],
   
  declarations: [
    ContentfulMigrationComponent,
    CRMContentfulMigrationComponent,
    MigrationHistoryComponent,
    CRMMigrationHistoryComponent,
    ContentfulComponent,
    DownloadsDialogComponent,
    DeeplinksViewComponent,
    DeeplinksManageComponent,
    DownloadsDialogComponent,
    TranslateComponent,
    TranslateTableComponent,
    TranslateDialogComponent,
    CKEditorComponent,
    NewMarketTranslations,
    CreateNewLocaleComponent,
    NewLocaleHistory,
    ContentTranslationHistory,
    BulkMigrationsComponent,
    FileDragNDropDirective,
    StylePaginatorDirective,
    TranslateAllHistoryComponent,
    CrmTranslateComponent,
    CrmContentTranslationHistory,
    CrmTranslateTableComponent,
    CRMTranslateDialogComponent,
    CRMCKEditorComponent,
    NewMarketTranslationHistory,
    CreateNewRegionComponent,
    NewRegionHistory,
    ConfirmRegionMappingDialogComponent,
    ConfirmMigrationDialogComponent,
    RollbackHistoryComponent,
    ConfirmRollbackDialogComponent
  ],
})
export class ContentfulModule {}
