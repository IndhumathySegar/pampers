import {ChangeDetectorRef, Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';

@Component({
  selector: 'kt-confirm-dialogue',
  templateUrl: './confirm-dialogue.component.html',
  styleUrls: ['./confirm-dialogue.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmDialogueComponent {
  configData;
  isPrior = false;
  displayedColumns = ['position', 'configKey', 'configValue'];
  displayedColumnsWithPrior = ['position', 'configKey', 'priorValue', 'configValue'];
  tableId = [];
  dataSourceList = [];
  message = 'Are you sure want to Update?';
  confirmButtonText = 'Yes';
  cancelButtonText = 'Cancel';
  hideTable = true;
  isLoading = true;

  constructor(
    private readonly changesDetect: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<ConfirmDialogueComponent>) {
    if (data) {
      this.isPrior = data.isPrior || this.isPrior;
      this.configData = data;
      console.log('this.isPrior ', this.isPrior);
      Object.keys(this.configData)
        .forEach((category) => {
          this.tableHelper(category);
        });

      this.message = data.message || this.message;
      if (data.buttonText) {
        this.confirmButtonText = data.buttonText.ok || this.confirmButtonText;
        this.cancelButtonText = data.buttonText.cancel || this.cancelButtonText;
      }
    }
  }

  tableHelper(category) {
    if (!(category === 'message' || category === 'prior' || category === 'backup_configs')) {
      let count = 1;
      const configData = [];
      Object.keys(this.configData[category])
        .forEach((configKey) => {
          if (this.isPrior) {
            configData.push({
              position: count,
              configKey,
              priorValue: this.configData.backup_configs[configKey],
              configValue: this.configData[category][configKey]
            });
          } else {
            configData.push({
              position: count,
              configKey,
              configValue: this.configData[category][configKey]
            });
          }
          count++;
        });
      count = 1;
      if (configData.length !== 0) {
        const tempSource = new MatTableDataSource<any>();
        this.tableId.push(category);
        tempSource.data = configData;
        this.dataSourceList.push(tempSource);
        this.hideTable = false;
        this.isLoading = false;
      }
    }
  }

  onConfirmClick(): void {
    this.dialogRef.close(true);
  }
}
