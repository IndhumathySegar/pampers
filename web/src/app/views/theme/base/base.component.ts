// Angular
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
// RxJS
import { Subscription } from 'rxjs';
// Object-Path
import * as objectPath from 'object-path';
// Layout
import {
  LayoutConfigService,
  MenuConfigService,
  PageConfigService,
  MenuHorizontalService,
} from '../../../core/_base/layout';
import { HtmlClassService } from '../html-class.service';
import { LayoutConfig } from '../../../core/_config/layout.config';
import { MenuConfig } from '../../../core/_config/menu.config';
import { PageConfig } from '../../../core/_config/page.config';
// User permissions
// import { NgxPermissionsService } from 'ngx-permissions';
// import { currentUserPermissions, Permission } from '../../../core/auth';
import { currentUser } from '../../../core/auth/_selectors/auth.selectors';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/reducers';
import {ActivatedRoute, Router} from '@angular/router';
import {cloneDeep} from 'lodash';

import { Resources } from '../../../constents/resources';
import {NavBarComponent} from "../nav-bar/nav-bar.component";

@Component({
  selector: 'kt-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BaseComponent extends NavBarComponent implements OnInit, OnDestroy {
  // Public variables
  selfLayout: string;
  asideDisplay: boolean;
  asideSecondary: boolean;
  subheaderDisplay: boolean;
  fluid: boolean;
  loading = false;
  pageUrl: string;
  // permission
  permission: any = [];
  rolePermissions: any = [];

  userInformation: any = {};
  menuId: number;

  // Private properties
  unsubscribe: Subscription[] = [];

  /**
   * Component constructor
   *
   * @param activatedRoute
   * @param layoutConfigService: LayoutConfigService
   * @param menuConfigService: MenuConfifService
   * @param pageConfigService: PageConfigService
   * @param htmlClassService: HtmlClassService
   * @param menuHorizontalService
   * @param store
   */
  constructor(
    public activatedRoute: ActivatedRoute,
    public layoutConfigService: LayoutConfigService,
    public menuConfigService: MenuConfigService,
    private pageConfigService: PageConfigService,
    public htmlClassService: HtmlClassService,
    private menuHorizontalService: MenuHorizontalService,
    public store: Store<AppState>,
    public router: Router,
  ) {
    super(activatedRoute, htmlClassService, layoutConfigService, menuConfigService, store, router);
    this.loading = true;
    // subscribe user information
    const userSubscription = this.store
      .select(currentUser)
      .subscribe((user) => {
        this.permission = user ? user.permissions : [];
        this.rolePermissions = user ? user.rolePermissions : [];
        this.userInformation = user;
      });
    this.unsubscribe.push(userSubscription);
    this.menuId = this.menuConfigService.getMenuId();

    // load menu configurations
    this.pageUrl = this.activatedRoute.snapshot['_routerState'].url;
    this.menuConfigService.savePageUrl(this.pageUrl);
    this.getCurrMenu();
    this.updateMenus();
  }

  /**
   * On init
   */
  ngOnInit(): void {
    const config = this.layoutConfigService.getConfig();
    this.selfLayout = objectPath.get(config, 'self.layout');
    this.asideDisplay = objectPath.get(config, 'aside.self.display');
    this.subheaderDisplay = objectPath.get(config, 'subheader.display');
    this.fluid = objectPath.get(config, 'content.width') === 'fluid';

    // let the layout type change
    const subscr = this.layoutConfigService.onConfigUpdated$.subscribe(
      (cfg) => {
        setTimeout(() => {
          this.selfLayout = objectPath.get(cfg, 'self.layout');
        });
      }
    );
    this.unsubscribe.push(subscr);
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
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

  loadBusinessSubMenus(resource, menuConfigs, idx) {
    const subMenus = cloneDeep(menuConfigs);

    const currentResource = this.rolePermissions.find(
      ({ uniqueResourceName }) => uniqueResourceName === resource
    );
    if (currentResource) {
      menuConfigs.header.items[idx].submenu.forEach(({ uniqueName }, index) => {
        if (
          !currentResource.subResources.some(
            ({ uniqueSubResourceName, services }) =>
              uniqueSubResourceName === uniqueName && services.length > 0
          )
        ) {
          subMenus.header.items[idx].submenu[index] = null;
        }
      });
      subMenus.header.items[idx].submenu = subMenus.header.items[idx].submenu.filter(Boolean);
    } else {
      subMenus.header.items[idx] = null;
    }
    if (subMenus.header.items[idx] && subMenus.header.items[idx].submenu.length === 0) {
      subMenus.header.items[idx] = null;
    }

    return subMenus;
  }

  loadSubMenusWithoutResources(menuConfigs) {
    const subMenus = cloneDeep(menuConfigs);
    subMenus.header.items = subMenus.header.items.filter(Boolean);
    return subMenus;
  }

  checkMenuPermissions(menuConfigs) {
    menuConfigs.header.items.forEach((ele, idx) => {
      menuConfigs = this.loadBusinessSubMenus(ele.uniqueName, menuConfigs, idx);
    });
    menuConfigs.header.items = menuConfigs.header.items.filter(Boolean);
    // I can re-evaluate which sub-menu to show based on the newly created permission for Content Hub
    this.menuConfigService.loadConfigs(
      menuConfigs
    );
  }

  getSubMenu($event) {
    this.showSubMenuObj = $event;
    this.getCurrMenu();
    this.updateMenus();
    this.loading = false;
  }

  getRouteMenu() {
    if (this.pageUrl.includes('/user-management')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.userManagement,
          new MenuConfig().getUsersModuleConfigs
        )
      );
    } else if (this.pageUrl.includes('/crm')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.crmManagement,
          new MenuConfig().getCrmModuleConfigs
        )
      );
    } else if (this.pageUrl.includes('/contentful')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.contentManagement,
          new MenuConfig().getContentfulModuleConfigs
        )
      );
    }   else if (this.pageUrl.includes('/config-management')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.configManagement,
          new MenuConfig().getConfigManageConfigs
        )
      );
    } else if (this.pageUrl.includes('/market-review')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.marketReview,
          new MenuConfig().getMarketReviewConfig
        )
      );
    }
    else if (this.pageUrl.includes('/admin-panel')) {
      this.menuConfigService.loadConfigs(
        this.loadSubMenus(
          Resources.adminPanel,
          new MenuConfig().getAdminPanelConfigs
        )
      );
    }
    else {
      this.menuConfigService.loadConfigs(new MenuConfig().defaultConfigs);
    }
  }

  getCurrMenu() {


    if (this.showSubMenuObj == null) {
      if (this.pageUrl.includes('user-management')) {
        this.menuConfigService.loadConfigs(
          this.loadSubMenusWithoutResources((
              new MenuConfig().getUsersModuleConfigs
            )
          ));
        this.showSubMenuObj = {showSubMenu: true, menuId: 0};
      } else {
        this.showSubMenuObj = {showSubMenu: false, menuId: this.menuId};
      }
    }

    if (this.pageUrl.includes('user-management') && this.showSubMenuObj.menuId === 0) {
      this.showSubMenuObj = {showSubMenu: true, menuId: 0};
      this.menuConfigService.loadConfigs(
        this.loadSubMenusWithoutResources((
            new MenuConfig().getUsersModuleConfigs
          )
        ));
    }



    this.getSubMenus();
  }

  getSubMenus() {
    if (this.showSubMenuObj.menuId === 1) {
      this.showSubMenuObj.menuId = 1;
      this.showSubMenuObj = {showSubMenu: true, menuId: 1};
      this.checkMenuPermissions(new MenuConfig().getBusinessContentConfigs);
    } else if (this.showSubMenuObj.menuId === 2) {
      this.showSubMenuObj.menuId = 2;
      this.showSubMenuObj = {showSubMenu: true, menuId: 2};
      this.checkMenuPermissions(new MenuConfig().getBusinessMarketExpansionConfigs);
    } else if (this.showSubMenuObj.menuId === 3) {
      this.showSubMenuObj.menuId = 3;
      this.showSubMenuObj = {showSubMenu: true, menuId: 3};
      this.checkMenuPermissions(new MenuConfig().getCrmModuleConfigs);
    } else if (this.showSubMenuObj.menuId === 4) {
      this.showSubMenuObj.menuId = 4;
      this.showSubMenuObj = {showSubMenu: true, menuId: 4};
      this.checkMenuPermissions(new MenuConfig().getMarketReviewConfig);
    }else if (this.showSubMenuObj.menuId === 5) {
      this.showSubMenuObj.menuId = 5;
      this.showSubMenuObj = {showSubMenu: true, menuId: 5};
      this.checkMenuPermissions(new MenuConfig().getAdminPanelConfigs);
    }
  }

  updateMenus() {
    // update menu based on the current menus
    const config = this.menuConfigService.getMenus();
    if (config) {
      this.menuHorizontalService.menuList$.next(config.header.items);

      // register configs by demos
      this.layoutConfigService.loadConfigs(new LayoutConfig().configs);
      this.pageConfigService.loadConfigs(new PageConfig().configs);

      // setup element classes
      this.htmlClassService.setConfig(this.layoutConfigService.getConfig());

      const subscr = this.layoutConfigService.onConfigUpdated$.subscribe(
        (layoutConfig) => {
          // reset body class based on global and page level layout config, refer to html-class.service.ts
          document.body.className = '';
          this.htmlClassService.setConfig(layoutConfig);
        }
      );
      this.unsubscribe.push(subscr);
    }
  }
}
