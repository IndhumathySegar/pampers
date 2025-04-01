// Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Angular Material
import { MatButtonModule, MatProgressBarModule, MatTabsModule, MatTooltipModule } from '@angular/material';
// NgBootstrap
import { NgbDropdownModule, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
// Translation
import { TranslateModule } from '@ngx-translate/core';
// Loading bar
import { LoadingBarModule } from '@ngx-loading-bar/core';
// NGRX
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// Ngx DatePicker
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
// Perfect Scrollbar
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
// SVG inline
import { InlineSVGModule } from 'ng-inline-svg';
// Core Module
import { CoreModule } from '../../core/core.module';
import { HeaderComponent } from './header/header.component';
import { AsideLeftComponent } from './aside/aside-left.component';
import { FooterComponent } from './footer/footer.component';
import { BrandComponent } from './brand/brand.component';
import { TopbarComponent } from './header/topbar/topbar.component';
import { MenuHorizontalComponent } from './header/menu-horizontal/menu-horizontal.component';
import { PartialsModule } from '../partials/partials.module';
import { BaseComponent } from './base/base.component';
import { PagesModule } from '../pages/pages.module';
import { HtmlClassService } from './html-class.service';
import { HeaderMobileComponent } from './header/header-mobile/header-mobile.component';
import { ErrorPageComponent } from './content/error-page/error-page.component';
import { RoleEffects, rolesReducer } from '../../core/auth';
import { PageNotFoundComponent } from './content/page-not-found/page-not-found.component';
import {NavBarComponent} from "./nav-bar/nav-bar.component";
import {MatCardModule} from "@angular/material/card";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { NgxSpinnerModule } from 'ngx-spinner';
@NgModule({
	declarations: [
		BaseComponent,
		FooterComponent,

		// headers
		HeaderComponent,
		NavBarComponent,
		BrandComponent,
		HeaderMobileComponent,

		// topbar components
		TopbarComponent,

		// aside left menu components
		AsideLeftComponent,

		// horizontal menu components
		MenuHorizontalComponent,

		ErrorPageComponent,
		PageNotFoundComponent
	],
	exports: [
		BaseComponent,
		FooterComponent,

		// headers
		HeaderComponent,
		NavBarComponent,
		BrandComponent,
		HeaderMobileComponent,

		// topbar components
		TopbarComponent,

		// aside left menu components
		AsideLeftComponent,

		// horizontal menu components
		MenuHorizontalComponent,

		ErrorPageComponent,
		PageNotFoundComponent
	],
	providers: [
		HtmlClassService,
	],
  imports: [
    CommonModule,
    RouterModule,
    StoreModule.forFeature('roles', rolesReducer),
    // StoreModule.forFeature('permissions', permissionsReducer),
    EffectsModule.forFeature([RoleEffects]),
    // EffectsModule.forFeature([PermissionEffects, RoleEffects]),
    PagesModule,
    PartialsModule,
    CoreModule,
    PerfectScrollbarModule,
    FormsModule,
    MatProgressBarModule,
    MatTabsModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule.forChild(),
    LoadingBarModule,
    NgxDaterangepickerMd,
	NgxSpinnerModule,
    InlineSVGModule,

    // ng-bootstrap modules
    NgbDropdownModule,
    NgbProgressbarModule,
    NgbTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ]
})
export class ThemeModule {
}
