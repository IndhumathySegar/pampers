import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ContentfulService } from "../../contentful.service";
import { ToastrService } from "ngx-toastr";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: "kt-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrls: ["./confirm-dialog.component.scss"],
})
export class TranslateDialogComponent implements OnInit {
  public configData;

  public message = "";

  public isLoading = false;

  constructor(
    private readonly dialogRef: MatDialogRef<TranslateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

    private contentService: ContentfulService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef,
    private spinnerService: NgxSpinnerService,
  ) {}

  ngOnInit() {
    this.configData = this.data;
    console.log(this.configData);
  }

  onCancel(status: boolean): void {
    this.dialogRef.close(status);
  }

  updateStatus(): void {
    this.spinnerService.show();
    this.isLoading = true;
    this.contentService
      .UpdateContent(this.configData)
      .subscribe(
        (response: any) => {
          this.toastr.success(response.message, "Success");
          this.onCancel(true);
        },
        (err: any) => {
          this.spinnerService.hide();
          console.log(err);
          this.message = "unable to update";
          this.toastr.error(err.error.error || this.message, err.error.message);
        }
      )
      .add(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  approveMessages() {
    this.spinnerService.show();
    this.isLoading = true;
 
      this.contentService
      .approveMessages({
        data: this.configData.selected,
        destLocale: this.configData.destLocale,
        updateData: this.configData
      })
      .subscribe(
        (res: any) => {
          this.toastr.success(res.message, "Success");
          this.onCancel(true);
        },
        (error) => {
          this.spinnerService.hide();
          this.isLoading = false;

          this.toastr.error(error.error.message || "Unknown Error");
        }
      )
      
    
  
  }
}
