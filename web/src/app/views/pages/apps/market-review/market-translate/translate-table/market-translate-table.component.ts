import {
  Component,
  EventEmitter,
  ElementRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { SelectionModel } from "@angular/cdk/collections";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { MatDialog } from "@angular/material/dialog";

import { TranslateDialogComponent } from "../confirm-dialog/confirm-dialog.component";

export interface Translate {
  key: string;
  value: string;
  existingValue: string;
  translatedValue: string;
  index: number;
}

@Component({
  selector: "kt-translate-table",
  templateUrl: "./market-translate-table.component.html",
  styleUrls: ["./market-translate-table.component.scss"],
})
export class MarketTranslateTableComponent implements OnInit {
  faSearch = faSearch;
  public displayedColumns = ["label", "initialValue", "replaceValue", "action"];
  public displayedNewColumns = ["key", "value"];
  @ViewChild("replaceValue", { static: false }) replaceValue: ElementRef;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @Input() dataSource = new MatTableDataSource<Translate>();
  @Input() environment;
  @Input() sourceLocale;
  @Input() totalCount;
  @Input() storedPageIndex;
  priorSelectedLocale;
  @Output() fetchContentModel: EventEmitter<any> = new EventEmitter<any>();
  @Output() pageChanged: EventEmitter<any> = new EventEmitter<any>();
  selection = new SelectionModel<Translate>(true, []);
  pageIndex: number = 0;
  @Input() pageSize;
  fieldExpand: any;
  updateEntryValue: any = [];
  enableUpdate = false;
  expandedRows: Set<number> = new Set<number>();

  ngOnInit() {
    this.pageIndex = this.storedPageIndex || 0;
    this.priorSelectedLocale = Array(this.dataSource.data.length);
    this.priorSelectedLocale.fill("");
  }

  constructor(public dialog: MatDialog) {}

  toggleExpansion(rowId: number): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  updateEntry(element) {
    this.enableUpdate = false;
    console.log("element", element.replaceValue);

    const dialogRef = this.dialog.open(TranslateDialogComponent, {
      data: { data: element, environment: this.environment },
    });

    dialogRef.afterClosed().subscribe(
      (response: any) => {
        if (response) {
          this.fetchContentModel.emit();
        } else {
          this.enableUpdate = true;
        }
      },
      (error) => {}
    );
  }

  updateValue(event, element) {
    element.replaceValue = event.target.value;
  }

  clearSearchInput(element) {
    element.replaceValue = '';

  }
  onPageChanged(event: PageEvent) {
    this.pageIndex = event.pageIndex;

    this.pageChanged.emit(event);
  }
}
