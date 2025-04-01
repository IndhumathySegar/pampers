// Angular
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from "@angular/core";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
// RxJS
import { Observable, Subject, of, Subscription } from "rxjs";
import { finalize, takeUntil, tap, catchError } from "rxjs/operators";
// Translate
import { TranslateService } from "@ngx-translate/core";
// Store
import { Store } from "@ngrx/store";
import { AppState } from "../../../../core/reducers";
// Auth
import {
  AuthNoticeService,
  AuthService,
  Login,
  Logout,
  UserLoaded,
} from "../../../../core/auth";
import { environment } from "@env/environment";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "kt-login",
  templateUrl: "./login.component.html",
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit, OnDestroy {
  // Public params
  loginForm: FormGroup;
  loading = false;
  isLoggedIn$: Observable<boolean>;
  errors: any = [];

  subscriptions: Subscription[] = [];

  private unsubscribe: Subject<any>;
  private fb: FormBuilder;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly authNoticeService: AuthNoticeService,
    private readonly translate: TranslateService,
    private readonly store: Store<AppState>,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastr: ToastrService
  ) {
    this.unsubscribe = new Subject();
    this.fb = new FormBuilder();
  }

  ngOnInit(): void {
    this.initLoginForm();
    this.getUserData();
  }

  getUserData(): void {
    this.loading = true;

    this.subscriptions.push(
      this.auth.getUserInfo().subscribe(
        (res) => {
          console.log("[AZ Directory]", res);
          this.loading = true;

          if (res) {
            if (res[0]) {
              this.ssoSubmit(res[0].id_token);
            } else {
              this.logoutWeb();
            }
          } else {
            this.logoutWeb();
          }
        },
        (err) => {
          console.error("[AD LOGIN ERROR]:", err);

          this.logoutWeb();
        }
      )
    );
  }

  logoutWeb() {
    const authServiceSubs = this.auth
      .logout()
      .subscribe(() => {
        this.store.dispatch(new Logout());
      })
      .add(() => {
        authServiceSubs.unsubscribe();
        localStorage.clear();
        window.open(`${environment.BASE_URL}.auth/logout`, "_self");
      });
  }

  deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this.authNoticeService.setNotice(null);
    this.unsubscribe.next();
    this.unsubscribe.complete();

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  initLoginForm() {
    this.loginForm = this.fb.group({
      email: [
        "",
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(320),
        ]),
      ],
      password: [
        "",
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }

  ssoSubmit(token) {
    this.subscriptions.push(
      this.auth
        .loginSSO(token)
        .pipe(
          takeUntil(this.unsubscribe),
          tap(async (user) => {
            if (user) {
              this.store.dispatch(
                new Login({ _user: user, accessToken: user.accessToken })
              );
              this.store.dispatch(new UserLoaded({ user }));

              localStorage.setItem("redirect-url", "");
              this.router.navigateByUrl(user.landingPage);
            } else {
              this.router.navigateByUrl("/error/403");
            }
          }),
          catchError((err: any) => {
            this.loading = false;
            this.router.navigateByUrl("/error/403");
            return of(err);
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe()
    );
  }

  submit() {
    const controls = this.loginForm.controls;

    /** check form */
    if (this.loginForm.invalid) {
      Object.keys(controls).forEach((controlName) =>
        controls[controlName].markAsTouched()
      );
      return;
    }

    this.loading = true;

    this.subscriptions.push(
      this.auth
        .login(controls.email.value, controls.password.value)
        .pipe(
          takeUntil(this.unsubscribe),
          tap(async (user) => {
            if (user) {
              this.store.dispatch(
                new Login({ _user: user, accessToken: user.accessToken })
              );
              this.store.dispatch(new UserLoaded({ user }));
              const rediretUrl = user.landingPage;
              localStorage.setItem("redirect-url", "");
              this.router.navigateByUrl(rediretUrl);
            } else {
              this.toastr.error(
                this.translate.instant("AUTH.VALIDATION.INVALID_LOGIN"),
                "Login Failed"
              );
            }
          }),
          catchError((err: any) => {
            this.toastr.error(
              this.translate.instant("AUTH.VALIDATION.INVALID_LOGIN"),
              "Login Failed"
            );
            return of(err);
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe()
    );
  }

  isControlHasError(controlName: string, validationType: string): boolean {
    const control = this.loginForm.controls[controlName];
    if (!control) {
      return false;
    }

    return (
      control.hasError(validationType) && (control.dirty || control.touched)
    );
  }
}