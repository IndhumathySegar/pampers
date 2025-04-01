// Angular
import { Injectable, OnInit, OnDestroy } from "@angular/core";
// RxJS
import { BehaviorSubject, Subscription } from "rxjs";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../core/reducers";

// Object path
import * as objectPath from "object-path";
// Services
import { MenuConfigService } from "./menu-config.service";
import { currentUser } from "../../../../core/auth/_selectors/auth.selectors";

@Injectable()
export class MenuHorizontalService implements OnInit, OnDestroy {
  // Public properties
  menuList$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  subscriptions: Subscription[] = [];

  /**
   * Service constructor
   *
   * @param menuConfigService: MenuConfigService
   */
  permission: any = [];

  constructor(
    private readonly menuConfigService: MenuConfigService,
    private readonly store: Store<AppState>
  ) {}

  ngOnInit() {
    this.loadMenu();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscrption) => subscrption.unsubscribe());
  }

  /**
   * Load menu list
   */
  loadMenu() {
    // get menu list
    const menuItems: any[] = objectPath.get(
      this.menuConfigService.getMenus(),
      "header.items"
    );

    this.subscriptions.push(
      this.store
        .select(currentUser)
        .subscribe((user) => (this.permission = user ? user.permissions : []))
    );


    this.menuList$.next(menuItems);
  }
}
