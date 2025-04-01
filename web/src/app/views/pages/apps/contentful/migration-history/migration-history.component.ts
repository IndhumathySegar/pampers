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
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import { currentUser } from "../../../../../core/auth";
import { ConfirmRollbackDialogComponent } from "../confirm-rollback/confirm-rollback.dialog.component";
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from "ngx-toastr";

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
  selector: "kt-migration-history",
  templateUrl: "./migration-history.component.html",
  styleUrls: ["./migration-history.component.scss"],
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
export class MigrationHistoryComponent implements OnInit {
  isLoading: boolean = true;
  noData: boolean = false;

  ELEMENT_DATA: IMigrationVariable[];
  dataSource = new MatTableDataSource<IMigrationVariable>(ELEMENT_DATA);
  totalCount: number = 0;

  displayedColumns: string[] = [
    "migrationId",
    "createdBy",
    "region",
    "market",
    "locale",
    "from",
    "to",
    "error",
    "status",
    "errorLogs",
    "createdAt",
    "Filters",
    "RollBack"
  ];

  expandedElement: IMigrationVariable | null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  translationService: any;

  constructor(
    private readonly contentfulService: ContentfulService,
    private readonly dialog: MatDialog,
    private appStore: Store<AppState>,
    private readonly cdr: ChangeDetectorRef,
    private spinnerService: NgxSpinnerService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.getTranslationRole();
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

  getTranslationRole(){
    this.appStore.select(currentUser).subscribe((user) => {
      const appRolePermission = user.rolePermissions.find(
        (item) => item.uniqueResourceName === "contentManagement"
      );
      
      if (!appRolePermission) return;

      const getSubResourceService = (subResourceName, serviceName) => {
        const subResource = appRolePermission.subResources.find(
          (item) => item.uniqueSubResourceName === subResourceName
        );
        return subResource.services.find(
          (item) => item.uniqueServiceName === serviceName
        );
      };

      this.translationService = getSubResourceService(
        "contentManagement:rollbackHistory", 
        "contentManagement:rollbackHistory:getRollbackHistory"
      );
    });   
  
}

  getMigrationVariable() {
    const pageParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
    };

    const contentfulServiceSubs = this.contentfulService
      .listMigration(pageParams)
      .subscribe((variable: any) => {
        variable.data = variable.data.map((config) => {
          let includeTags;
          let excludeTags;
          let lastMigration;
          let rollBackDate;
          let permission;

          if (config.query) {
            includeTags = config.query.includeTags;
            excludeTags = config.query.excludeTags;
            lastMigration = config.query.lastMigration;
            permission = this.translationService;
            rollBackDate = moment().diff(moment(config.createdAt), 'days') < 6;
          }

          return {
            ...config,
            includedTags: includeTags,
            excludedTags: excludeTags,
            lastMigration: lastMigration,
            createdAt: moment(config.createdAt).format("YYYY-MM-DD HH:mm:ss A"),
            rollBackDate: rollBackDate,
            permission: permission
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

  confirmPopup(gridData){
    let modalData = {
      contentModels: gridData.query.contentModels,
      includeTags: gridData.query.includeTags,
      excludeTags: gridData.query.excludeTags,
      region: gridData.region,
      markets: gridData.market,
      localesToMigrate: gridData.query.localesToMigrate,
      migrateFromDate: gridData.query.lastMigration,
      isRollBack : gridData.isRollBack ? "Yes" : "No"
    }
    this.dialog.open(ConfirmRollbackDialogComponent, { data: { formData: modalData } })
    .afterClosed()
    .subscribe(res => {
      if (res && res.type === "yes") {
        const payload = {
          _id : gridData._id,
          reasonForRollBack : res.reasonForRollBack
        }
        this.executeRollBack(payload);
      } else {
        this.spinnerService.hide();
      }
    });
  }

  executeRollBack(data){
    const sub = this.contentfulService.migrationRollBack(data).subscribe(
      (response: any) => {
        if (response) {
          this.toastr.success(response.message);
        } else {
          this.toastr.error("Something went wrong");
        }
        this.spinnerService.hide();
      },
      (err: any) => {
        this.toastr.error(err.error.error);
        this.spinnerService.hide();
      }
    ).add(() => sub.unsubscribe());
  }

  canShowRollbackActiveIcon(element: any): boolean {
    const hasRollbackPermission = element.rollBackDate && element.permission;
    const isRelevantStatus = element.status === 'success' || element.status === 'failed';
    const needsRollback = !element.rollBackStatus ;
    
    
    return hasRollbackPermission && isRelevantStatus && element.backupFilePath && needsRollback;
  }

  canShowRollbackDisabledIcon(element: any): boolean {
      return !this.canShowRollbackActiveIcon(element);
  }
}
