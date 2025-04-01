import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
} from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { ContentfulService } from "../contentful.service";
import { IMigrationVariable } from "./migration-history";
import { ToastrService } from "ngx-toastr";
import { Sort } from "@angular/material/sort";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import moment from "moment";

let ELEMENT_DATA: IMigrationVariable[];

@Component({
  selector: "kt-bulk-migrations",
  templateUrl: "./bulk-migrations.component.html",
  styleUrls: ["./bulk-migrations.component.scss"],
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
export class BulkMigrationsComponent implements OnInit {
  filteredLocales: any[] = [];
  localeOptions: any[] = [];
  pageSize = 10;
  isLoading = false;
  pageIndex = 0;
  storedPageIndex = 0;
  contentModel: string[] = [
    "Email",
    "In App Asset",
    "Home Feed KVPs",
    "Offer Card KVPs",
  ];
  mediaFileName: string;
  contentFileName: string;
  contentFile: any[] = [];
  mediaFile: any[] = [];
  selectedModels = [];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  ELEMENT_DATA: IMigrationVariable[];
  dataSource = new MatTableDataSource<IMigrationVariable>(ELEMENT_DATA);
  totalCount: number = 0;
  noData: boolean = false;
  selectedLocaleFilter = "";
  selectedContentModelFilter = "";
  fileNameFilter = "";
  displayedColumns: string[] = [
    "fileName",
    "locale",
    "contentModel",
    "uploadedFiles",
    "uploadedBy",
    "uploadedDate",
    "status",
    "processingStatus",
    "uploadStatus",
    "error",
  ];
  timer: any;
  isSearch: boolean = false;
  isLocaleFilter: boolean = false;
  isContentFilter: boolean = false;
  sortOrder = -1;
  isDownLoad: boolean = false;
  expandedErrorElement: any;
  expandedUploadElement: any;
  currentError: any;
  currentStatus: any;

  constructor(
    private readonly contentService: ContentfulService,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly toast: ToastrService
  ) {}

  ngOnInit() {
    this.fetchRegions();
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.getMigrationData();
  }

  filterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    this.filteredLocales = this.localeOptions.filter((locale) => {
      return (
        locale.regionName.toLowerCase().includes(filterValue) ||
        locale.regionCode.toLowerCase().includes(filterValue)
      );
    });
  }

  fetchRegions() {
    this.isLoading = true;
    this.pageIndex = 0;
    this.storedPageIndex = 0;
    const contentfulModels = this.contentService
      .fetchContentModel()
      .subscribe(
        (res: any) => {
          this.localeOptions = Array.from(res.region || []);
          this.filteredLocales = this.localeOptions;

          this.isLoading = false;
        },
        (error) => {
          if(error.error.message != "Please accept the terms and condition"){
            this.toast.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
        this.changesDetect.detectChanges();
      });
  }

  onChangeExcelFile(pFileList: File[]) {
    this.contentFile = pFileList;
    this.contentFileName = pFileList.length ? pFileList[0].name : "";
  }

  onChangemediaFile(pFileList: File[]) {
    this.mediaFile = pFileList;
    this.mediaFileName = pFileList.length ? pFileList[0].name : "";
  }

  confirmUpload() {
    if (this.selectedModels.length === 0) {
      this.toast.error("Please select Content Model");
      return;
    }

    if (!this.validateFile(this.contentFile, 2, 'spreadsheetml', 'xlsx')) {
      return;
    }

    if (!this.validateFile(this.mediaFile, 100, "zip", "zip")) {
      return;
    }
    this.isLoading = true;
    this.contentService
      .bulkMigrationUpload(
        this.contentFile[0],
        this.mediaFile[0],
        this.selectedModels
      )
      .subscribe(
        (res: any) => {
          this.isLoading = false;
          this.selectedModels = [];

          this.mediaFileName = "";
          this.contentFileName = "";
          this.getMigrationData();
          this.toast.success(res.message, "Success");
        },
        (error) => {
          this.isLoading = false;
          this.toast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.changesDetect.detectChanges();
      });
  }

  validateFile(
    fileArray: File[],
    maxSizeMB: number,
    expectedType: string,
    fileTypeDescription: string
  ): boolean {
    if (!fileArray.length) {
      this.toast.error(`Please upload ${fileTypeDescription} file`, "Error");
      return false;
    }

    const file = fileArray[0];
    const fileSizeInMB = file.size / (1024 * 1024);
    const fileType = file.type;

    if (fileSizeInMB > maxSizeMB) {
      this.toast.error(
        `Please check file size for ${fileTypeDescription}`,
        "Error"
      );
      return false;
    }
    if (!fileType.includes(expectedType)) {
      this.toast.error(
        `Please check file type for ${fileTypeDescription}`,
        "Error"
      );
      return false;
    }

    return true;
  }

  getMigrationData() {
    const pageParams = {
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      locale: this.selectedLocaleFilter || "",
      contentModel: this.selectedContentModelFilter || "",
      file: this.fileNameFilter || "",
      sort: this.sortOrder,
    };

    const contentfulServiceSubs = this.contentService
      .listBulkMigration(pageParams)
      .subscribe((history: any) => {

        if (history && history.data) {
          history.data.forEach(record => {
            record.locale = Array.isArray(record.locale) && record.locale.length 
            ? record.locale.join(', ') 
            : '';
            if (record.createdAt) {
              record.createdAt = moment(record.createdAt).format("YYYY-MM-DD HH:mm:ss A");
            }
          });
        }
        
        this.dataSource = new MatTableDataSource(
          history.data as IMigrationVariable[]
        );
        this.noData = this.dataSource.data.length === 0;
        this.totalCount = history.totalCount;
      })
      .add(() => {
        this.isLoading = false;
        this.changesDetect.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async onPageChange(event: any): Promise<void> {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.getMigrationData();
  }

  searchByName() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.getMigrationData();
    }, 500);
  }

  openSearch() {
    this.isSearch = true;
  }

  async showError(element: any) {
    if (
      this.expandedErrorElement === element ||
      element.status === "COMPLETED"
    ) {
      this.expandedErrorElement = null;
    } else {
      this.expandedErrorElement = element;
      this.currentError = element.formattedErrorLog;
    }
  }

  async showUploadStatus(element: any) {
    if (this.expandedUploadElement === element) {
      this.expandedUploadElement = null;
    } else {
      this.expandedUploadElement = element;

      const status = {
        uploadCount: element.uploadCount,
        totalEntries: element.totalEntryinCsv,
        failedEntries: element.failedCount,
        skippedColumns: element.skippedColumns,
        formattedTableData: element.formattedStatusData,
      };

      this.currentStatus = status;
    }
  }  

  closeSearch() {
    this.isSearch = false;
    this.fileNameFilter = "";
    this.getMigrationData();
  }

  openLocaleFilter() {
    this.isLocaleFilter = true;
  }

  closeLocaleFilter() {
    this.isLocaleFilter = false;
    this.selectedLocaleFilter = "";
    this.getMigrationData();
  }

  filterByLocale() {
    this.getMigrationData();
  }

  sortData(sort: Sort) {
    this.sortOrder = sort.direction == "asc" ? 1 : -1;
    this.getMigrationData();
  }

  openContentFilter() {
    this.isContentFilter = true;
  }

  closeContentFilter() {
    this.isContentFilter = false;
    this.selectedContentModelFilter = "";
    this.getMigrationData();
  }

  filterByContent() {
    this.getMigrationData();
  }

  downloadData(file: any, name: any, type: string) {
    this.isDownLoad = true;
    let payload = {
      file: file,
      type: type,
    };
    const contentfulServiceSubs = this.contentService
      .downloadFile(payload)
      .subscribe(
        (response: any) => {
          this.isDownLoad = false;
          const blob = new Blob([response], { type });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = name;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          this.isDownLoad = false;
          console.error("Error downloading file:", error);
        }
      )
      .add(() => {
        this.isLoading = false;
        this.changesDetect.detectChanges();
        contentfulServiceSubs.unsubscribe();
      });
  }
}
