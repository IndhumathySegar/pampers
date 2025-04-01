// Angular
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
// RXJS
import { Subscription } from "rxjs";
// Layout
import { LayoutConfigService } from "../../../../core/_base/layout";
import { Store } from "@ngrx/store";

import { AppState } from "../../../../core/reducers";
@Component({
  selector: "kt-error-page",
  templateUrl: "./page-not-found.component.html",
  styleUrls: ["./page-not-found.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  accessUrl = "";
  // Public properties
  // type of error template to be used, accepted values; error-v1 | error-v2 | error-v3 | error-v4 | error-v5 | error-v6
  @Input() type = "error-v1";
  // full background image
  @Input() image: string;
  // error code, some error types template has it
  @Input() code = "404";
  // error title
  @Input() title: string;
  // error subtitle, some error types template has it
  @Input() subtitle: string;
  // error descriptions
  @Input() desc = "Oops! Something went wrong!";
  // return back button title
  @Input() return = "Return back";

  private sub: Subscription;

  public user: any = {};

  /**
   * Component constructor
   *
   * @param route: ActivatedRoute
   * @param layoutConfigService: LayoutConfigService
   */
  constructor(
    private route: ActivatedRoute,
    private layoutConfigService: LayoutConfigService,
    public router: Router,
    public store: Store<AppState>
  ) {
    // set temporary values to the layout config on this page
    this.layoutConfigService.setConfig({ self: { layout: "blank" } });
    this.accessUrl = localStorage.getItem("access-url");
  }

  /**
   * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
   */

  /**
   * On init
   */
  ngOnInit() {
    this.type = this.route.snapshot.paramMap.get("type");
    this.sub = this.route.data.subscribe((param) => {
      if (param.type) {
        this.type = param.type;
      }
      if (param.image) {
        this.image = param.image;
      }
      if (param.code) {
        this.code = param.code;
      }
      if (param.title) {
        this.title = param.title;
      }
      if (param.subtitle) {
        this.subtitle = param.subtitle;
      }
      if (param.desc) {
        this.desc = param.desc;
      }
      if (param.return) {
        this.return = param.return;
      }
    });
    this.findImage();
  }

  firstCase() {
    if (!this.image) {
      this.image = "./assets/media/error/bg1.jpg";
    }
    if (!this.code) {
      this.code = "404";
    }
    if (!this.desc) {
      this.desc = "OOPS! Something went wrong here";
    }
  }

  secondCase() {
    if (!this.image) {
      this.image = "./assets/media/error/bg2.jpg";
    }
    if (!this.code) {
      this.code = "404";
    }
    if (!this.title) {
      this.title = "OOPS!";
    }
    if (!this.desc) {
      this.desc = "Something went wrong here";
    }
  }

  thirdCase() {
    if (!this.code) {
      this.code = "404";
    }
    if (!this.title) {
      this.title = "How did you get here";
    }
    if (!this.subtitle) {
      this.subtitle =
        "Sorry we can't seem to find the page you're looking for.";
    }
    if (!this.desc) {
      this.desc =
        "There may be amisspelling in the URL entered,<br>" +
        "or the page you are looking for may no longer exist.";
    }
    if (!this.image) {
      this.image = "./assets/media/error/bg3.jpg";
    }
  }

  fourthCase() {
    if (!this.title) {
      this.title = "Oops!";
    }
    if (!this.subtitle) {
      this.subtitle = "Something went wrong here";
    }
    if (!this.desc) {
      this.desc =
        "We're working on it and we'll get it fixed<br>" +
        "as soon possible.<br>" +
        "You can back or use our Help Center.";
    }
    if (!this.image) {
      this.image = "./assets/media/error/bg5.jpg";
    }
  }

  fifthCase() {
    if (!this.title) {
      this.title = "Oops...";
    }
    if (!this.desc) {
      this.desc =
        "Looks like something went wrong.<br>" + "We're working on it";
    }
    if (!this.image) {
      this.image = "./assets/media/error/bg6.jpg";
    }
  }

  findImage() {
    switch (this.type) {
      case "error-v1":
        this.firstCase();
        break;
      case "error-v2":
        this.secondCase();
        break;
      case "error-v3":
        break;
      case "error-v4":
        this.thirdCase();
        break;
      case "error-v5":
        this.fourthCase();
        break;
      case "error-v6":
        this.fifthCase();
        break;
      default:
        if (!this.image) {
          this.image = "./assets/media/error/bg1.jpg";
        }
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // reset config from any temporary values
    this.layoutConfigService.reloadConfigs();
    this.sub.unsubscribe();
  }

  redirect() {
    this.router.navigateByUrl(this.user.landingPage);
  }
}
