import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ConfigManagementRoutingModule} from './config-management-routing.module';
import {ConfigManagementComponent} from './config-management.component';
import {ConfigUpdateComponent} from './config-update/config-update.component';
import {PortletModule} from '../../../partials/content/general/portlet/portlet.module';
import {ConfigHistoryComponent} from './config-history/config-history.component';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatTableModule} from '@angular/material/table';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { ConfirmDialogueComponent } from './confirm-dialogue/confirm-dialogue.component';
import { ConfigTableComponent } from './config-update/config-table/config-table.component';
import {MatSortModule} from '@angular/material/sort';
import { FlexLayoutModule } from '@angular/flex-layout';
import {MatCardModule} from '@angular/material/card';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ConfigCloneComponent } from './config-clone/config-clone.component';
import {MatListModule} from '@angular/material/list';
import { ConfigKeyTableComponent } from './config-clone/config-key-table/config-key-table.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTabsModule} from '@angular/material/tabs';


@NgModule({
  declarations: [
    ConfigManagementComponent,
    ConfigUpdateComponent,
    ConfigHistoryComponent,
    ConfirmDialogueComponent,
    ConfigTableComponent,
    ConfigCloneComponent,
    ConfigKeyTableComponent,
  ],
  imports: [
    CommonModule,
    ConfigManagementRoutingModule,
    PortletModule,
    MatSelectModule,
    MatIconModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatSortModule,
    FlexLayoutModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
  exports: [
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatCardModule,
  ],
  entryComponents: [ConfirmDialogueComponent, ]
})
export class ConfigManagementModule {
}
