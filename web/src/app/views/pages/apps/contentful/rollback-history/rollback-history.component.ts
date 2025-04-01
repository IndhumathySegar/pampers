import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { MatSort } from "@angular/material";
import moment from "moment";
import { IMigrationVariable } from "./migration-history";
import { ContentfulService } from "../contentful.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

import { DownloadsDialogComponent } from "../downloads/downloads.component";

enum STATUS {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
  MIGRATING = "migrating",
}

enum EXPORT_TYPES {
  EXPORTS = "contentfulExports",
  BACKUP = "backup",
  ERROR_LOGS = "contentfulErrorLogs",
}

let ELEMENT_DATA: IMigrationVariable[];
@Component({
  selector: 'kt-rollback-history',
  templateUrl: './rollback-history.component.html',
  styleUrls: ['./rollback-history.component.scss'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class RollbackHistoryComponent implements OnInit {
  isLoading: boolean = true;
  noData: boolean = false;

  ELEMENT_DATA: IMigrationVariable[];
  dataSource = new MatTableDataSource<IMigrationVariable>(ELEMENT_DATA);
  totalCount: number = 0;

  displayedColumns: string[] = [
    "createdBy",
    "region",
    "market",
    "locale",
    "from",
    "to",
    "migrationId",
    "error",
    "status",
    "reason",
    "createdAt",
    "Filters"
  ];

  expandedElement: IMigrationVariable | null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(
    private readonly contentfulService: ContentfulService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.getMigrationVariable();
  }

  expandedErrorElement: any;
  expandedFilterElement: any;

  toggleErrorExpand(element: any) {
    if (this.expandedErrorElement === element) {
      this.expandedErrorElement = null;
    } else {
      this.expandedErrorElement = element;
      this.expandedFilterElement = null;
    }
  }

  toggleFilterExpand(element: any) {
    if (this.expandedFilterElement === element) {
      this.expandedFilterElement = null;
    } else {
      this.expandedFilterElement = element;
      this.expandedErrorElement = null;
    }
  }

  getMigrationVariable() {
    const pageParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
      rollBack: true
    };

    const contentfulServiceSubs = this.contentfulService
      .listMigration(pageParams)
      .subscribe((variable: any) => {
        variable.data = variable.data.map((config) => {
          let includeTags;
          let excludeTags;
          let lastMigration;

          if (config.query) {
            includeTags = config.query.includeTags;
            excludeTags = config.query.excludeTags;
            lastMigration = config.query.lastMigration;
          }

          return {
            ...config,
            includedTags: includeTags,
            excludedTags: excludeTags,
            lastMigration: lastMigration,
            rollBackDate: moment(config.rollBackDate).format("YYYY-MM-DD HH:mm:ss A"),
          };
        });

        this.dataSource = new MatTableDataSource(
          variable.data as IMigrationVariable[]
        );

        if (this.dataSource.data.length === 0) {
          this.noData = true;
        }

        if (this.totalCount === 0) {
          this.totalCount = variable.totalCount;
        }
      })
      .add(() => {
        this.isLoading = false;
        this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async onPageChange(event: any): Promise<void> {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.getMigrationVariable();
  }

  async openDownloadDialog(reference, type): Promise<void> {
    if (
      (type === EXPORT_TYPES.EXPORTS && reference.status !== STATUS.SUCCESS) ||
      (type === EXPORT_TYPES.BACKUP && reference.status !== STATUS.SUCCESS) ||
      (type === EXPORT_TYPES.ERROR_LOGS &&
        reference.status !== STATUS.FAILED) ||
      reference.status === STATUS.PENDING ||
      reference.status === STATUS.MIGRATING
    ) {
      return;
    }

    this.dialog.open(DownloadsDialogComponent, {
      data: { reference, module: type },
    });
  }

}
