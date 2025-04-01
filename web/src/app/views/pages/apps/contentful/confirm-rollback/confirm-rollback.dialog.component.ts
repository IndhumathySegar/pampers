import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'kt-confirm-rollback.dialog',
  templateUrl: './confirm-rollback.dialog.component.html',
  styleUrls: ['./confirm-rollback.dialog.component.scss']
})
export class ConfirmRollbackDialogComponent implements OnInit {
  formData: any;
  rollBackReason : any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ConfirmRollbackDialogComponent>,
    private spinnerService: NgxSpinnerService
  ) { }

  ngOnInit() {
    this.rollBackReason =  this.data.formData.reasonForRollBack;
  }

  onSubmit(type){
     this.spinnerService.show();
    this.dialogRef.close({type: type,reasonForRollBack : this.rollBackReason});
  }

}