import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule, AbstractControl } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
// NGRX
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
// Translate
import { TranslateModule } from "@ngx-translate/core";


import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

import { MatTableExporterModule } from "mat-table-exporter";

import { PartialsModule } from "../../../partials/partials.module";

import { AdminPanelRoutingModule } from "./admin-panel.routing.module";
import { AdminPanelComponent } from "./admin-panel.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

import { CKEditorModule } from 'ckeditor4-angular';
import { AuditTrailHistoryComponent } from './audit-trail-history/audit-trail-history.component';
import { NgxSpinnerModule } from 'ngx-spinner';
// Services
import {
  HttpUtilsService,
  TypesUtilsService,
  InterceptService,
  LayoutUtilsService,
} from "../../../../core/_base/crud";
// Shared
import {
  ActionNotificationComponent,
  DeleteEntityDialogComponent,
  FetchEntityDialogComponent,
  PasswordEntityDialogComponent
} from "../../../partials/content/crud";
// Components
import { UsersListComponent } from "./user-management/users/users-list/users-list.component";
import { RolesListComponent } from "./user-management/roles/roles-list/roles-list.component";
import { RoleEditDialogComponent } from "./user-management/roles/role-edit/role-edit.dialog.component";
// Material
import {
  MatInputModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSortModule,
  MatTableModule,
  MatSelectModule,
  MatChipsModule,
  MatMenuModule,
  MatProgressBarModule,
  MatButtonModule,
  MatCheckboxModule,
  MatDialogModule,
  MatTabsModule,
  MatNativeDateModule,
  MatCardModule,
  MatRadioModule,
  MatIconModule,
  MatDatepickerModule,
  MatExpansionModule,
  MatAutocompleteModule,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatSnackBarModule,
  MatTooltipModule,
} from "@angular/material";
import {
  usersReducer,
  UserEffects,
  ModuleGuard,
} from "../../../../core/auth";

import { UserEditDialogComponent } from "./user-management/users/user-edit/user-edit.dialog.component";
import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";


export function strongPasswordValidator(control: AbstractControl) {
  if (!control.value) {
    // if control is empty return no error
    return null;
  }
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.{8,})/;
  if (strongRegex.test(control.value)) {
    return null;
  }

  return {
    strongPasswordMatch: {
      message:
        "Password must be atleast 8 chracters long, must have at least 1 small case, 1 capital case and 1 number",
    },
  };
}
export function fieldMatchValidator(control: AbstractControl) {
  const { password, passwordConfirm } = control.value;

  // avoid displaying the message error when values are empty
  if (!passwordConfirm || !password) {
    return null;
  }

  if (passwordConfirm === password) {
    return null;
  }

  return { fieldMatch: { message: "Password Not Matching" } };
}
export function minlengthValidationMessage(err, field) {
  return `Must be at least ${field.templateOptions.minLength} characters!`;
}
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    PartialsModule,
    AdminPanelRoutingModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatSortModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTabsModule,
    MatSnackBarModule,
    MatExpansionModule,
    NgxSpinnerModule,
    StoreModule.forFeature("users", usersReducer),
    EffectsModule.forFeature([UserEffects]),
    TranslateModule.forChild(),
    FormlyModule.forRoot({
      validationMessages: [
        { name: "minlength", message: minlengthValidationMessage },
      ],
      validators: [
        { name: "fieldMatch", validation: fieldMatchValidator },
        { name: "strongPasswordMatch", validation: strongPasswordValidator },
      ],
    }),
  ],
  providers: [    InterceptService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptService,
      multi: true,
    },
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true,
        panelClass: "kt-mat-dialog-container__wrapper",
        height: "auto",
        width: "900px",
      },
    },
    HttpUtilsService,
    TypesUtilsService,
    LayoutUtilsService,
    DatePipe, 
    ModuleGuard],
  entryComponents: [
    ActionNotificationComponent,
    DeleteEntityDialogComponent,
    UserEditDialogComponent,
    RoleEditDialogComponent,
    FetchEntityDialogComponent,
    PasswordEntityDialogComponent
  ],
  declarations: [
    AdminPanelComponent,
    AuditTrailHistoryComponent,
    // UserManagementComponent,
    UsersListComponent,
    UserEditDialogComponent,
    RolesListComponent,
    RoleEditDialogComponent,
    
  ],
})
export class AdminPanelModule {}
