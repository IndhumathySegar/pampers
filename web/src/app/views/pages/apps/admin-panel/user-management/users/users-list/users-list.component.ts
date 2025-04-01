// Angular
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
// Material
import { SelectionModel } from "@angular/cdk/collections";
import {
  MatPaginator,
  MatSort,
  MatDialog,
} from "@angular/material";
// RXJS
import {  distinctUntilChanged, tap, skip } from "rxjs/operators";
import { merge, Subscription } from "rxjs";
// NGRX
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../../../core/reducers";
//File Export Icon
import { faFileExport } from "@fortawesome/free-solid-svg-icons";

// Services
import {
  LayoutUtilsService,
  MessageType,
  QueryParamsModel,
} from "../../../../../../../core/_base/crud";

// Utils
import { get } from "lodash";
// Models
import {
  User,
  UsersDataSource,
  UsersPageRequested,
  UsersExport,
} from "../../../../../../../core/auth";
import { SubheaderService } from "../../../../../../../core/_base/layout";
import { UserEditDialogComponent } from "../user-edit/user-edit.dialog.component";
import { TranslateService } from "@ngx-translate/core";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { AdminPanelService } from '../../../admin-panel.service';
import { AuthService } from '../../../../../../../core/auth/_services/auth.service';
import {Sort} from '@angular/material/sort';
import moment from "moment";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: "kt-users-list",
  templateUrl: "./users-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild("sort1", { static: true }) sort: MatSort;
  @ViewChild("searchInput", { static: true }) searchInput: ElementRef;

  // Table fields
  dataSource: UsersDataSource;
  displayedColumns = [
    "select",
    "email",
    "role",
    "organization",
    "region",
    "market",
    "locale",
    "addedOnDate",
    "lastLoginDate",
    "enabled",
    "actions",
  ];
  searchUserIdText = "";
  searchOrganization = "";
  searchRole="";
  searchStatus="";
  searchLocale="";
  searchMarket="";
  searchRegion="";

  filterStatus = "";
  lastQuery: QueryParamsModel;

  // Selection
  selection = new SelectionModel<User>(true, []);
  usersResult: User[] = [];
  permission: any;

  faFileExport = faFileExport;
  safeGet = get;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  showFilter: boolean = false;
  statusFilter = null;
  marketFilter = null;
  regionFilter = null;
  localeFilter = null;
  userIdFilter = null;
  organizationFilter = null;
  roleFilter = null;
  addDateFilter = null;
  lastLoginDateFilter = null;

  roleList : any = [];
  marketList : any = [];
  regionList : any = [];
  localeList : any = [];
  userIdList : any = [];
  statusList : any = [{"name" : "Active", "value" : true}, {"name" : "In-Active", "value" : false}];
  organizationList: any = [{id : 1, name : "AYM"},{id : 2, name : "P&G"},{id : 3, name : "S&S"},{id : 4, name : "Others"}];

  filteredRoleList : any = [];
  filteredMarketList : any = [];
  filteredRegionList : any = [];
  filteredLocaleList : any = [];
  filteredUserIdList : any = [];
  filteredStatusList : any = [{"name" : "Active", "value" : true}, {"name" : "In-Active", "value" : false}];
  filteredOrganizationList : any = [{id : 1, name : "AYM"},{id : 2, name : "P&G"},{id : 3, name : "S&S"},{id : 4, name : "Others"}];
  filterList: any;
  sortOrder = -1;
  loggedinId: any;
  isLoading : boolean = false;
  constructor(
    private readonly store: Store<AppState>,
    private readonly layoutUtilsService: LayoutUtilsService,
    private readonly subheaderService: SubheaderService,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly adminPanelService: AdminPanelService,
    private readonly auth: AuthService,
    private spinnerService: NgxSpinnerService
  ) { }

  ngOnInit() {
    let loggedinData = localStorage.getItem("_user");
    this.loggedinId = JSON.parse(loggedinData)._id;
    this.subscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions;
      })
    );

    // If the user changes the sort order, reset back to the first page.
    const sortSubscription = this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = 0)
    );
    this.paginator.pageSize = 10;
    this.subscriptions.push(sortSubscription);

    /* Data load will be triggered in two cases:
    - when a pagination event occurs => this.paginator.page
    - when a sort event occurs => this.sort.sortChange
    **/
    const paginatorSubscriptions = merge(
      this.sort.sortChange,
      this.paginator.page
    )
      .pipe(
        tap(() => {
          this.loadUsersList();
        })
      )
      .subscribe();
    this.subscriptions.push(paginatorSubscriptions);

   

    // Set title to page breadCrumbs
    this.subheaderService.setTitle("User management");

    // Init DataSource
    this.dataSource = new UsersDataSource(this.store);
    this.subscriptions.push(
      this.dataSource.entitySubject
        .pipe(skip(1), distinctUntilChanged())
        .subscribe((res) => {
          this.usersResult = res;
        })
    );

    // First Load
    this.loadUsersList();
    this.getAllDropdown();
    this.getMarketList();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }

  onPageChange(event: any) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.loadUsersList();
  }

  loadUsersList() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.filterList = {role: this.roleFilter, userId : this.userIdFilter, status: this.statusFilter, region: this.regionFilter, market: this.marketFilter,  locale: this.localeFilter, addedDate : this.addDateFilter ? moment(this.addDateFilter).format('YYYY-MM-DD') : null, lastLogin: this.lastLoginDateFilter ? moment(this.lastLoginDateFilter).format('YYYY-MM-DD') : null, organization: this.organizationFilter, sortOrder : this.sort.direction ? this.sort.direction : 1, sortBy : this.sort.active ? this.sort.active : "email", timezone: timezone }
    this.selection.clear();
    const queryParams = new QueryParamsModel(
      JSON.stringify(this.filterList),
      this.sort.direction,
      this.sort.active,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    this.store.dispatch(new UsersPageRequested({ page: queryParams }));

    this.selection.clear();
  }

  /** FILTRATION */
  filterConfiguration(): any {
   
    const searchText: string = this.searchInput.nativeElement.value;

    const filter = searchText;
    return filter;
  }

  addUser() {
    const newUser = new User();
    newUser.clear(); // Set all defaults fields
    this.editUser(newUser);
  }

  editUser(model: User) {
    let saveMessageTranslateParam = "USERMANAGEMENT.USERS.EDIT.";
    saveMessageTranslateParam += model._id ? "UPDATE_MESSAGE" : "ADD_MESSAGE";
    const _saveMessage = this.translate.instant(saveMessageTranslateParam);
    const _messageType = model._id ? MessageType.Update : MessageType.Create;
    this.spinnerService.show();      
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      data: { model, permission: this.permission },
    }).afterClosed().subscribe(
      (res) => {
        if (!res) {
          return;
        }
        this.layoutUtilsService.showActionNotification(
          _saveMessage,
          _messageType
        );
        this.getAllDropdown();

        this.loadUsersList();
      },
      (_: any) => {
        // this is left intentionally
      }
    ).add(() => {
      dialogRef.unsubscribe();
    });
  }

  // deleteUser(_item: User) {
  //   const _title = "User Delete";
  //   const _description = "Are you sure to permanently delete this user?";
  //   const _waitDesciption = "User is deleting...";
  //   const _deleteMessage = `User has been deleted`;

  //   const dialogRef = this.layoutUtilsService.deleteElement(
  //     _title,
  //     _description,
  //     _waitDesciption
  //   ).afterClosed().subscribe(
  //     (res) => {
  //       if (!res) {
  //         return;
  //       }

  //       this.store.dispatch(new UserDeleted({ _id: _item._id }));
  //       this.layoutUtilsService.showActionNotification(
  //         _deleteMessage,
  //         MessageType.Delete
  //       );
  //     }
  //   ).add(() => {
  //     dialogRef.unsubscribe();
  //   });
  // }

  deleteUser(_user: User) {
    const _title = "User Delete";
    const _description = "Are you sure to permanently delete this user?";
    const _waitDesciption = "User is deleting...";
    const _deleteMessage = `User has been deleted`;
       const dialogRef = this.layoutUtilsService.deleteElement(
      _title,
      _description,
      _waitDesciption
    ).afterClosed().subscribe(
      (res) => {
        if (!res) {
          return;
        }
        const updateUserSubscription = this.auth
        .deleteUserDetails(_user._id)
        .subscribe(
          (_: any) => {
            this.layoutUtilsService.showActionNotification(
                      _deleteMessage,
                      MessageType.Delete
                    );
                    this.loadUsersList();
          },
          (err: any) => {
          }
        )
        .add(() => {
          updateUserSubscription.unsubscribe();
        });        
      }
    ).add(() => {
      dialogRef.unsubscribe();
    });   
  }
  /**
   * Fetch selected rows
   */
  fetchUsers() {
    const messages = [];
    this.selection.selected.forEach((elem) => {
      messages.push({
        // text: `${elem.firstName}, ${elem.lastName}`,
        text: `${elem.email}`,
        id: elem._id.toString(),
        status: elem.email,
      });
    });
    this.layoutUtilsService.fetchElements(messages);
  }
  /**
   * Export users
   */
  export() {
    this.paginator.pageSize = 50;
    const queryParams = new QueryParamsModel(
      this.filterList,
      this.sort.direction,
      this.sort.active,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );

    this.store.dispatch(new UsersExport({ page: queryParams }));
  }

  /**
   * Check all rows are selected
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.usersResult.length;
    return numSelected === numRows;
  }

  /**
   * Toggle selection
   */
  masterToggle() {
    if (this.selection.selected.length === this.usersResult.length) {
      this.selection.clear();
    } else {
      this.usersResult.forEach((row) => this.selection.select(row));
    }
  }

  getItemStatusString(enabled: boolean = false): string {
    switch (enabled) {
      case true:
        return "Active";
      case false:
        return "In-active";
      default:
        return "Active";
    }
  }
  getItemCssClassByStatus(enabled: boolean = false): string {
    switch (enabled) {
      case true:
        return "success";
      case false:
        return "metal";
      default:
        return "";
    }
  }

  clearSearchInput() {
    this.searchInput.nativeElement.value = "";
    this.loadUsersList();
  }

  get searchInputValue() {
    return this.searchInput ? this.searchInput.nativeElement.value : "";
  }

  filterOptions(searchText, type) {
    const filterValue = searchText.toLowerCase();
    switch (type) {
      case "role":
        this.filteredRoleList = this.roleList.filter(role => {
          return role.name.toLowerCase().includes(filterValue);
        });
        break;

      case "region":
        this.filteredRegionList = this.regionList.filter(region => {
          return region.region.toLowerCase().includes(filterValue) || region.regionCode.toLowerCase().includes(filterValue);
        });
        break;

      case "market":
        this.filteredMarketList = this.marketList.filter(market => {
          return market.name.toLowerCase().includes(filterValue) || market.code.toLowerCase().includes(filterValue);
        });
        break;
        
      
      case "locale":
        this.filteredLocaleList = this.localeList.filter(locale => {
          return locale.name.toLowerCase().includes(filterValue) || locale.code.toLowerCase().includes(filterValue);
        });
        break;
    
      case "user":
        this.filteredUserIdList = this.userIdList.filter(user => {
          return user._id.toLowerCase().includes(filterValue) || user.email.toLowerCase().includes(filterValue);
        });
        break;
    
      case "status":
        this.filteredStatusList = this.statusList.filter(status => {
          return status.name.toLowerCase().includes(filterValue);
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
    this.loadUsersList();
  }

  
  orgValueChange(){
    this.paginator.pageIndex = 0;
    this.loadUsersList();
  }


  openFilter() {
    this.showFilter = true;
  }

  clearFilter(type: string): void {
    switch (type) {
      case 'organization':
        this.searchOrganization = '';
        this.organizationFilter = null;
        this.filteredOrganizationList = this.organizationList
        break;
        
      case 'role':
        this.filteredRoleList = this.roleList
        this.searchRole = '';
        this.roleFilter = null;
        break;
        
      case 'user':
        this.filteredUserIdList = this.userIdList
        this.userIdFilter = null;
        this.searchUserIdText = '';
        break;
        
      case 'status':
        this.filteredStatusList = this.statusList
        this.searchStatus = '';
        this.statusFilter = null;
        break;

      case 'region':
        this.filteredRegionList = this.regionList
        this.searchRegion = '';
        this.regionFilter = null;
        this.marketFilter = null;
        this.localeFilter = null;
        break; 

      case 'market':
        this.filteredMarketList = this.marketList
        this.searchMarket = '';
        this.marketFilter = null;
        this.localeFilter = null;
        break;

      case 'locale':
        this.filteredLocaleList = this.localeList
        this.searchLocale= '';
        this.localeFilter = null;
        break;  

      case 'addDate':
        this.addDateFilter = null;
        break;
        
      case 'lastLoginDate':
        this.lastLoginDateFilter = null;
        break;
        
      default:
        console.warn("Unknown filter type: " + type);
    }
    this.paginator.pageIndex = 0;
    this.loadUsersList();
  }

  closeFilter(event: Event): void {
    event.stopPropagation();
    this.showFilter = false;
    this.organizationFilter = null;
    this.roleFilter = null;
    this.userIdFilter = null;
    this.statusFilter = null;
    this.marketFilter = null;
    this.regionFilter = null;
    this.localeFilter = null;
    this.addDateFilter = null;
    this.lastLoginDateFilter = null;
    this.paginator.pageIndex = 0;
    this.loadUsersList();
  }

  getAllDropdown(){
    const adminPanelServiceSubs = this.adminPanelService
    .getAllDropdown()
    .subscribe((variable: any) => {
      this.roleList = variable.dropdownData.roles.sort((a, b) => a.name.localeCompare(b.name));
      this.userIdList = variable.dropdownData.users;
      this.filteredRoleList = this.roleList;
      this.filteredUserIdList = this.userIdList.sort((a, b) => a.email.localeCompare(b.email));
    })
    .add(() => {
      adminPanelServiceSubs.unsubscribe();
    });
  }

  getMarketList(){
    const adminPanelServiceSubs = this.adminPanelService
    .getUserRegion()
    .subscribe((variable: any) => {
      this.regionList = variable.data.sort((a, b) => a.region.localeCompare(b.region));
      this.filteredRegionList = this.regionList;
    })
    .add(() => {
      adminPanelServiceSubs.unsubscribe();
    });
  }

  changeRegion(){
    let markets = [];
    const regionObj = this.regionList.find(r => r.regionCode === this.regionFilter);
    if (regionObj) {
      markets = markets.concat(regionObj.markets);
    }
    markets = markets.sort((a, b) => a.name.localeCompare(b.name));
    const marketList = markets;
    this.marketList = marketList;
    this.filteredMarketList = marketList;
  }

  changeMarket(){
    let locales = [];
    const marketObj = this.marketList.find(m => m.code ===  this.marketFilter);
    if (marketObj) {
      locales = locales.concat(marketObj.locales);
    }
    locales = locales.sort((a, b) => a.name.localeCompare(b));
    const localeList = locales;
    this.localeList = localeList;
    this.filteredLocaleList = localeList
  }

  sortData(sort: Sort) {
    this.sortOrder = sort.direction == 'asc' ? 1 : -1;
    this.loadUsersList();
  }

  exportData(){
    const pageParams = {
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      filter: JSON.stringify(this.filterList)
    };

    const adminPanelServiceSubs = this.adminPanelService
      .exportUser(pageParams)
      .subscribe((response: any) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = "users.zip"; 
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .add(() => {
        adminPanelServiceSubs.unsubscribe();
      });
  }

  /**
   * show password details
   */
    showPasswordDetails() {
      const messages = [];
        messages.push({
          text: `The exported file is password protected. The generated password will be your userid in lower case followed by the current month in two digits and the current year in two digits. For example, if your userid is "user123@pg.com" and the current date is February 2024, your password will be "user123@pg.com-02-24".`,
          // id: 'your email-current month-current year (pampers@pg.com-06-24)',
          // status: '',
        });
      this.layoutUtilsService.passwordElements(messages).afterClosed().subscribe(
        (res) => {
          if (!res) {
            return;
          }
             this.exportData();  
        }
      ).add(() => {
      });
    }
}
