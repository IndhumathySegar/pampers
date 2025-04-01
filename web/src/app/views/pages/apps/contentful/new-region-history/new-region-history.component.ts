import { Component, OnInit, ViewChild, ChangeDetectorRef } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { ContentfulService } from "../contentful.service";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import moment from "moment";

let ELEMENT_DATA: any[];
@Component({
  selector: "kt-new-region-history",
  templateUrl: "./new-region-history.component.html",
  styleUrls: ["./new-region-history.component.scss"],
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
export class NewRegionHistory implements OnInit {
  isLoading: boolean = true;
  noData: boolean = false;

  ELEMENT_DATA: any[];
  dataSource = new MatTableDataSource<any>(ELEMENT_DATA);
  totalCount: number = 0;

  displayedColumns: string[] = [
    "email",
   
    "region",
    "details",
    "status",
    "entryCount",
    "error",
    "createdAt",
  ];

  expandedElement: any;

  

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private readonly contentfulService: ContentfulService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.getHistory();
  }

  expandedErrorElement: any;
  expandedFilterElement: any;

  expandedDetailElement: any;
  expandedFilterDetailElement: any;

  toggleErrorExpand(element: any) {
    if (this.expandedErrorElement === element) {
      this.expandedErrorElement = null;
    } else {
      this.expandedErrorElement = element;
      this.expandedFilterElement = null;
    }
  }

  toggleDetailExpand(element: any) {
    if (this.expandedDetailElement === element) {
      this.expandedDetailElement = null;
    } else {
      this.expandedDetailElement = element;
      this.expandedFilterDetailElement = null;
    }
  }

  formatDateTime(createdAt) {
    return moment(createdAt).format("YYYY-MM-DD HH:mm:ss A");
  }

  getStatus(item) {
    if (item.res.every(item => item.type === "created")) {
      return "success";
    }

    if (item.res.every(item => ["error", "existing"].includes(item.type))) {
      return "failure"
    }

    return "partial success";
  }

  getCommentFromType(type) {
    let comment = "Locale has been successfully created.";

    if (type === "error") {
      comment = "Locale creation for this environement has failed."
    }

    if (type === "existing") {
      comment = "Locale already exists for this environemnt."
    }

    return comment;
  }

  getHistory() {
    const pageParams = {
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
    };

    const contentfulServiceSubs = this.contentfulService
      .getRegionMapping(pageParams)
      .subscribe((res: any) => {
        console.log("Respo", res)
        this.dataSource = new MatTableDataSource(
          res.data as any[]
        );

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

        contentfulServiceSubs.unsubscribe();
      });
  }

  async onPageChange(event: any): Promise<void> {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.getHistory();
  }
}
