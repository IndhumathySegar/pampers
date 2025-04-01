import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { MatDialog } from "@angular/material/dialog";

import { CRMCKEditorComponent } from "../ckeditor/ck-editor.component";

export interface Translate {
  key: string;
  value: string;
  existingValue: string;
  translatedValue: string;
  translateValue: string;
  replaceValue: string;
  replacedCRMValue: string;
  index: number;
  characterCount: number;
  isTranslated: boolean;
  isUploaded? : boolean
}

@Component({
  selector: "kt-crm-translate-table",
  templateUrl: "./translate-table.component.html",
  styleUrls: ["./translate-table.component.scss"],
})
export class CrmTranslateTableComponent implements OnInit, OnChanges {
  faSearch = faSearch;

  @Input() onCRMTranslate: boolean;
  public displayedColumns = [
    "select",
    "key",
    "value",
    "translatedValue",
    "replaceValue",
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @Input() crmDataSource = new MatTableDataSource<Translate>();
  @Input() destCRMLocale;
  @Input() sourceCRMLocale;
  @Input() totalCrmCount;
  @Input() crmStoredPageIndex;
  @Input() CRMPageSize;
  priorSelectedLocale;
  @Input() crmTranslationRole;
  @Input() isCrmReviewPage;
  allCrmRowsSelected = false;
  @Output() getAllSelectedCrm: EventEmitter<any> = new EventEmitter<any>();
  @Output() crmReviewerUpdate: EventEmitter<any> = new EventEmitter<any>();

  @Output() crmPageChanged: EventEmitter<any> = new EventEmitter<any>();
  @Input() crmSelection = new SelectionModel<Translate>(true, []);
  crmPageIndex: number = 0;

  ngOnInit() {
    this.crmPageIndex = this.crmStoredPageIndex || 0;
    this.priorSelectedLocale = Array(this.crmDataSource.data.length);
    this.priorSelectedLocale.fill("");
    if (!this.isCrmReviewPage) {
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
  }

  constructor(public dialog: MatDialog) {}

  toggleAllCrmRowsSelection() {
    this.allCrmRowsSelected = !this.allCrmRowsSelected;
    if (this.allCrmRowsSelected) {
      this.crmDataSource.data.forEach((element) => {
        this.crmSelection.select(element);
      });
      this.getSelectedCrm();
    } else {
      this.crmDataSource.data.forEach((element) => {
        this.crmSelection.deselect(element);
      });
    }
  }

  submitCrmReviewer() {
    this.crmReviewerUpdate.emit(this.crmSelection.selected);
  }

  updateReplacedCrmValue(index: number, event: any, type?) {
    if (type === "RichText") {
      this.crmDataSource.data[index].replaceValue = this.crmDataSource.data[index]
        .replaceValue
        ? this.crmDataSource.data[index].replaceValue
        : this.crmDataSource.data[index].translateValue;
      const translatedData = {
        details: this.crmDataSource.data[index],
      };
      const dialogRef = this.dialog.open(CRMCKEditorComponent, {
        data: translatedData,
      });

      dialogRef.afterClosed().subscribe(
        (response: any) => {
          if (response.data) {
            this.crmDataSource.data[index].replaceValue = response.data;
            this.crmDataSource.data[index].replacedCRMValue = response.data;
          }
        },
        (error) => {
          console.log(error);
        }
      );
    } else {
      const inputElement = event.target as HTMLInputElement;
      const trimmedValue = inputElement.value.trim();
      // your existing logic to handle input
      this.crmDataSource.data[index].characterCount = trimmedValue.length;
      this.crmDataSource.data[index].replaceValue = event.target.value;
      this.crmDataSource.data[index].replacedCRMValue = event.target.value;
    }

    this.getSelectedCrm();
    // You can now save the changes to your backend or perform other actions as needed
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.onCRMTranslate && changes.onCRMTranslate.currentValue) {
      this.getSelectedCrm();
    }
  }

  toggleCrmSelection(row: any) {
    if (this.crmSelection.isSelected(row)) {
      // If the row is already selected, deselect it
      this.crmSelection.deselect(row);
    } else {
      // If the selection limit is reached, do not select the row

      this.crmSelection.select(row);
    }
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
    return this.crmSelection.selected.length >= 5;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    console.log(this.crmSelection);
    this.crmSelection.clear();
    this.getSelectedCrm();
  }

  getSelectedCrm() {
    let selected: Translate[];
    let enableCrmKeyTranslate = false;
    let enableCrmReviewer = false;
    let updateCrm: Translate[];
    let uploadedCrmContents: any;
    let uploadToCrmContentful: any;
    selected = this.crmSelection.selected;
    const enableCRMTranslate: boolean = selected.length > 0;

    updateCrm = this.crmSelection.selected.filter(
      (item) => item.existingValue ?  item.existingValue && item.existingValue.length > 0 : item.translatedValue && item.translatedValue.length > 0
    );

    uploadToCrmContentful = this.crmSelection.selected.filter(
      (item) => item.isUploaded === false
    );
    uploadedCrmContents = this.crmSelection.selected.filter(
      (item) => item.isUploaded === true
    );

    if (this.isCrmReviewPage) {
      updateCrm = this.crmSelection.selected;
    }

    
    if(this.crmSelection.selected.length !== updateCrm.length) {
      enableCrmKeyTranslate = true;
    }

    if(this.crmSelection.selected.length === uploadedCrmContents.length) {
      enableCrmReviewer = true;
    }

    const enableCRMUpdate: boolean = uploadToCrmContentful.length  > 0 && updateCrm.length === this.crmSelection.selected.length;
    this.getAllSelectedCrm.emit({
      updateCrm,
      selected,
      data: this.crmDataSource.data,
      enableCRMTranslate,
      enableCRMUpdate,
      enableCrmKeyTranslate,
      enableCrmReviewer,
      crmSelection: this.crmSelection,
    });
  }

  onPageChanged(event: PageEvent) {
    this.crmPageIndex = event.pageIndex;
    this.crmPageChanged.emit(event);
  }
}
