import { Component, OnInit, Inject, ChangeDetectorRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ContentfulService } from "../../contentful.service";

import { ToastrService } from "ngx-toastr";

@Component({
  selector: "kt-ck-editor",
  templateUrl: "./ck-editor.component.html",
  styleUrls: ["./ck-editor.component.scss"],
})
export class CRMCKEditorComponent implements OnInit {
  public configData;

  ckData: any = ``;

  public message = "";

  public isLoading = false;

  public editorConfig = {
    toolbar: [
      { name: 'styles', items: ['Format'] },
      { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike'] },
      { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Blockquote'] },
      { name: 'undo', items: ['Undo', 'Redo'] },
      { name: 'insert', items: ['Link', 'HorizontalRule'] }, // Insert Link and Horizontal Rule
      { name: 'document', items: ['Maximize'] }
    ],
 
    stylesSet: [
      { name: 'Blue Title', element: 'h2', styles: { 'color': 'Blue' } },
      { name: 'Red Title', element: 'h3', styles: { 'color': 'Red' } },
      { name: 'CSS Style', element: 'span', attributes: { 'class': 'my_style' } },
      { name: 'Marker: Yellow', element: 'span', styles: { 'background-color': 'Yellow' } }
    ],
    format_tags: 'p;h1;h2;h3;h4;h5;h6',
    // You can add other configurations as needed
    // For example:
    // toolbar: 'stylescombo', // If you want to display the styles in the toolbar
  };

  


customEditorId: string;


  currentData: any;

  constructor(
    private readonly dialogRef: MatDialogRef<CRMCKEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

    private crmContentService: ContentfulService,
    private readonly crmToastr: ToastrService,
    private readonly crmCdr: ChangeDetectorRef
  ) {}

  

  ngOnInit() {
    this.ckData = this.data.details.replacedValue? this.data.details.replacedValue: this.data.details.replaceValue;
    console.log(this.ckData)
    this.customEditorId = this.data.details.entryId+'_'+this.data.details.key
  }

  

  onCancel(status: boolean): void {
    this.dialogRef.close(status);
  }

  updateCrmContent(event): void {
    console.log(this.data)
    console.log( event.editor.getData())
    this.currentData = event.editor.getData();
    
 
  }

  submitCrmContent() {
   this.dialogRef.close({data: this.currentData});

  }


}
