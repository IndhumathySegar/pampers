import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ContentfulService } from "../../contentful.service";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: "kt-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrls: ["./confirm-dialog.component.scss"],
})
export class CRMTranslateDialogComponent implements OnInit {
  public configData;

  public message = "";

  public isCrmLoading = false;
  isCRM: boolean = false;

  constructor(
    private readonly dialogRef: MatDialogRef<CRMTranslateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

    private crmContentService: ContentfulService,
    private readonly crmToastr: ToastrService,
    private readonly crmCdr: ChangeDetectorRef,
    private crmRouter: Router,
    private crmSpinnerService: NgxSpinnerService,

  ) {}

  ngOnInit() {
    this.isCRM = this.crmRouter.url.startsWith("/crm");
    this.configData = this.data;
  }

  onCancel(status: boolean): void {
    this.dialogRef.close(status);
  }

  updateCrmStatus(): void {
    this.crmSpinnerService.show();
    this.isCrmLoading = true;
    this.crmContentService
      .updateCrmContent(this.configData)
      .subscribe(
        (response: any) => {
          this.crmToastr.success(response.message, "Success");
          this.onCancel(true);
        },
        (err: any) => {
          this.crmSpinnerService.hide();
          console.log(err);
          this.message = "unable to update";
          this.crmToastr.error(err.error.error || this.message, err.error.message);
        }
      )
      .add(() => {
        this.isCrmLoading = false;
        this.crmCdr.detectChanges();
      });
  }

  approveCrmMessages() {
    this.crmSpinnerService.show();
    this.isCrmLoading = true;
    this.crmContentService
    .updateCrmContent(this.configData)
    .subscribe((responseNew: any) => {
      this.crmContentService
      .approveCrmMessages({
        data: this.configData.selected,
        destLocale: this.configData.destLocale,
        isCRM : this.isCRM
      })
      .subscribe(
        (res: any) => {
          this.crmToastr.success(res.message, "Success");
          this.onCancel(true);
        },
        (error) => {
          this.crmSpinnerService.hide();
          this.isCrmLoading = false;

          this.crmToastr.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.isCrmLoading = false;
        this.crmCdr.detectChanges();
      });
    })
  
  }
}
