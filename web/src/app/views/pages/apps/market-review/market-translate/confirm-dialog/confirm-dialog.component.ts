import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MarketService } from "../../market-review.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "kt-confirm-dialog",
  templateUrl: "./confirm-dialog.component.html",
  styleUrls: ["./confirm-dialog.component.scss"],
})
export class TranslateDialogComponent implements OnInit {
  public marketData;

  public message = "";

  public isLoading = false;

  public environment;

  constructor(
    private readonly dialogRef: MatDialogRef<TranslateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private marketService: MarketService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log(this.data.data)
    this.marketData = this.data.data;
    this.environment = this.data.environment;
  }

  onCancel(status: boolean): void {
    this.dialogRef.close(status);
  }

  updateStatus(): void {
    this.isLoading = true;
    this.marketService
      .UpdateContent(this.marketData, this.environment )
      .subscribe(
        (response: any) => {
          this.toastr.success(response.message, "Success");
          this.onCancel(true);
        },
        (err: any) => {
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
}
