// Angular
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
// RxJS
import { Observable, Subscription } from "rxjs";
// NGRX
import { select, Store } from "@ngrx/store";

// State
import { AppState } from "../../../../../core/reducers";
import {
  currentUser,
  Logout,
  User,
  AuthService,
} from "../../../../../core/auth";
import { MenuConfig } from "app/core/_config/menu.config";
import { MenuHorizontalService } from "app/core/_base/layout";
import { Router } from "@angular/router";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { Resources } from "app/constents/resources";
import { environment } from "@env/environment";

@Component({
  selector: "kt-user-profile",
  templateUrl: "./user-profile.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit, OnDestroy {
  @Input() avatar = true;
  @Input() greeting = true;
  @Input() badge: boolean;
  @Input() icon: boolean;

  role: string;
  permission: any;
  showDownloads = false;
  user$: Observable<User>;
  userPermissions: any = [];
  showUserManagement = false;
  showSettings = false;
  isRequesting: boolean = false;
  subscriptions: Subscription[] = [];

  constructor(
    private readonly store: Store<AppState>,
    private readonly router: Router,
    private readonly menuHorizontalService: MenuHorizontalService,
    private readonly cdr: ChangeDetectorRef,
    private readonly auth: AuthService
  ) { }

  ngOnInit(): void {
    this.user$ = this.store.pipe(select(currentUser));
    this.subscriptions.push(
      this.user$.subscribe(user => {
        this.role = user ? user.role : ""

        this.cdr.detectChanges();
      })
    );

    this.subscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions
        this.showUserManagement = this.checkRole(Resources.adminPanel)
        this.showDownloads = this.checkRole(Resources.downloads)

        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }

  checkRole(resource): boolean {
    return this.permission[resource] && Object.keys(this.permission[resource]).length > 0
  }

  logout() {
    this.logoutWeb()
  }

  logoutWeb() {
    this.isRequesting = true
    this.auth.logout()
      .subscribe(
        () => {
          this.store.dispatch(new Logout())
        }
      ).add(() => {
        this.isRequesting = false
        localStorage.clear()
        this.router.navigateByUrl('/')
        window.open(`${environment.BASE_URL}.auth/logout`, '_self')
      })
  }

  gotoUserModule() {
    const config = new MenuConfig().getUsersModuleConfigs;
    this.menuHorizontalService.menuList$.next(config.header.items)
    this.router.navigate(['user-management'])
  }



}
