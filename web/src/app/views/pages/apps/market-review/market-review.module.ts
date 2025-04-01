import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

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
} from "@angular/material";

import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";

import { MatTableExporterModule } from "mat-table-exporter";

import { PartialsModule } from "../../../partials/partials.module";

import { ModuleGuard } from "../../../../core/auth";

import { MarketReviewRoutingModule } from "./market-review.routing.module";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MarketTranslateComponent } from "./market-translate/market-translate.component";
import { MarketTranslateTableComponent } from "./market-translate/translate-table/market-translate-table.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MarketReviewTranslationHistory } from "./market-translate-history/market-translate-history.component";
import { MarketReviewComponent } from "./market-review.component";
import { TranslateDialogComponent } from "./market-translate/confirm-dialog/confirm-dialog.component";

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    PartialsModule,
    MarketReviewRoutingModule,
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
  ],
  providers: [DatePipe, ModuleGuard],
  entryComponents: [TranslateDialogComponent],
  declarations: [
  
    MarketTranslateComponent,
    MarketTranslateTableComponent,
    MarketReviewComponent,
    TranslateDialogComponent,
  
    MarketReviewTranslationHistory,
  ],
})
export class MarketReviewModule {}
