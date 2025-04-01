import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'kt-confirm-region-mapping.dialog',
  templateUrl: './confirm-region-mapping.dialog.component.html',
  styleUrls: ['./confirm-region-mapping.dialog.component.scss']
})
export class ConfirmRegionMappingDialogComponent implements OnInit {
  formData: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<ConfirmRegionMappingDialogComponent>,
    private spinnerService: NgxSpinnerService
  ) { }

  ngOnInit() {
    console.log("=======df", this.data)
  }

  onSubmit(type){
     this.spinnerService.show();
    this.dialogRef.close({type: type});
  }

}
