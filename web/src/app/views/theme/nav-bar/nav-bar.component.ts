import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { Store } from "@ngrx/store";
import { HtmlClassService } from "../html-class.service";
import { AppState } from "../../../core/reducers";
import { cloneDeep } from "lodash";
import { MenuConfig } from "../../../core/_config/menu.config";
import {
  LayoutConfigService,
  MenuConfigService,
} from "../../../core/_base/layout";
import { currentUser } from "../../../core/auth";
import { ModulesList } from "./menu";
import { Router, ActivatedRoute } from "@angular/router";

export interface IMenu {
  showSubMenu: boolean;
  menuId: number;
}

@Component({
  selector: "kt-nav-bar",
  templateUrl: "./nav-bar.component.html",
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
        /*background-color: #181824 !important;*/
        border-bottom: 3px solid #00a6a6 !important;
        color: white !important;
        font-weight: bold;
      }
    `,
  ],
})
export class NavBarComponent implements OnInit {
  unsubscribe: Subscription[] = [];
  headerLogo: string;
  headerStickyLogo: string;
  rolePermissions: any = [];
  defaultPages: any = [];
  menuList: Array<any>;
  showSubMenu = true;
  showSubMenuObj: IMenu;
  pageUrl;
  @Output() activeMenu = new EventEmitter<any>();

  constructor(
    public activatedRoute: ActivatedRoute,
    public htmlClassService: HtmlClassService,
    public layoutConfigService: LayoutConfigService,
    public menuConfigService: MenuConfigService,
    public store: Store<AppState>,
    public router: Router
  ) {
    this.menuList = ModulesList;
    this.getPermissions();
  }

  ngOnInit() {
    this.headerLogo = this.layoutConfigService.getLogo();
    this.headerStickyLogo = this.layoutConfigService.getStickyLogo();
    if (this.showSubMenuObj == null || this.showSubMenuObj.menuId === 1) {
      this.showSubMenuObj = {
        menuId: this.menuConfigService.getMenuId(),
        showSubMenu: true,
      };
      this.activeMenu.emit(this.showSubMenuObj);
    }
    this.showHeaders();
    this.defaultNavigation();
  }

  getPermissions() {
    const userSubscription = this.store
      .select(currentUser)
      .subscribe((user) => {
        this.rolePermissions = user ? user.rolePermissions : [];
      });
    this.unsubscribe.push(userSubscription);
  }

  checkBasicPage(url) {
    return (
      !url.includes("user-management") &&
      !url.includes("downloads") &&
      !url.includes("portal-settings")
    );
  }

  defaultNavigation() {
    this.pageUrl = this.activatedRoute.snapshot["_routerState"].url;
    if (!this.checkBasicPage(this.pageUrl)) {
      return;
    }

    const condition =
      // !this.router.url.includes("/contentful/contentful-new-locale") &&
      // !this.router.url.includes("/contentful/new-locale-history") &&
      !this.router.url.includes("/contentful/contentful-market-expansion") &&
      !this.router.url.includes("/contentful/new-market-translation-history");

    let menuId = Number(localStorage.getItem("menuId"));

    menuId = this.router.url.startsWith("/crm") ? 3 : menuId;

    
    menuId = this.router.url.startsWith("/market-review") ? 4 : menuId;
    menuId = this.router.url.startsWith("/admin-panel") ? 5 : menuId;
    menuId =
      // this.router.url.includes("/contentful/contentful-new-locale") ||
      // this.router.url.includes("/contentful/new-locale-history") ||
      this.router.url.includes("/contentful/contentful-market-expansion") ||
      this.router.url.includes("/contentful/new-market-translation-history")
        ? 2
        : menuId;

    menuId =
      this.router.url.startsWith("/contentful") && condition ? 1 : menuId;

    if (menuId >= 1 && menuId <= 6) {
      this.showSubMenu = true;
      this.menuConfigService.saveMenuId(menuId);

      this.showSubMenuObj = { showSubMenu: true, menuId };
      this.activeMenu.emit(this.showSubMenuObj);

    }
  }

  showHeaders() {
    this.menuList.forEach((ele, idx) => {
      if (ele.id === 1) {
        this.menuList[idx].show = this.checkHeaderPermissions(
          new MenuConfig().getBusinessContentConfigs,
          ele.id
        );
      } else if (ele.id === 2) {
        this.menuList[idx].show = this.checkHeaderPermissions(
          new MenuConfig().getBusinessMarketExpansionConfigs,
          ele.id
        );
      } else if (ele.id === 3) {
        this.menuList[idx].show = this.checkHeaderPermissions(new MenuConfig().getCrmModuleConfigs, ele.id);
      } else if (ele.id === 4) {
        this.menuList[idx].show = this.checkHeaderPermissions(new MenuConfig().getMarketReviewConfig, ele.id);
      
      }
      else if (ele.id === 5) {
        this.menuList[idx].show = this.checkHeaderPermissions(new MenuConfig().getAdminPanelConfigs, ele.id);      
      }
    });
  }

  onMenuSelection(menuId: number) {
    this.showSubMenu = true;
    localStorage.setItem("menuId", menuId.toString());
    this.menuConfigService.saveMenuId(menuId);
    this.router.navigate([this.defaultPages[menuId - 1]]);
    this.showSubMenuObj = { showSubMenu: true, menuId };
    this.activeMenu.emit(this.showSubMenuObj);

  }

  checkHeaderPermissions(config, menuId) {
    config.header.items.forEach((ele, idx) => {

      config = this.loadBusinessSubMenus(ele.uniqueName, config, idx);
    });
    config.header.items = config.header.items.filter(Boolean);

    let defaultPage = null;

    if (config.header.items.length !== 0) {
      const firstSubmenu = config.header.items.filter(item=>item.submenu.length>0);

      if (firstSubmenu.length > 0) {
        defaultPage = firstSubmenu[0].submenu[0].page;
      }
    }


    this.defaultPages[menuId - 1] = defaultPage;

    return config.header.items.length !== 0;
  }

  loadBusinessSubMenus(resource, config, idx) {

    const updatedMenus = cloneDeep(config);

    const currentResource = this.rolePermissions.find(
      ({ uniqueResourceName }) => uniqueResourceName === resource
    );
    if (currentResource) {
      config.header.items[idx].submenu.forEach(({ uniqueName }, index) => {
        if (
          !currentResource.subResources.some(
            ({ uniqueSubResourceName, services }) =>
              uniqueSubResourceName === uniqueName && services.length > 0
          )
        ) {
          updatedMenus.header.items[idx].submenu[index] = null;
        }
      });
      updatedMenus.header.items[idx].submenu =
        updatedMenus.header.items[idx].submenu.filter(Boolean);
    } else {
      updatedMenus.header.items[idx] = null;
    }

    return updatedMenus;
  }
}
