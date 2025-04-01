import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { Router } from "@angular/router";

import { ContentfulService } from "../contentful.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import moment from "moment";

let ELEMENT_PAGE_DATA: any[];
@Component({
  selector: "kt-translate-history",
  templateUrl: "./translate-history.component.html",
  styleUrls: ["./translate-history.component.scss"],
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
export class ContentTranslationHistory implements OnInit {
  isPageLoading: boolean = true;
  noPageData: boolean = false;

  ELEMENT_PAGE_DATA: any[];
  dataSource = new MatTableDataSource<any>(ELEMENT_PAGE_DATA);
  totalCount: number = 0;

  displayedTableColumns: string[] = [
    "email",
    "sourceLocale",
    "destLocale",
    "action",
    "entries",
    "status",
    "error",

    "createdAt",
  ];

  expandedElement: any;

  isReviewPage = false;

  isCRM = false;

  @ViewChild(MatPaginator, { static: true }) paginatorNew: MatPaginator;
  @ViewChild(MatSort, { static: true }) pageSort: MatSort;

  constructor(
    private readonly contentService: ContentfulService,
    private readonly cdrChange: ChangeDetectorRef,
    private router: Router,

  ) {}

  ngOnInit(): void {
    this.isReviewPage =  this.router.url.includes("reviewer");
    this.isCRM =  this.router.url.includes("/crm");
    if(this.isReviewPage) {
      this.displayedTableColumns=[
        "email",
        "destLocale",
        "action",
        "entries",
        "status",
        "error",
    
        "createdAt",
      ];
    
    }
    this.paginatorNew.pageSize = 10;
    this.paginatorNew.pageIndex = 0;
    this.getTranslationHistory();
    
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

  formatDateTime(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD HH:mm:ss A");
  }

  getTranslationHistory() {
    const pageParams = {
      pageIndex: this.paginatorNew.pageIndex,
      pageSize: this.paginatorNew.pageSize,
      isReviewPage: this.isReviewPage,
    };

    const contentfulServiceSubs = this.contentService
      .listContentTranlationHistory(pageParams)
      .subscribe((res: any) => {
        this.dataSource = new MatTableDataSource(res.data as any[]);

        if (this.dataSource.data.length === 0) {
          this.noPageData = true;
        }

        if (this.totalCount === 0) {
          this.totalCount = res.totalCount;
        }
      })
      .add(() => {
        this.isPageLoading = false;
        this.cdrChange.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

 

  async onPageChange(event: any): Promise<void> {
    this.paginatorNew.pageIndex = event.pageIndex;
    this.paginatorNew.pageSize = event.pageSize;
    this.getTranslationHistory();
  }
}
