import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'kt-confirm-migration.dialog',
  templateUrl: './confirm-migration.dialog.component.html',
  styleUrls: ['./confirm-migration.dialog.component.scss']
})
export class ConfirmMigrationDialogComponent implements OnInit {
  formData: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ConfirmMigrationDialogComponent>,
    private spinnerService: NgxSpinnerService
  ) { }

  ngOnInit() {
    console.log("data", this.data)
  }

  onSubmit(type){
     this.spinnerService.show();
    this.dialogRef.close({type: type});
  }

}
