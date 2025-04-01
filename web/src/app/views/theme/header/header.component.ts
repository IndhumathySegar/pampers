// Angular
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from "@angular/router";
// Object-Path
import * as objectPath from "object-path";
// Loading bar
import { LoadingBarService } from "@ngx-loading-bar/core";
// Layout
import {
  LayoutConfigService,
  LayoutRefService,
  MenuConfigService,
} from "../../../core/_base/layout";
// HTML Class Service
import { HtmlClassService } from "../html-class.service";
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { Store } from "@ngrx/store";
import { AppState } from "../../../core/reducers";

@Component({
  selector: "kt-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent
  extends NavBarComponent
  implements OnInit, AfterViewInit
{
  // Public properties
  menuHeaderDisplay: boolean;
  @Output() activeMenu = new EventEmitter<any>();
  fluid: boolean;

  @ViewChild("ktHeader", { static: true }) ktHeader: ElementRef;

  /**
   * Component constructor
   *
   * @param router: Router
   * @param layoutRefService: LayoutRefService
   * @param layoutConfigService: LayoutConfigService
   * @param loader: LoadingBarService
   * @param htmlClassService: HtmlClassService
   */
  constructor(
    public activatedRoute: ActivatedRoute,

    public router: Router,
    private layoutRefService: LayoutRefService,
    public layoutConfigService: LayoutConfigService,
    public loader: LoadingBarService,
    public htmlClassService: HtmlClassService,
    public menuConfigService: MenuConfigService,
    public store: Store<AppState>
  ) {
    super(
      activatedRoute,
      htmlClassService,
      layoutConfigService,
      menuConfigService,
      store,
      router
    );
    // page progress bar percentage
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // set page progress bar loading to start on NavigationStart event router
        this.loader.start();
      }
      if (event instanceof RouteConfigLoadStart) {
        this.loader.increment(35);
      }
      if (event instanceof RouteConfigLoadEnd) {
        this.loader.increment(75);
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        // set page progress bar loading to end on NavigationEnd event router
        this.loader.complete();
      }
    });
  }

  /**
   * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
   */

  /**
   * On init
   */
  ngOnInit(): void {
    const config = this.layoutConfigService.getConfig();

    // get menu header display option
    this.menuHeaderDisplay = objectPath.get(config, "header.menu.self.display");
    // header width fluid
    this.fluid = objectPath.get(config, "header.self.width") === "fluid";

    // animate the header minimize the height on scroll down
    if (
      objectPath.get(config, "header.self.fixed.desktop.enabled") ||
      objectPath.get(config, "header.self.fixed.desktop")
    ) {
      // header minimize on scroll down
      this.ktHeader.nativeElement.setAttribute("data-ktheader-minimize", "1");
    }
  }

  ngAfterViewInit(): void {
    // keep header element in the service
    this.layoutRefService.addElement("header", this.ktHeader.nativeElement);
  }

  getSubMenu($event) {
    this.showSubMenu = $event ? $event.showSubMenu : true;
    this.activeMenu.emit($event);
  }
}
