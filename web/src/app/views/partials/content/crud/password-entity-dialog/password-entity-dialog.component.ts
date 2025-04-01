// Angular
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
	selector: 'kt-password-entity-dialog',
	templateUrl: './password-entity-dialog.component.html'
})
export class PasswordEntityDialogComponent {
	/**
	 * Component constructor
	 *
	 * @param dialogRef: MatDialogRef<PasswordEntityDialogComponent>,
	 * @param data: any
	 */
	constructor(
		public dialogRef: MatDialogRef<PasswordEntityDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: any
	) {console.log("-----------", data)}

	/**
	 * Close dialog with false result
	 */
	onNoClick(): void {
		this.dialogRef.close();
	}

 /**
   * Close dialog with true result
   */
	  onYesClick(): void {
		this.dialogRef.close(true); 
	  }

	/** UI */
	/**
	 * Returns CSS Class Name by status type
	 * @param status: number
	 */
	getItemCssClassByStatus(status: number = 0) {
		switch (status) {
			case 0: return 'success';
			case 1: return 'metal';
			case 2: return 'danger';
			default: return 'success';
		}
	}
}
