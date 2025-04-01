import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router'
import { AuthService, Logout } from '../../../../core/auth'
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/reducers';
import { environment } from "@env/environment";

@Component({
  selector: 'kt-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent {
  public isRequesting = false;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly store: Store<AppState>
  ) {
    this.logout();
  }

  logout() {
    this.isRequesting = true
    const authServiceSubscription = this.authService.logout()
      .subscribe(
        () => {
          this.store.dispatch(new Logout())
        }
      ).add(() => {
        authServiceSubscription.unsubscribe()
        this.router.navigateByUrl('/');
        window.open(`${environment.BASE_URL}.auth/logout`, '_self')
      })
  }

  redirect() {
    this.router.navigateByUrl('/');
  }
}
