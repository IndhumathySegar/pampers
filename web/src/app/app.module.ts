// Angular
import {
  BrowserModule,
  HAMMER_GESTURE_CONFIG,
} from "@angular/platform-browser";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  GestureConfig,
  MatProgressSpinnerModule,
  MatTabsModule,
  MatRadioModule,
} from "@angular/material";
import { OverlayModule } from "@angular/cdk/overlay";
import { ScrollingModule } from "@angular/cdk/scrolling";
// Perfect Scroll bar
import {
  PERFECT_SCROLLBAR_CONFIG,
  PerfectScrollbarConfigInterface,
} from "ngx-perfect-scrollbar";

// SVG inline
import { InlineSVGModule } from "ng-inline-svg";
// Hammer JS
import "hammerjs";
// NGX Permissions
// NGRX
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { StoreRouterConnectingModule } from "@ngrx/router-store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
// State
import { metaReducers, reducers } from "./core/reducers";
// Copmponents
import { AppComponent } from "./app.component";
// Modules
import { AppRoutingModule } from "./app-routing.module";
import { CoreModule } from "./core/core.module";
import { ThemeModule } from "./views/theme/theme.module";

// Partials
import { PartialsModule } from "./views/partials/partials.module";
// Layout Services
import {
  DataTableService,
  KtDialogService,
  LayoutConfigService,
  LayoutRefService,
  MenuAsideService,
  MenuConfigService,
  MenuHorizontalService,
  PageConfigService,
  SplashScreenService,
  SubheaderService,
} from "./core/_base/layout";

// Auth
import { AuthModule } from "./views/pages/auth/auth.module";
import { AuthService } from "./core/auth";
// CRUD
import {
  HttpUtilsService,
  LayoutUtilsService,
  TypesUtilsService,
} from "./core/_base/crud";
// Config
import { LayoutConfig } from "./core/_config/layout.config";
// Highlight JS
import { HIGHLIGHT_OPTIONS, HighlightLanguage } from "ngx-highlightjs";
import * as typescript from "highlight.js/lib/languages/typescript";
import * as scss from "highlight.js/lib/languages/scss";
import * as xml from "highlight.js/lib/languages/xml";
import * as json from "highlight.js/lib/languages/json";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { FormlyModule, FormlyFieldConfig } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";

import { FormlyFieldTabsetComponent } from "./components/mat-tabs/types/tabset";
import { GenAiTcDialogComponent } from "./components/gen-ai-tc/gen-ai-tc.dialog.component";

import { ToastrModule } from "ngx-toastr";
//cookie
import { CookieService } from "ngx-cookie-service";

// tslint:disable-next-line:class-name
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  wheelSpeed: 0.5,
  swipeEasing: true,
  minScrollbarLength: 40,
  maxScrollbarLength: 300,
};

export function initializeLayoutConfig(appConfig: LayoutConfigService) {
  // initialize app by loading default demo layout config
  return () => {
    if (appConfig.getConfig() === null) {
      appConfig.loadConfigs(new LayoutConfig().configs);
    }
  };
}

export function hljsLanguages(): HighlightLanguage[] {
  return [
    { name: "typescript", func: typescript },
    { name: "scss", func: scss },
    { name: "xml", func: xml },
    { name: "json", func: json },
  ];
}

export function validateRequired(err, field: FormlyFieldConfig) {
  return `This field is required`;
}

@NgModule({
  entryComponents: [GenAiTcDialogComponent],
  declarations: [AppComponent, FormlyFieldTabsetComponent, GenAiTcDialogComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    PartialsModule,
    CoreModule,
    OverlayModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot({ stateKey: "router" }),
    StoreDevtoolsModule.instrument(),
    AuthModule.forRoot(),
    TranslateModule.forRoot(),
    MatTabsModule,
    MatProgressSpinnerModule,
    InlineSVGModule.forRoot(),
    ThemeModule,
    ReactiveFormsModule,
    ScrollingModule,
    MatRadioModule,
    FormlyModule.forRoot({
      types: [
        {
          name: "tabset",
          component: FormlyFieldTabsetComponent,
        },
      ],
      validators: [{ name: "required", validation: Validators.required }],
      validationMessages: [
        { name: "required", message: validateRequired },
        { name: "email", message: "email is invalid" },
      ],
    }),
    FormlyMaterialModule,
    ToastrModule.forRoot(),
  ],
  exports: [],
  providers: [
    AuthService,
    LayoutConfigService,
    LayoutRefService,
    MenuConfigService,
    PageConfigService,
    KtDialogService,
    DataTableService,
    CookieService,
    SplashScreenService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: GestureConfig,
    },
    {
      // layout config initializer
      provide: APP_INITIALIZER,
      useFactory: initializeLayoutConfig,
      deps: [LayoutConfigService],
      multi: true,
    },
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: { languages: hljsLanguages },
    },
    // template services
    SubheaderService,
    MenuHorizontalService,
    MenuAsideService,
    HttpUtilsService,
    TypesUtilsService,
    LayoutUtilsService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
