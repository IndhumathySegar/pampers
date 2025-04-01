// Angular
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
// RxJS
import { Observable, of } from "rxjs";
import { tap, map } from "rxjs/operators";
// NGRX
import { select, Store } from "@ngrx/store";
// Module reducers and selectors
import { AppState } from "../../../core/reducers/";
import { selectUserPermissions } from "../_selectors/auth.selectors";

import { get } from "lodash";
import { MatDialog } from "@angular/material";
import moment from 'moment';
import { environment } from "@env/environment";
import { AuthService } from "app/core/auth/_services";

const { GEN_AI_DATE } = environment;

@Injectable()
export class AppGuard implements CanActivate {
  landingPage = "";
  isTCAccepted:boolean = false;
  userData:any
  tcDate:any
  tcConDate:any;
  envDate: any;
  tcData: any;
  constructor(private store: Store<AppState>, private router: Router,private readonly dialog: MatDialog,private readonly auth: AuthService,) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    this.userData = JSON.parse(localStorage.getItem('_user'));
    this.tcDate = moment(this.userData.TCDate).format('YYYY-MM-DD');
    this.tcConDate = this.userData.TCConsentDate ? moment(this.userData.TCConsentDate).startOf('day').format('YYYY-MM-DD') : null;
    this.envDate = moment(GEN_AI_DATE).format('YYYY-MM-DD');
    this.isTCAccepted = this.userData.TCConsent && this.tcConDate && (this.tcConDate >= this.tcDate) && (this.tcConDate >= this.envDate) ? true : false

    const uniqueServiceName = get(
      route,
      "data.uniqueServiceName",
      ""
    ) as string;

    const resourceTree = uniqueServiceName.split(":");
    const resource = resourceTree[0];
    const subResource = resourceTree[1];
    const serviceName = resourceTree[2];

    if (!uniqueServiceName) {
      this.router.navigateByUrl("/error/403");
      return of(false);
    }

    return this.store.pipe(
      select(selectUserPermissions),
      map((permissions) => {
        const hasPermission = get(
          permissions,
          `${resource}.${resource}:${subResource}.${resource}:${subResource}:${serviceName}`,
          false
        );

        this.checkForRedirectURI(hasPermission, permissions);

        return hasPermission;
      }),
      tap((hasAccess) => {
        if (!hasAccess) {
          localStorage.setItem("access-url", this.landingPage);
          this.router.navigateByUrl("/error/403");
        }
      })
    );
  }

  checkForRedirectURI(hasPermission: boolean, permissions: any) {
    if (!hasPermission) {
      let redirectURI = "";

      for (const [
        _,
        { redirectURI: subResourceRedirectURI = "" },
      ] of Object.entries<any>(permissions)) {
        if (!redirectURI && subResourceRedirectURI) {
          redirectURI = subResourceRedirectURI;
        }
      }

      if (redirectURI) {
        this.router.navigateByUrl(redirectURI);
      }
    }
    if(!this.isTCAccepted){
      this.checkTCStatus();
    }
  }

  checkTCStatus(){
    const userData = this.auth
    .getTCStatus(this.userData._id)
    .subscribe(
      (res: any) => {
        if (res) {
          this.tcData = res.data;
          console.log("=============",this.tcData )
          if(this.tcData && !this.tcData.TCConsent){          
            import('../../../components/gen-ai-tc/gen-ai-tc.dialog.component')
            .then(({ GenAiTcDialogComponent }) => {
              this.dialog.open(GenAiTcDialogComponent, {
                disableClose: true,
                data: { formData: "selectedRegionName" },
              }).afterClosed().subscribe((res) => {});
            });
          }
          let localUserData = JSON.parse(localStorage.getItem('_user'));
          localUserData.TCConsent = this.tcData.TCConsent;
          localUserData.TCConsentDate =  this.tcData.TCConsentDate;
          localStorage.removeItem('_user');
          localStorage.setItem('_user', JSON.stringify(localUserData));
        } 
      },
      (err: any) => {
      }).add(() => {
        userData.unsubscribe();
      }); 
  }
  
}
