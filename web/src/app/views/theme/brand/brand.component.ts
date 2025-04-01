// Angular
import { Component, OnInit } from "@angular/core";
// Layout
import {
  LayoutConfigService,
  ToggleOptions,
  MenuHorizontalService,
  MenuConfigService,
} from "../../../core/_base/layout";
import { HtmlClassService } from "../html-class.service";
import { MenuConfig } from "app/core/_config/menu.config";
import { Router, ActivatedRoute } from "@angular/router";
// NGRX
import { Store } from "@ngrx/store";

import { cloneDeep } from "lodash";

import { AppState } from "../../../core/reducers";
import { currentUser } from "../../../core/auth/_selectors/auth.selectors";
import { AuthService } from "../../../core/auth/_services/auth.service";
import { UserLoaded } from "../../../core/auth";

import { Resources } from "../../../constents/resources";

@Component({
  selector: "kt-brand",
  templateUrl: "./brand.component.html",
  styles: [
    `
      .menu-item {
        font-family: Poppins, Helvetica, sans-serif;
        padding: 6px;
        font-size: 16px;
      }
      .menu-item:hover {
        color: #00a6a6;
        cursor: pointer;
      }
      .active-menu {
        border-bottom: 2px solid #00a6a6;
        color: white !important;
        font-weight: bold;
      }
    `,
  ],
})
export class BrandComponent implements OnInit {
  // Public properties
  headerLogo: string;
  headerStickyLogo: string;
  pageUrl = "";
  selectedMenuId = 0;
  toggleOptions: ToggleOptions = {
    target: "body",
    targetState: "kt-aside--minimize",
    togglerState: "kt-aside__brand-aside-toggler--active",
  };
  // userRole: Observable<User[]>;
  role: any;
  showConfigManagement = false;
  permissions: any;
  rolePermissions: any[];
  showCodeGen = false;
  showOperation = false;
  showIdBinding = false;
  showContentManagement = false;
  showFulfilment = false;
  showReconciliation = false;
  showGDPR = false;
  crmManagement = false;
  showCodeSearch = false;
  marketReview = false;

  id = "";

  private menuConfig: MenuConfigService;
  /**
   * Component constructor
   *
   * @param layoutConfigService: LayoutConfigService
   * @param htmlClassService: HtmlClassService
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private menuHorizontalService: MenuHorizontalService,
    private store: Store<AppState>,
    private layoutConfigService: LayoutConfigService,
    public htmlClassService: HtmlClassService,
    private authService: AuthService
  ) {
    this.menuConfig = new MenuConfigService();
  }

  ngOnInit(): void {
    this.store.select(currentUser).subscribe((user) => {
      this.role = user ? user.role : "";
      this.permissions = user ? user.permissions : [];
      this.rolePermissions = user ? user.rolePermissions : [];
      this.id = user ? user._id : "";
    });

    let executeCon = false;
    if (this.id !== "" && this.id) {
      this.authService.getUserById(this.id).subscribe((_user) => {
        if (_user) {
          this.store.dispatch(new UserLoaded({ user: _user }));
          localStorage.setItem("_user", JSON.stringify(_user));
          executeCon = true;
          this.permissions = _user.permissions;
          this.checkAllPermission();
        }
      });
    }

    if (!executeCon) {
      this.checkAllPermission();
    }

    this.headerLogo = this.layoutConfigService.getLogo();
    this.headerStickyLogo = this.layoutConfigService.getStickyLogo();
    this.pageUrl = this.activatedRoute.snapshot["_routerState"].url;
    this.checkURL(this.pageUrl);
  }

  checkURL(pageUrl) {
    if (pageUrl.includes("/contentful")) {
      this.selectedMenuId = 1;
    }
  }

  checkAllPermission() {
    this.showCodeGen = this.checkRole(Resources.codeGeneration);
    this.showOperation = this.checkRole(Resources.operations);
    this.showContentManagement = this.checkRole(Resources.contentManagement);
    this.showFulfilment = this.checkRole(Resources.fulfilment);
    this.showConfigManagement = this.checkRole(Resources.configManagement);
    this.showReconciliation = this.checkRole(Resources.reconciliation);
    this.showGDPR = this.checkRole(Resources.gdpr);
    this.showCodeSearch = this.checkRole(Resources.codeSearch);
    this.crmManagement = this.checkRole(Resources.crmManagement);
    this.marketReview = this.checkRole(Resources.marketReview);
  }

  checkRole(resource): boolean {
    return this.rolePermissions.some(({ uniqueResourceName, subResources }) => {
      return (
        uniqueResourceName === resource &&
        subResources.length > 0 &&
        subResources.some(({ services }) => services.length > 0)
      );
    });
  }

  onMenuSelection(menuId: number) {
    this.selectedMenuId = menuId;
   
     if (menuId === 1) {
      const config = new MenuConfig().getBusinessContentConfigs;
      this.loadConfig(Resources.contentManagement, config);
      this.router.navigate(["contentful"]);
    }
  }

  loadConfig(resource, config) {

    this.menuConfig.loadConfigs(this.loadSubMenus(resource, config));
    this.menuHorizontalService.loadMenu();
  }

  loadConfigWithoutResource(config) {
    this.menuConfig.loadConfigs(config);
    this.menuHorizontalService.loadMenu();
  }

  loadSubMenus(resource, menuConfigs) {

    const subMenus = cloneDeep(menuConfigs);
    const currentResource = this.rolePermissions.find(
      ({ uniqueResourceName }) => uniqueResourceName === resource
    );

    menuConfigs.header.items.forEach(({ uniqueName }, index) => {
      if (
        !currentResource.subResources.some(
          ({ uniqueSubResourceName, services }) =>
            uniqueSubResourceName === uniqueName && services.length > 0
        )
      ) {
        subMenus.header.items[index] = null;
      }
    });

    subMenus.header.items = subMenus.header.items.filter(Boolean);

    return subMenus;
  }
}
