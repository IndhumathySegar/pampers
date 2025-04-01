import { Subscription } from "rxjs";
// Angular
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
// Layout
import {
  LayoutConfigService,
  SplashScreenService,
  TranslationService,
} from "./core/_base/layout";
// language list
import { locale as enLang } from "./core/_config/i18n/en";

import { environment } from "@env/environment";

import { InactivityService } from "./core/auth";

@Component({
  // tslint:disable-next-line:component-selector
  selector: "body[kt-root]",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  interval = 0;
  returnUrl = "";
  loader: boolean;
  private unsubscribe: Subscription[] = [];

  constructor(
    private readonly translationService: TranslationService,
    private readonly router: Router,
    private readonly inactivityService: InactivityService,
    private readonly layoutConfigService: LayoutConfigService,
    private readonly splashScreenService: SplashScreenService
  ) {
    this.interval = this.inactivityService.interval;
  }

  ngOnInit(): void {
    // register translations
    this.translationService.loadTranslations(enLang);
    const routerEventSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.returnUrl = event.url;
        this.inactivityService.init();
        this.inactivityService
          .timeOutAsObservable()
          .subscribe((timeOut: boolean) => {
            if (timeOut) {
              this.inactivityService.killTimer();
              this.inactivityService.removeEvents();
              localStorage.removeItem(environment.authTokenKey);
              localStorage.removeItem("_user");
              this.router.navigate(["/auth/login"]);
            }
          });
      }
    });
    this.unsubscribe.push(routerEventSubscription);

    console.groupCollapsed("%c Environment", "color:blue; font-size:12px");
    console.log(environment);
    console.groupEnd();

    // enable/disable loader
    this.loader = this.layoutConfigService.getConfig("loader.enabled");

    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // hide splash screen
        this.splashScreenService.hide();

        // scroll to top on every route change
        window.scrollTo(0, 0);

        // to display back the body content
        setTimeout(() => {
          document.body.classList.add("kt-page--loaded");
        }, 500);
      }
    });
    this.unsubscribe.push(routerSubscription);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
