import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { MarketService } from "../market-review.service";
import moment from "moment";


let ELEMENT_DATA: any[];
@Component({
  selector: "kt-translate-history",
  templateUrl: "./market-translate-history.component.html",
  styleUrls: ["./market-translate-history.component.scss"],
})
export class MarketReviewTranslationHistory implements OnInit {
  isLoading: boolean = true;
  noData: boolean = false;

  ELEMENT_DATA: any[];
  dataSource = new MatTableDataSource<any>(ELEMENT_DATA);
  totalCount: number = 0;

  displayedColumns: string[] = [
    "label",
    "initialValue",
    "replaceValue",
    "email",
    "initiatedAt"
  ];

  expandedElement: any;
  expandedRows: Set<number> = new Set<number>();
  expandedReplaceRows: Set<number> = new Set<number>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private readonly marketService: MarketService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.getMarketHistory();
  }

  formatDateTime(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD HH:mm:ss A");
  }

  toggleExpansion(rowId: number): void {
    if (this.expandedRows.has(rowId)) {
      this.expandedRows.delete(rowId);
    } else {
      this.expandedRows.add(rowId);
    }
  }

  toggleReplaceExpansion(rowId: number): void {
    if (this.expandedReplaceRows.has(rowId)) {
      this.expandedReplaceRows.delete(rowId);
    } else {
      this.expandedReplaceRows.add(rowId);
    }
  }

  getMarketHistory() {
    const pageNewParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
    };

    const marketServiceSubs = this.marketService
      .listContentTranlationHistory(pageNewParams)
      .subscribe((res: any) => {
        this.dataSource = new MatTableDataSource(res.data as any[]);

        if (this.dataSource.data.length === 0) {
          this.noData = true;
        }

        if (this.totalCount === 0) {
          this.totalCount = res.totalCount;
        }
      })
      .add(() => {
        this.isLoading = false;
        this.cdr.detectChanges();

        marketServiceSubs.unsubscribe();
      });
  }

  async onPaginationChange(event: any): Promise<void> {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.getMarketHistory();
  }
}
