import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { MatSort } from "@angular/material";
import moment from "moment";
import { IMigrationVariable } from "./crm-migration-history";
import { ContentfulService } from "../contentful.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

import { DownloadsDialogComponent } from "../downloads/downloads.component";

enum crmSTATUS {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
  MIGRATING = "migrating",
}

enum CRM_EXPORT_TYPES {
  EXPORTS = "contentfulExports",
  BACKUP = "backup",
  ERROR_LOGS = "contentfulErrorLogs",
}

let CRM_ELEMENT_DATA: IMigrationVariable[];
@Component({
  selector: "kt-crm-migration-history",
  templateUrl: "./crm-migration-history.component.html",
  styleUrls: ["./crm-migration-history.component.scss"],
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
export class CRMMigrationHistoryComponent implements OnInit {
  isCRMLoading: boolean = true;
  noCRMData: boolean = false;

  CRM_ELEMENT_DATA: IMigrationVariable[];
  dataCRMSource = new MatTableDataSource<IMigrationVariable>(CRM_ELEMENT_DATA);
  totalCRMCount: number = 0;

  displayedCRMColumns: string[] = [
    "createdBy",
    "spaceId",
    "projectName",
    "from",
    "to",
    "error",
    "status",
    "errorLogs",
    "createdAt",
    "Filters",
  ];

  expandedCRMElement: IMigrationVariable | null;

  @ViewChild(MatPaginator, { static: true }) paginatorCRM: MatPaginator;
  @ViewChild(MatSort, { static: true }) sortNew: MatSort;

  constructor(
    private readonly contentfulCRMService: ContentfulService,
    private readonly dialogCRM: MatDialog,
    private readonly cdrCRM: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paginatorCRM.pageSize = 10;
    this.paginatorCRM.pageIndex = 0;
    this.getCRMMigrationVariable();
  }

  expandedCRMErrorElement: any;
  expandedCRMFilterElement: any;

  toggleCRMErrorExpand(element: any) {
    if (this.expandedCRMErrorElement === element) {
      this.expandedCRMErrorElement = null;
    } else {
      this.expandedCRMErrorElement = element;
      this.expandedCRMFilterElement = null;
    }
  }

  toggleCRMFilterExpand(element: any) {
    if (this.expandedCRMFilterElement === element) {
      this.expandedCRMFilterElement = null;
    } else {
      this.expandedCRMFilterElement = element;
      this.expandedCRMErrorElement = null;
    }
  }

  getCRMMigrationVariable() {
    const pageParamsCRM = {
      pageIndex: this.paginatorCRM.pageIndex,
      pageSize: this.paginatorCRM.pageSize,
    };

    const contentfulServiceSubs = this.contentfulCRMService
      .listMigration(pageParamsCRM)
      .subscribe((variableCRM: any) => {
        variableCRM.data = variableCRM.data.map((config) => {
          let includeCRMTags;
          let excludeCRMTags;
          let lastMigrationCRM;

          if (config.query) {
            includeCRMTags = config.query.includeTags;
            excludeCRMTags = config.query.excludeTags;
            lastMigrationCRM = config.query.lastMigration;
          }

          return {
            ...config,
            includedTags: includeCRMTags,
            excludedTags: excludeCRMTags,
            lastMigration: lastMigrationCRM,
            createdAt: moment(config.createdAt).format("YYYY-MM-DD HH:mm:ss A"),
          };
        });

        this.dataCRMSource = new MatTableDataSource(
          variableCRM.data as IMigrationVariable[]
        );

        if (this.dataCRMSource.data.length === 0) {
          this.noCRMData = true;
        }

        if (this.totalCRMCount === 0) {
          this.totalCRMCount = variableCRM.totalCount;
        }
      })
      .add(() => {
        this.isCRMLoading = false;
        this.cdrCRM.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async onCRMPageChange(event: any): Promise<void> {
    this.paginatorCRM.pageIndex = event.pageIndex;
    this.paginatorCRM.pageSize = event.pageSize;
    this.getCRMMigrationVariable();
  }

  async openCRMDownloadDialog(referenceCRM, typeCRM): Promise<void> {
    if (
      (typeCRM === CRM_EXPORT_TYPES.EXPORTS && referenceCRM.status !== crmSTATUS.SUCCESS) ||
      (typeCRM === CRM_EXPORT_TYPES.BACKUP && referenceCRM.status !== crmSTATUS.SUCCESS) ||
      (typeCRM === CRM_EXPORT_TYPES.ERROR_LOGS &&
        referenceCRM.status !== crmSTATUS.FAILED) ||
        referenceCRM.status === crmSTATUS.PENDING ||
        referenceCRM.status === crmSTATUS.MIGRATING
    ) {
      return;
    }

    this.dialogCRM.open(DownloadsDialogComponent, {
      data: { referenceCRM, module: typeCRM },
    });
  }
}
