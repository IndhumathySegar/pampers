import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
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
  selector: "kt-market-expansion-history",
  templateUrl: "./new-market-translation-history.html",
  styleUrls: ["./new-market-translation-history.component.scss"],
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
export class NewMarketTranslationHistory implements OnInit, OnDestroy {
  marketDataSource: MatTableDataSource<any>;
  isMarketScrolled: boolean = false;
  isMarketLoading: boolean;
  noMarketData: boolean = false;
  totalMarketCount: number = 0;
  private lastFetchTimestamp: number = 0;

  countdownMarketTimers: { [key: string]: number } = {};

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sortNew: MatSort;

  isMarketStopLoading = false;

  displayedMarketColumns: string[] = [
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

  private destroyedNEw$ = new Subject<void>();

  constructor(
    private readonly contentMarketService: ContentfulService,
    private readonly toastMarket: ToastrService,
    private cdrNew: ChangeDetectorRef
  ) {}

  stopMarketJob(dataNew) {
    dataNew.isStopLoading = true;
    this.contentMarketService
      .updateStatus({ _id: dataNew._id })
      .subscribe(
        (res: any) => {
          dataNew.status = "stopped";
          dataNew.isStopLoading = false;

          this.toastMarket.success(res.message);
        },
        (error) => {
          dataNew.isStopLoading = false;
          this.toastMarket.error(error.message || "Unknown Error");          
        }
      )
      .add(() => {
        dataNew.isStopLoading = false;
      });
  }

  ngOnInit(): void {
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.fetchMarketTranslationHistory();

    // Start fetching real-time ETA updates every 10 seconds
    interval(10000)
      .pipe(takeUntil(this.destroyedNEw$))
      .subscribe(() => {
        this.fetchMarketTranslationHistory();
      });
  }

  expandedMarketErrorElement: any;

  toggleMarketErrorExpand(element: any) {
    if (this.expandedMarketErrorElement === element) {
      this.expandedMarketErrorElement = null;
    } else {
      this.expandedMarketErrorElement = element;
    }
  }

  expandedMarketDetails: any;
  toggleMarketDetailsExpand(element: any) {
    if (!!this.expandedMarketDetails && this.expandedMarketDetails._id === element._id) {
      this.expandedMarketDetails = null;
    } else {
      this.expandedMarketDetails = element;
    }

    this.cdrNew.detectChanges();
  }

  getMarketTagsString(elementNew, typeNew) {
    if (!elementNew.byTags) return "N/A";

    if (typeNew === "included") {
      return (elementNew.includedTags || []).join(", ") || "-";
    }

    return (elementNew.excludedTags || []).join(", ") || "-";
  }

  fetchMarketTranslationHistory() {
    const pageNewParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
      cloned: true,
    };

    this.contentMarketService
      .fetchTranslationHistory(pageNewParams)
      .subscribe(
        (res: any) => {
          this.marketDataSource = new MatTableDataSource<any>(res.data);

          // Update countdown timers
          this.updateMarketCountdownTimers();

          if (this.marketDataSource.data.length === 0) {
            this.noMarketData = true;
          }

          if (this.totalMarketCount === 0) {
            this.totalMarketCount = res.totalMarketCount;
          }

          this.isMarketLoading = false;
        },
        (error) => {
          if(error.error.message != "Please accept the terms and condition"){
            this.toastMarket.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        this.cdrNew.detectChanges();
      });
  }

  onMarketPageChange(event: any): void {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.fetchMarketTranslationHistory();
  }

  // Update countdown timers based on row data
  updateMarketCountdownTimers() {
    if (!this.marketDataSource || !this.marketDataSource.data) {
      return;
    }

    this.marketDataSource.data.forEach((rowNew) => {
      if (rowNew.status === "started" && rowNew.eta !== null && rowNew.eta !== 0) {
        // Using a unique identifier as the key
        const key = `${rowNew.content_type}-${rowNew.sourceLocale}-${rowNew.targetLocale}`;
        const startDate = moment(rowNew.jobStartDate);
        const endDate = moment();

        // Calculate the difference in seconds
        const differenceInSeconds = endDate.diff(startDate, "seconds");
        this.countdownMarketTimers[key] = rowNew.eta - differenceInSeconds; // Convert ETA to seconds
        this.startMarketCountdown(key); // Start the countdown for this row
      }
    });
  }

  // Start countdown for a specific row
  startMarketCountdown(key: string) {
    if (this.countdownMarketTimers[key] <= 2) {
      this.fetchMarketTranslationHistory();
      return;
    }

    setTimeout(() => {
      this.countdownMarketTimers[key]--;
      this.cdrNew.detectChanges();
      this.startMarketCountdown(key); // Continue countdown
    }, 1000); // Wait for 1 second before updating the countdown
  }

  generateMarketUniqueKey(row: any): string {
    return `${row.content_type}-${row.sourceLocale}-${row.targetLocale}`;
  }

  formatMarketCountdown(secondsNew: number): string {
    const hoursNew = Math.floor(secondsNew / 3600);
    const minutesNew = Math.floor((secondsNew % 3600) / 60);
    const remainingSecondsNew = Math.round(secondsNew % 60);
    const formattedHoursNew = hoursNew < 10 ? `0${hoursNew}` : `${hoursNew}`;
    const formattedMinutesNew = minutesNew < 10 ? `0${minutesNew}` : `${minutesNew}`;
    const formattedSecondsNew =
    remainingSecondsNew < 10 ? `0${remainingSecondsNew}` : `${remainingSecondsNew}`;
    return `${formattedHoursNew}:${formattedMinutesNew}:${formattedSecondsNew}`;
  }

  ngOnDestroy(): void {
    this.destroyedNEw$.next();
    this.destroyedNEw$.complete();
  }
}