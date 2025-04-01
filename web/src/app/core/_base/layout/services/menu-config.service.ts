// Angular
import { Injectable } from "@angular/core";
// RxJS
import { Subject } from "rxjs";

@Injectable()
export class MenuConfigService {
  // Public properties
  onConfigUpdated$: Subject<any>;
  // Private properties
  private menuConfig: any;
  private menuId = 1;
  private pageUrl = '';

  /**
   * Service Constructor
   */
  constructor() {
    // register on config changed event and set default config
    this.onConfigUpdated$ = new Subject();
  }

  /**
   * Returns the menuConfig
   */
  getMenus() {
    return this.menuConfig;
  }

  /**
   * Load config
   *
   * @param config: any
   */
  loadConfigs(config: any) {
    this.menuConfig = config;
    this.onConfigUpdated$.next(this.menuConfig);
  }

  saveMenuId(id: number) {
    this.menuId = id;
  }

  savePageUrl(url) {
    this.pageUrl = url;
  }

  getMenuId() {
    if (this.pageUrl.includes('user-management')) {
      return 0;
    } else if (this.pageUrl.includes('portal-settings')) {
      return 0;
    } else if (this.pageUrl.includes('downloads')) {
      return 0;
    } else {
      return this.menuId;
    }
  }
}
