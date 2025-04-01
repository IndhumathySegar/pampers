import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ChangeDetectorRef 
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { MatDialog } from "@angular/material/dialog";

import { CKEditorComponent } from "../ckeditor/ck-editor.component";

export interface Translate {
  key: string;
  value: string;
  existingValue: string;
  translatedValue: string;
  translateValue: string;
  replaceValue: string;
  replacedValue: string;
  index: number;
  characterCount: number;
  contentModelName: string;
  label: string;
  type: string;
  isUploaded? : boolean
}

@Component({
  selector: "kt-translate-table",
  templateUrl: "./translate-table.component.html",
  styleUrls: ["./translate-table.component.scss"],
})
export class TranslateTableComponent implements OnInit, OnChanges {
  faSearch = faSearch;

  @Input() onTranslate: boolean;
  public displayedColumns = [
    "select",
    "key",
    "value",
    "translatedValue",
    "replaceValue",
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @Input() dataSource = new MatTableDataSource<Translate>();
  @Input() destLocale;
  @Input() sourceLocale;
  @Input() totalCount;
  @Input() storedPageIndex;
  @Input() pageSize;
  priorSelectedLocale;
  @Input() translationRole;
  @Input() isReviewPage;
  @Input() enableHeader;
  allRowSelected = false;
  @Output() getAllSelected: EventEmitter<any> = new EventEmitter<any>();
  @Output() reviewerUpdate: EventEmitter<any> = new EventEmitter<any>();

  @Output() pageChanged: EventEmitter<any> = new EventEmitter<any>();
  @Input() selection = new SelectionModel<Translate>(true, []);
  pageIndex: number = 0;
  goPageInput : number = 0;
  groupedData: { [key: string]: { data: Translate[], expanded: boolean } } = {};
  headerCheckboxState = false;
  totalPage: number;
  ngOnInit() {
    this.totalPage = Math.ceil(this.totalCount/5);
    this.pageIndex = this.storedPageIndex || 0;
    this.goPageInput = this.pageIndex + 1;
    this.priorSelectedLocale = Array(this.dataSource.data.length);
    this.priorSelectedLocale.fill("");
    if (!this.isReviewPage) {
      this.displayedColumns = [
        "select",
        "contentModelName",
        "label",
        "key",
        "value",
        "translatedValue",
      ];
    } else {
      this.displayedColumns = [
        "select",
        "contentModelName",
        "label",
        "key",
        "sourceValue",
        "translateValue",
        "replacedValue",
        "replaceValue",
      ];
    }
    this.groupDataByContentModelName();    
  }

  constructor(public dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  groupDataByContentModelName() {
    this.groupedData = this.dataSource.data.reduce((groups, item) => {
      const group = item.contentModelName;
      groups[group] = groups[group] || { data: [], expanded: true };
      groups[group].data.push(item);
      return groups;
    }, {});
    this.cdr.detectChanges();
    if(!this.enableHeader){
      this.headerCheckboxState = false;
    }
  }

  toggleHeaderSelection() {
    this.headerCheckboxState = !this.headerCheckboxState;
    for (let group in this.groupedData) {
      this.groupedData[group].data.forEach((element) => {
        this.headerCheckboxState ? this.selection.select(element) : this.selection.deselect(element);
      });
    }
    this.updateHeaderCheckboxState();
    this.getSelected();
  }

  toggleAllRowsSelection(group: string) {
    const allSelected = this.areAllRowsSelected(group);
    this.groupedData[group].data.forEach((element) => {
      allSelected ? this.selection.deselect(element) : this.selection.select(element);
    });
    this.updateHeaderCheckboxState();
    this.getSelected();
  }

  areAllRowsSelected(group?: string): boolean {
    if (group) {
      return this.groupedData[group].data.every(row => this.selection.isSelected(row));
    } else {
      for (let group in this.groupedData) {
        if (!this.areAllRowsSelected(group)) {
          return false;
        }
      }
      return true;
    }
  }

  updateHeaderCheckboxState() {
    this.headerCheckboxState = this.areAllRowsSelected();
  }

  submitReviewer() {
    this.reviewerUpdate.emit(this.selection.selected);
  }

  updateReplacedValue(element: Translate, event: any, type?) {
    if (type === "RichText") {
      element.replaceValue = element.replaceValue ? element.replaceValue : element.translateValue;
      const translatedData = {
        details: element,
      };
      const dialogRef = this.dialog.open(CKEditorComponent, {
        data: translatedData,
      });

      dialogRef.afterClosed().subscribe(
        (response: any) => {
          if (response.data) {
            element.replaceValue = response.data;
            element.replacedValue = response.data;
          }
        },
        (error) => {
          console.log(error);
        }
      );
    } else {
      const inputElement = event.target as HTMLInputElement;
      const trimmedValue = inputElement.value.trim();
      // Existing logic to handle input
      element.characterCount = trimmedValue.length;
      element.replaceValue = trimmedValue;
      element.replacedValue = trimmedValue;
    }

    this.getSelected();
    // You can now save the changes to your backend or perform other actions as needed
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.onTranslate && changes.onTranslate.currentValue) {
      this.getSelected();
    }
    if (changes.dataSource) {
      this.groupDataByContentModelName();
    }
    if(!this.selection.selected.length){
      this.headerCheckboxState = false;
    }
  }

  toggleSelection(row: any) {
    if (this.selection.isSelected(row)) {
      // If the row is already selected, deselect it
      this.selection.deselect(row);
    } else {
      // If the selection limit is reached, do not select the row
      this.selection.select(row);
    }
    this.updateHeaderCheckboxState();
    this.getSelected();
  }

  isString(variable: any): boolean {
    return typeof variable === "string";
  }

  isCheckString(element) {
    let translateValue = "";
  
    if (element.existingValue) {
      translateValue = element.existingValue;
    } else if (element.hasOwnProperty("translatedValue")) {
      translateValue = element.translatedValue;
    }
  
    return typeof translateValue === "string";
  }
  
  isCheckObject(element) {
    let translateValue = "";
  
    if (element.existingValue) {
      translateValue = element.existingValue;
    } else if (element.hasOwnProperty("translatedValue")) {
      translateValue = element.translatedValue;
    }
  
    return typeof translateValue === "object";
  }
  
  getObject(element) {
    if (element.existingValue) {
      return element.existingValue;
    }
  
    if (element.hasOwnProperty("translatedValue")) {
      return element.translatedValue;
    }
  
    return "";
  }
  
  isObject(variable: any): boolean {
    return typeof variable === "object";
  }

  isSelectionLimitReached(): boolean {
    return this.selection.selected.length >= 5;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    console.log(this.selection);
    this.selection.clear();
    this.updateHeaderCheckboxState();
    this.getSelected();
  }

  getSelected() {
    let selected: Translate[];
    let enableKeyTranslate = false;
    let enableReviewer = false;
    let update: Translate[];
    let uploadedContents: any;
    let uploadToContentful: any;

    selected = this.selection.selected;
    const enableTranslate: boolean = selected.length > 0;

    update = this.selection.selected.filter(
      (item) => (item.existingValue ?  item.existingValue && item.existingValue.length > 0 : item.translatedValue && item.translatedValue.length > 0)
    );
    uploadToContentful = this.selection.selected.filter(
      (item) => item.isUploaded === false
    );
    uploadedContents = this.selection.selected.filter(
      (item) => item.isUploaded === true
    );

    if (this.isReviewPage) {
      update = this.selection.selected;
    }

    if(this.selection.selected.length !== update.length) {
      enableKeyTranslate = true;
    }

    if(this.selection.selected.length === uploadedContents.length) {
      enableReviewer = true;
    }
    const enableUpdate: boolean = uploadToContentful.length  > 0 && update.length === this.selection.selected.length;
    this.getAllSelected.emit({
      update,
      selected,
      data: this.dataSource.data,
      enableTranslate,
      enableUpdate,
      enableKeyTranslate,
      enableReviewer,
      selection: this.selection,
      enableHeader : this.headerCheckboxState
    });
  }

  onPageChanged(event: PageEvent) {
    if (this.pageIndex !== event.pageIndex) {
      this.pageIndex = event.pageIndex;
      this.goPageInput = this.pageIndex + 1;  
      this.cdr.detectChanges();  
  
      this.pageChanged.emit(event);
    }
  }

  onManualPageChange(event: number) {
    if (event >= 1 && event <= this.totalCount / this.pageSize) {
      this.goPageInput = event;
    }
  }


  clickExpand(group){
    if(group.value.expanded) {
      group.value.expanded = false;
    }else{
      group.value.expanded = true;
    }
  }
  onRowCheckboxChange(event: Event, element: Translate) {
    this.selection.toggle(element); // Toggle the selection state of the row
    this.updateHeaderCheckboxState(); // Update the header checkbox state
    this.getSelected(); // Update the selection state
  }

  goPage(){
    let pageEvent = {
      length: this.totalCount,
      pageIndex: this.goPageInput -1,
      pageSize: 5,
      previousPageIndex: this.pageIndex - 1,
    }
    this.pageIndex = this.goPageInput - 1;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.onPageChanged(pageEvent);
    this.cdr.detectChanges();
  }
}
