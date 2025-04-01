import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ElementRef
} from "@angular/core";
import { MarketService } from "../market-review.service";
import { Store } from "@ngrx/store";
import { Resources } from "../../../../../constents/resources";

import { currentUser } from "../../../../../core/auth/_selectors/auth.selectors";
import { AppState } from "../../../../../core/reducers";

import { ToastrService } from "ngx-toastr";
import { MatTableDataSource } from "@angular/material/table";
import { Translate } from "./translate-table/market-translate-table.component";
import { MatDialog } from "@angular/material/dialog";
interface MyResponse {
  status: number;
  message: string;
  data;
  translatedValue: [
    {
      key: undefined;
      value: undefined;
      orr: undefined;
    }
  ];
  allEmpty: boolean;
}

@Component({
  selector: "kt-translate",
  templateUrl: "./market-translate.component.html",
  styleUrls: ["./market-translate.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketTranslateComponent implements OnInit {
  sourceLocale = "";
  isLoading = false;
  @ViewChild("searchInput", { static: true }) searchInput: ElementRef;


  enableTranslate: boolean = false;
  enableUpdate: boolean = false;
  showTable = false;
  dataSource;
  pageIndex = 0;
  pageSize = 10;
  storedPageIndex = 0;
  totalCount: number;
  isScrolled = false;
  sourceLocaleOptions: any[] = [];
  environment = "";
  filter = "";

  constructor(
    private readonly contentService: MarketService,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly toast: ToastrService,
    public dialog: MatDialog,
    private store: Store<AppState>
  ) {}

  ngOnInit(): void {
    this.environment = "dev-staging-content";
    this.getPermissions();
  }

  @HostListener("window:scroll")
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  performSearch() {
    this.pageIndex = 0;
    this.storedPageIndex = 0;
  }

  onLocaleChange(event) {
    this.sourceLocale = event.value;

    this.fetchContentModel();
  }

  clearSearchInput() {
    this.searchInput.nativeElement.value = '';
    this.filter='';
    this.fetchContentModel();

  }

  applyFilter(filter) {
    this.pageIndex = 0;
    this.storedPageIndex = 0;
   
    this.filter = filter.trim().toLowerCase();
  }

  getPermissions() {
    this.store.select(currentUser).subscribe((user) => {
      const userPermissions = user ? user.rolePermissions : [];
      userPermissions.some(({ uniqueResourceName, subResources }) => {
        return (
          uniqueResourceName === Resources.marketReview &&
          subResources.length > 0 &&
          subResources.some(({ uniqueSubResourceName, services }) => {
            if (
              uniqueSubResourceName === "marketManagement:locale" &&
              services.length > 0
            ) {
              console.log("services", services);
              this.sourceLocaleOptions = services.map((item) => ({
                regionCode: item.uniqueServiceName,
              }));
            }
          })
        );
      });
    });
  }

  fetchContentModel() {
    this.isLoading = true;
    const contentfulModels = this.contentService
      .fetchContentModel({
        sourceLocale: this.sourceLocale,
        environment: this.environment,
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        filter: this.filter,
      })
      .subscribe(
        (res: any) => {
          this.totalCount = res.total;
          this.dataSource = new MatTableDataSource<Translate>(res.data);
          this.showTable = true;

          this.isLoading = false;
        },
        (error) => {
          this.toast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
        this.changesDetect.detectChanges();
      });
  }

  loadMore(event) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.changesDetect.detectChanges();

    this.storedPageIndex = this.pageIndex;
    this.fetchContentModel();
  }
}
