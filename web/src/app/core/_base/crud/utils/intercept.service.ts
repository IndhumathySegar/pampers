// Angular
import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from "@angular/common/http";
import { Router } from "@angular/router";
// RxJS
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "@env/environment";

/**
 * More information there => https://medium.com/@MetonymyQT/angular-http-interceptors-what-are-they-and-how-to-use-them-52e060321088
 */
@Injectable()
export class InterceptService implements HttpInterceptor {
  constructor(
    private readonly router: Router
  ) { }

  // intercept request and add token
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // modify request
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${localStorage.getItem(
          environment.authTokenKey
        )}`,
      },
    });

    return next.handle(request).pipe(
      tap(
        (_) => {
          // this is left intentionally
        },
        (error) => {
          if (error.status === 401) {
            localStorage.clear();
            if (environment.env === "dev") {
              this.router.navigateByUrl("/auth/login");
              return;
            }
            window.open(`${environment.BASE_URL}.auth/logout`, "_self");
          }
        }
      )
    );
  }
}
