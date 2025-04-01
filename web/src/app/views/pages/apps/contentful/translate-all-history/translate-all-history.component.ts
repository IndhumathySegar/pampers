import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import * as moment from "moment";
import { ContentfulService } from "../contentful.service";
import { ToastrService } from "ngx-toastr";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { interval, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

@Component({
  selector: 'kt-translate-all-history',
  templateUrl: './translate-all-history.component.html',
  styleUrls: ['./translate-all-history.component.scss'],
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
export class TranslateAllHistoryComponent implements OnInit,OnDestroy {
  dataSource: MatTableDataSource<any>;
  isScrolled: boolean = false;
  isLoading: boolean;
  noData: boolean = false;
  totalCount: number = 0;
  countdownTimers: { [key: string]: number } = {};
  private isComponentDestroyed = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  isStopLoading = false;

  displayedColumns: string[] = [
    "project",
    "sourceLocale",
    "targetLocale",
    "details",
    "status",
    "error",
    "total_entries",
    "total_time_taken",
    "createdAt",
    "initiatedBy",
    "action",
    "stoppedBy",
  ];

  private destroyed$ = new Subject<void>();

  constructor(
    private readonly contentService: ContentfulService,
    private readonly toast: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  stopJob(data) {
    data.isStopLoading = true;
    this.contentService
      .updateStatus({ _id: data._id })
      .subscribe(
        (res: any) => {
          data.status = "stopped";
          data.isStopLoading = false;

          this.toast.success(res.message);
        },
        (error) => {
          data.isStopLoading = false;
          this.toast.error(error.message || "Unknown Error");
        }
      )
      .add(() => {
        data.isStopLoading = false;
      });
  }

  ngOnInit(): void {
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.fetchTranslationHistory();
  
    interval(10000)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => {
        if (!this.isComponentDestroyed) {
          this.fetchTranslationHistory();
        }
      });
  }

  expandedErrorElement: any;

  toggleErrorExpand(element: any) {
    if (this.expandedErrorElement === element) {
      this.expandedErrorElement = null;
    } else {
      this.expandedErrorElement = element;
    }
  }

  expandedDetails: any;
  toggleDetailsExpand(element: any) {
    if (!!this.expandedDetails && this.expandedDetails._id === element._id) {
      this.expandedDetails = null;
    } else {
      this.expandedDetails = element;
    }

    this.cdr.detectChanges();
  }

  getTagsString(element, type) {
    if (!element.byTags) return "N/A";

    if (type === "included") {
      return (element.includedTags || []).join(", ") || "-";
    }

    return (element.excludedTags || []).join(", ") || "-";
  }

  fetchTranslationHistory() {
    if (this.isComponentDestroyed) return;
  
    const pageParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
    };
  
    this.contentService.fetchTranslationHistory(pageParams)
      .subscribe(
        (res: any) => {
          this.dataSource = new MatTableDataSource<any>(res.data);
          this.updateCountdownTimers();
          this.noData = this.dataSource.data.length === 0;
          if (this.totalCount === 0) this.totalCount = res.totalCount;
          this.isLoading = false;
        },
        (error) => {
          if (error.error.message !== "Please accept the terms and condition") {
            this.toast.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        if (!this.isComponentDestroyed) {
          this.cdr.detectChanges();
        }
      });
  }
  

  onPageChange(event: any): void {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.fetchTranslationHistory();
  }

  // Update countdown timers based on row data
  updateCountdownTimers() {
    if (!this.dataSource || !this.dataSource.data) {
      return;
    }

    this.dataSource.data.forEach((row) => {
      if (row.status === "started" && row.eta !== null && row.eta !== 0) {
        // Using a unique identifier as the key
        const key = `${row.content_type}-${row.sourceLocale}-${row.targetLocale}`;
        const startDate = moment(row.jobStartDate);
        const endDate = moment();

        // Calculate the difference in seconds
        const differenceInSeconds = endDate.diff(startDate, "seconds");
        this.countdownTimers[key] = row.eta - differenceInSeconds; // Convert ETA to seconds
        this.startCountdown(key); // Start the countdown for this row
      }
    });
  }

  startCountdown(key: string) {
    if (this.isComponentDestroyed || this.countdownTimers[key] <= 2) {
      return;
    }
  
    setTimeout(() => {
      if (!this.isComponentDestroyed) {
        this.countdownTimers[key]--;
        this.cdr.detectChanges();
        this.startCountdown(key); // Continue countdown
      }
    }, 1000);
  }

  generateUniqueKey(row: any): string {
    return `${row.content_type}-${row.sourceLocale}-${row.targetLocale}`;
  }

  formatCountdown(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds =
      remainingSeconds < 10 ? `0${remainingSeconds}` : `${remainingSeconds}`;
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  ngOnDestroy(): void {
    this.isComponentDestroyed = true;
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
