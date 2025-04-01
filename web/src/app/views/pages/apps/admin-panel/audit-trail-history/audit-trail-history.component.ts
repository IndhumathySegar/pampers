import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material";
import { IMigrationVariable } from "./migration-history";
import { ToastrService } from "ngx-toastr";
import { AdminPanelService } from '../admin-panel.service';
import moment from 'moment';
let ELEMENT_DATA: IMigrationVariable[];
// NGRX
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
// Services
import {
  LayoutUtilsService,
} from "../../../../../core/_base/crud";
@Component({
  selector: 'kt-audit-trail-history',
  templateUrl: './audit-trail-history.component.html',
  styleUrls: ['./audit-trail-history.component.scss'],
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
export class AuditTrailHistoryComponent implements OnInit {
  pageSize = 10;
  isLoading = false;
  pageIndex = 0;
  storedPageIndex = 0;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource<IMigrationVariable>(ELEMENT_DATA);
  totalCount: number = 0;
  noData: boolean = false;
  displayedColumns: string[] = [
    "email",
    "organization",
    // "userStatus",
    // "email",
    "role",
    "module",
    "subModule",
    "action",
    "actionDetails",
    "logDateTime",
  ];
  showFilter: boolean = false;
  moduleFilter = null;
  submoduleFilter = null;
  userIdFilter = null;
  organizationFilter = null;
  roleFilter = null;
  fromDateFilter = null;
  toDateFilter = null;

  roleList : any = [];
  moduleList : any = [];
  userIdList : any = [];
  submoduleList : any = [];
  organizationList: any = [{id : 1, name : "AYM"},{id : 2, name : "P&G"},{id : 3, name : "S&S"},{id : 4, name : "Others"}];
  filteredRoleList : any = [];
  filteredModuleList : any = [];
  filteredUserIdList : any = [];
  filteredSubmoduleList : any = [];
  filteredOrganizationList : any = [{id : 1, name : "AYM"},{id : 2, name : "P&G"},{id : 3, name : "S&S"},{id : 4, name : "Others"}];
  expandedErrorElement: any;
  currentError: any;
  currentErrorType: string;

  constructor(private readonly adminPanelService: AdminPanelService,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly toast: ToastrService,
    private readonly store: Store<AppState>,
    private readonly layoutUtilsService: LayoutUtilsService,
    ) {

  }

  ngOnInit() {
    this.getAllDropdown();
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  getHistoryData() {
    this.noData = false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const pageParams = {
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      module : this.moduleFilter ? this.moduleFilter : '',
      subModule : this.submoduleFilter ? this.submoduleFilter : '',
      fromDate : this.fromDateFilter ? moment(this.fromDateFilter).format('YYYY-MM-DD') : '',
      toDate : this.toDateFilter ?  moment(this.toDateFilter).format('YYYY-MM-DD') : '',
      userId :  this.userIdFilter ? this.userIdFilter : '',
      organization :  this.organizationFilter ? this.organizationFilter : '',
      role:  this.roleFilter ? this.roleFilter : '',
      timezone: timezone
    };

    const adminPanelServiceSubs = this.adminPanelService
      .listAuditTrail(pageParams)
      .subscribe((variable: any) => {
        this.dataSource = new MatTableDataSource(
          variable.data as IMigrationVariable[]
        );

        if (this.dataSource.data.length === 0) {
          this.noData = true;
        }

        this.totalCount = variable.totalCount;
      })
      .add(() => {
        this.isLoading = false;
        this.changesDetect.detectChanges();

        adminPanelServiceSubs.unsubscribe();
      });
  }


  onPageChange(event: any) {
    console.log(event);
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.getHistoryData();
  }

  openFilter() {
    this.showFilter = true;
  }

  clearFilter(type: string): void {
    switch (type) {
      case 'organization':
        this.organizationFilter = null;
        break;
        
      case 'role':
        this.roleFilter = null;
        break;
        
      case 'user':
        this.userIdFilter = null;
        break;
        
      case 'module':
        this.moduleFilter = null;
        this.submoduleList = this.moduleList.flatMap(module => module.subResources);
        this.filteredSubmoduleList = [];
        this.submoduleFilter = null;
        break;
        
      case 'submodule':
        this.submoduleFilter = null;
        break;
        
      case 'fromDate':
        this.fromDateFilter = null;
        break;
        
      case 'toDate':
        this.toDateFilter = null;
        break;
        
      default:
        console.warn("Unknown filter type: " + type);
    }
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  closeFilter(event: Event): void {
    event.stopPropagation();
    this.showFilter = false;
    this.organizationFilter = null;
    this.roleFilter = null;
    this.userIdFilter = null;
    this.moduleFilter = null;
    this.submoduleList = this.moduleList.flatMap(module => module.subResources);
    this.filteredSubmoduleList = [];
    this.submoduleFilter = null;
    this.fromDateFilter = null;
    this.toDateFilter = null;
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  getAllDropdown(){
    const adminPanelServiceSubs = this.adminPanelService
    .getAllDropdown()
    .subscribe((variable: any) => {
      this.roleList = variable.dropdownData.roles.sort((a, b) => a.name.localeCompare(b.name));
      this.userIdList = variable.dropdownData.users.sort((a, b) => a.email.localeCompare(b.email));
      this.moduleList = variable.dropdownData.modules.sort((a, b) => a.displayResourceName.localeCompare(b.displayResourceName));
      this.submoduleList = this.moduleList.flatMap(module => module.subResources);
      this.filteredRoleList = this.roleList.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredModuleList = this.moduleList.sort((a, b) => a.displayResourceName.localeCompare(b.displayResourceName));
      this.filteredUserIdList = this.userIdList.sort((a, b) => a.email.localeCompare(b.email));
    })
    .add(() => {
      this.isLoading = false;
      this.changesDetect.detectChanges();

      adminPanelServiceSubs.unsubscribe();
    });
  }

  moduleChange(module : string){
    this.submoduleList = this.moduleList.filter(x => x.displayResourceName === module).flatMap(module => module.subResources).sort((a, b) => a.displaySubResourceName.localeCompare(b.displaySubResourceName));
    this.filteredSubmoduleList = this.submoduleList;
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  filterOptions(searchText, type) {
    const filterValue = searchText.toLowerCase();
    switch (type) {
      case "role":
        this.filteredRoleList = this.roleList.filter(role => {
          return role.name.toLowerCase().includes(filterValue);
        });
        break;
      
      case "module":
        this.filteredModuleList = this.moduleList.filter(module => {
          return module.displayResourceName.toLowerCase().includes(filterValue);
        });
        break;
    
      case "user":
        this.filteredUserIdList = this.userIdList.filter(user => {
          return user._id.toLowerCase().includes(filterValue) || user.email.toLowerCase().includes(filterValue);
        });
        break;
    
      case "submodule":
        this.filteredSubmoduleList = this.submoduleList.filter(module => {
          return module.displaySubResourceName.toLowerCase().includes(filterValue);
        });
        break;
    
      case "organization":
        this.filteredOrganizationList = this.organizationList.filter(user => {
          return user.name.toLowerCase().includes(filterValue);
        });
        break;
    
      default:
        console.warn("Unknown filter type: " + type);
    }
  }

  selectChange(){
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  exportData(){
    const pageParams = {
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      module : this.moduleFilter ? this.moduleFilter : '',
      subModule : this.submoduleFilter ? this.submoduleFilter : '',
      fromDate : this.fromDateFilter ? this.fromDateFilter : '',
      toDate : this.toDateFilter ? this.toDateFilter : '',
      userId :  this.userIdFilter ? this.userIdFilter : '',
      organization :  this.organizationFilter ? this.organizationFilter : '',
      role:  this.roleFilter ? this.roleFilter : '',
    };

    const adminPanelServiceSubs = this.adminPanelService
      .exportCsv(pageParams)
      .subscribe((response: any) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Audit-trail.zip"; 
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .add(() => {
        this.changesDetect.detectChanges();

        adminPanelServiceSubs.unsubscribe();
      });
  }

  orgValueChange(){
    this.paginator.pageIndex = 0;
    this.getHistoryData();
  }

  showError(element: any) {
    if (this.expandedErrorElement === element) {
      this.expandedErrorElement = null;
    } else {
      this.expandedErrorElement = element;
      this.currentError = element.actionDetails && element.actionDetails.includes("existing") ? JSON.parse(element.actionDetails) : element.actionDetails;
      this.currentErrorType = typeof(this.currentError);
    }
  }

  /**
   * show password details
   */
    showPasswordDetails() {
      const messages = [];
        messages.push({
          text: `The exported file is password protected. The generated password will be your userid in lower case followed by the current month in two digits and the current year in two digits. For example, if your userid is "user123@pg.com" and the current date is February 2024, your password will be "user123@pg.com-02-24".`,
          // id: 'your email-current month-current year (pampers@pg.com-06-24)',
          status: '',
        });
      this.layoutUtilsService.passwordElements(messages).afterClosed().subscribe(
        (res) => {
          if (!res) {           
            return;
          }
          this.exportData();  
        }
      ).add(() => {
      });  ;
    }
}
