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
export class CrmContentTranslationHistory implements OnInit {
  isCrmPageLoading: boolean = true;
  noCrmPageData: boolean = false;

  ELEMENT_PAGE_DATA: any[];
  crmDataSource = new MatTableDataSource<any>(ELEMENT_PAGE_DATA);
  totalCrmCount: number = 0;

  displayedCrmTableColumns: string[] = [
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

  isCrmReviewPage = false;

  isCRM = false;

  @ViewChild(MatPaginator, { static: true }) crmPaginatorNew: MatPaginator;
  @ViewChild(MatSort, { static: true }) crmPageSort: MatSort;

  constructor(
    private readonly crmContentService: ContentfulService,
    private readonly crmCdrChange: ChangeDetectorRef,
    private crmRouter: Router,

  ) {}

  ngOnInit(): void {
    this.isCrmReviewPage =  this.crmRouter.url.includes("reviewer");
    this.isCRM =  this.crmRouter.url.includes("/crm");

    if(this.isCrmReviewPage) {
      this.displayedCrmTableColumns=[
        "email",
        "destLocale",
        "action",
        "entries",
        "status",
        "error",
        "createdAt",
      ];
    }

    this.crmPaginatorNew.pageSize = 10;
    this.crmPaginatorNew.pageIndex = 0;
    this.getCrmTranslationHistory();
    
  }

  expandedCrmErrorElement: any;
  expandedCrmFilterElement: any;

  toggleCrmErrorExpand(element: any) {
    if (this.expandedCrmErrorElement === element) {
      this.expandedCrmErrorElement = null;
    } else {
      this.expandedCrmErrorElement = element;
      this.expandedCrmFilterElement = null;
    }
  }

  formatCrmDateTime(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD HH:mm:ss A");
  }

  getCrmTranslationHistory() {
    const pageParams = {
      pageIndex: this.crmPaginatorNew.pageIndex,
      pageSize: this.crmPaginatorNew.pageSize,
      isReviewPage: this.isCrmReviewPage,
    };

    const crmContentfulServiceSubs = this.crmContentService
      .listCrmContentTranlationHistory(pageParams)
      .subscribe((res: any) => {
        this.crmDataSource = new MatTableDataSource(res.data as any[]);

        if (this.crmDataSource.data.length === 0) {
          this.noCrmPageData = true;
        }

        if (this.totalCrmCount === 0) {
          this.totalCrmCount = res.totalCount;
        }
      })
      .add(() => {
        this.isCrmPageLoading = false;
        this.crmCdrChange.detectChanges();

        crmContentfulServiceSubs.unsubscribe();
      });
  }



  async onCrmPageChange(event: any): Promise<void> {
    this.crmPaginatorNew.pageIndex = event.pageIndex;
    this.crmPaginatorNew.pageSize = event.pageSize;
    this.getCrmTranslationHistory();
  }
}
