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
import { debounceTime, distinctUntilChanged, tap, skip } from "rxjs/operators";
import { fromEvent, merge, Subscription } from "rxjs";
// NGRX
import { Store } from "@ngrx/store";

import { get } from "lodash";

// Services
import {
  LayoutUtilsService,
  MessageType,
  QueryParamsModel,
} from "app/core/_base/crud";
// Models
import {
  Role1,
  RolesDataSource,
  RoleDeleted,
  RolesPageRequested,
} from "app/core/auth";
import { AppState } from "app/core/reducers";

// Components
import { RoleEditDialogComponent } from "../role-edit/role-edit.dialog.component";
import { IPermission } from "app/core/auth/_models/permission.model";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";

import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "kt-roles-list",
  templateUrl: "./roles-list.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesListComponent implements OnInit, OnDestroy {
  // Table fields
  safeGet = get;
  dataSource: RolesDataSource;
  totalItemCount = 0;

  displayedColumns = ["select", "role", "actions"];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild("sort1", { static: true }) sort: MatSort;
  // Filter fields
  @ViewChild("searchInput", { static: true }) searchInput: ElementRef;
  // Selection
  selection = new SelectionModel<Role1>(true, []);
  rolesResult: any[] = [];
  roleTemplateData: IPermission[] = [];
  permission: any;

  allPermissions: any[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly store: Store<AppState>,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService,
    private readonly layoutUtilsService: LayoutUtilsService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions;
      })
    );

    // If the user changes the sort order, reset back to the first page.
    const sortSubscription = this.sort.sortChange.subscribe(
      () => (this.paginator.pageIndex = 0)
    );
    if(this.paginator) {
      this.paginator.pageSize = 10;
    }
    
    this.subscriptions.push(sortSubscription);
    

    const paginatorSubscriptions = merge(
      this.sort.sortChange,
      this.paginator.page
    )
      .pipe(
        tap(() => {
          this.loadRolesList();
        })
      )
      .subscribe();
    this.subscriptions.push(paginatorSubscriptions);

    // Filtration, bind to searchInput
    const searchSubscription = fromEvent(
      this.searchInput.nativeElement,
      "keyup"
    )
      .pipe(
        // tslint:disable-next-line:max-line-length
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
          this.loadRolesList();
        })
      )
      .subscribe();
    this.subscriptions.push(searchSubscription);

    // Init DataSource
    this.dataSource = new RolesDataSource(this.store);
    const entitiesSubscription = this.dataSource.rolesSubject
      .pipe(skip(1), distinctUntilChanged())
      .subscribe((res) => {
        this.rolesResult = res.items;
        this.allPermissions = res.allPermissions;
      });
    this.subscriptions.push(entitiesSubscription);

    // First load
    this.loadRolesList();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }

  onPageChange(event: any) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.loadRolesList();
  }


  loadRolesList() {
    this.selection.clear();
    const queryParams = new QueryParamsModel(
      this.filterConfiguration(),
      this.sort.direction,
      this.sort.active,
      this.paginator.pageIndex,
      this.paginator.pageSize
    );
    this.store.dispatch(new RolesPageRequested({ page: queryParams }));
  
    this.selection.clear();
  }

  filterConfiguration(): any {
    const searchText: string = this.searchInput.nativeElement.value;
    
    return searchText;
  }

  deleteRole(_item: Role1) {
    const _title: string = this.translate.instant(
      "USERMANAGEMENT.ROLES.DELETE_ROLE_SIMPLE.TITLE"
    );
    const _description: string = this.translate.instant(
      "USERMANAGEMENT.ROLES.DELETE_ROLE_SIMPLE.DESCRIPTION"
    );
    const _waitDesciption: string = this.translate.instant(
      "USERMANAGEMENT.ROLES.DELETE_ROLE_SIMPLE.WAIT_DESCRIPTION"
    );
    const _deleteMessage: string = this.translate.instant(
      "USERMANAGEMENT.ROLES.DELETE_ROLE_SIMPLE.MESSAGE"
    );

    const dialogRef = this.layoutUtilsService.deleteElement(
      _title,
      _description,
      _waitDesciption
    ).afterClosed().subscribe(
      (res) => {
        if (!res) {
          return;
        }

        this.store.dispatch(new RoleDeleted({ roleName: _item.name }));
        this.layoutUtilsService.showActionNotification(
          _deleteMessage,
          MessageType.Delete
        );
        this.loadRolesList();
      }
    ).add(() => {
      dialogRef.unsubscribe();
    });
  }

  getDistinctRoleNames(): string[] {
    const roleNames = this.rolesResult.map((item) => item.name);
    return Array.from(new Set(roleNames));
  }

  addRole() {
    let newRole = new Role1();
    newRole.clear();

    this.editRole(newRole);
  }

  editRole(role: Role1) {
    let saveMessageTranslateParam = "USERMANAGEMENT.ROLES.EDIT.";
    saveMessageTranslateParam += role._id ? "UPDATE_MESSAGE" : "ADD_MESSAGE";

    const _saveMessage = this.translate.instant(saveMessageTranslateParam);
    const _messageType = role._id ? MessageType.Update : MessageType.Create;

    const dialogRef = this.dialog.open(RoleEditDialogComponent, {
      data: {
        role: role,
        distinctRoleNames: this.getDistinctRoleNames(),
        allPermissions: this.allPermissions
      },
    }).afterClosed().subscribe(
      (res) => {
        if (!res) {
          return;
        }
        this.layoutUtilsService.showActionNotification(
          _saveMessage,
          _messageType
        );
        this.loadRolesList();
      },
      (_: any) => {
        // this is left intentinally
      }
    ).add(() => {
      dialogRef.unsubscribe();
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.rolesResult.length;
    return numSelected === numRows;
  }

  /**
   * Toggle selection
   */
  masterToggle() {
    if (this.selection.selected.length === this.rolesResult.length) {
      this.selection.clear();
    } else {
      this.rolesResult.forEach((row) => this.selection.select(row));
    }
  }
}