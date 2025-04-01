import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from "app/core/auth/_services";
import { Store } from "@ngrx/store";
import { AppState } from "../../core/reducers";
import { Logout } from 'app/core/auth';
import { ToastrService } from "ngx-toastr";
import { environment } from "@env/environment";
import { Router } from '@angular/router';

@Component({
  selector: 'kt-gen-ai-tc.dialog',
  templateUrl: './gen-ai-tc.dialog.component.html',
  styleUrls: ['./gen-ai-tc.dialog.component.scss']
})
export class GenAiTcDialogComponent implements OnInit {
  formData: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<GenAiTcDialogComponent>,
    private spinnerService: NgxSpinnerService,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private readonly store: Store<AppState>,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly router: Router,
  ) { }

  ngOnInit() {
    console.log("data", this.data)   
  }

  onSubmit(type){
    let payload = {
      TCConsent : type == "yes" ? true : false
    }
      const userData = this.auth
            .updateTcData(payload)
            .subscribe(
              (res: any) => {
                if (res && type === "yes") {
                  this.toastr.success(res.status);
                  let localUserData = JSON.parse(localStorage.getItem('_user'));
                  localUserData.TCConsent = true;
                  localUserData.TCConsentDate =  new Date() ;
                  localStorage.removeItem('_user');
                  localStorage.setItem('_user', JSON.stringify(localUserData));
                  this.dialogRef.close();
                  this.spinnerService.show();
                  window.location.reload();
                  this.spinnerService.hide();
                } else {                  
                  this.dialogRef.close();
                  this.logoutWeb();
                }
              },
              (err: any) => {
                this.spinnerService.hide();
                this.toastr.error(err.error.error);
                this.dialogRef.close();
                this.logoutWeb();
              }).add(() => {
                userData.unsubscribe();
                this.changesDetect.detectChanges();
              }); 
  }

  logoutWeb() {
    this.auth.logout("auto")
      .subscribe(
        () => {
          this.store.dispatch(new Logout())
        }
      ).add(() => {
        localStorage.clear();
        this.router.navigateByUrl('/')
        window.open(`${environment.BASE_URL}.auth/logout`, '_self')
      })
  }
}
