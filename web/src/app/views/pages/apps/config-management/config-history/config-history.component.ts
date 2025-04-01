import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {ConfigManagementService} from '../config-management.service';
import {MatTableDataSource} from '@angular/material/table';
import {MatTabChangeEvent} from '@angular/material/tabs';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {ToastrService} from 'ngx-toastr';
import {faLock, faCopy, faUndo, faCheck, faFile} from '@fortawesome/free-solid-svg-icons';
import {currentUser} from '../../../../../core/auth';
import {Router} from '@angular/router';
import {ConfirmDialogueComponent} from '../confirm-dialogue/confirm-dialogue.component';
import {MatDialog} from '@angular/material/dialog';
import {AppState} from '../../../../../core/reducers';
import {Resources} from '../../../../../constents/resources';
import {Store} from '@ngrx/store';

interface MyResponse {
  status: number;
  message: string;
  history?: Array<History>;
  totalCount: number;
}

export interface History {
  userLogin: string;
  title: string;
  status: string;
  locale: string;
  type: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
  rollBackBy: string;
}

@Component({
  selector: 'kt-config-history',
  templateUrl: './config-history.component.html',
  styleUrls: ['./config-history.component.scss']
})
export class ConfigHistoryComponent implements OnInit, AfterViewInit {
  faUndo = faUndo;
  faCopy = faCopy;
  faCheck = faCheck;
  faFile = faFile;
  faLock = faLock;
  isPermitted = false;
  isLoading = false;
  isRollingBack = false;
  totalCount = 0;
  selectedEnv;
  public selectedMarket = ['narbu', 'eurbu', 'jp'];
  public displayedColumns =
    [
      // 'userLogin',
      // 'title',
      'env',
      'locale',
      'type',
      'provider',
      'createdAt',
      'updatedAt',
      'status',
      'rollBackBy',
      'rollBackAt',
      'update',
    ];

  @ViewChild('tabGroup', {static: true}) tabGroup;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  public dataSource = new MatTableDataSource<History>();
  history = [];

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private readonly toast: ToastrService,
    private appStore: Store<AppState>,
    private readonly configManageService: ConfigManagementService
  ) {
  }

  ngOnInit() {
    this.appStore.select(currentUser).subscribe((user) => {
      user.rolePermissions.forEach((section) => {
        if (section.uniqueResourceName === Resources.configManagement) {
          section.subResources.forEach((subResource) => {
            if (subResource.uniqueSubResourceName === `${Resources.configManagement}:history`) {
              subResource.services.forEach((subSection) => {
                if (subSection.uniqueServiceName === `${Resources.configManagement}:history:rollbackConfig`) {
                  this.isPermitted = true;
                }
              });
            }
          });
        }
      });

      if (!this.isPermitted) { this.isPermitted = false; }
    });

    this.isLoading = true;
    this.paginator.pageSize = 10;
    this.selectedEnv = 'prod';
    this.paginator.pageIndex = 0;
  }

  ngAfterViewInit(): void {
    console.log('afterViewInit => ', this.tabGroup.selectedIndex);
    this.dataSource.sort = this.sort;
    this.fetchConfig('backup')
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    console.log('index => ', tabChangeEvent.index);
    this.paginator.pageSize = 10;
    this.paginator.pageIndex = 0;
    this.isLoading = true;
    this.fetchConfig('backup')
  }

  public doFilter = (value: string) => {
    this.dataSource.filter = value.trim().toLocaleLowerCase();
  }

  onPageChange(event: any) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.dataSource.data = [];
    this.changeDetectorRef.detectChanges();

    this.isLoading = true;
    this.fetchConfig('backup')
  }

  getHistory(res) {
    this.configManageService.clearHistory();
    this.configManageService.saveHistory(res.history);
    const configHistory = [];
    res.history
      .forEach((ele, idx) => {
        const jsonData = {
          userLogin: res.history[idx].userLogin,
          locale: res.history[idx].locale,
          status: res.history[idx].status,
          rollBackBy: res.history[idx].rollBackBy,
          rollBackAt: res.history[idx].rollBackAt,
          type: res.history[idx].type,
          provider: res.history[idx].provider,
          createdAt: res.history[idx].createdAt,
          updatedAt: res.history[idx].updatedAt,
          title: res.history[idx].title,
        };
        configHistory.push(jsonData);
      });

    this.isLoading = false;
    this.dataSource.data = configHistory;
    this.totalCount = res.totalCount;
    this.changeDetectorRef.detectChanges();
  }

  public rollbackConfig = (id: string) => {
    this.isRollingBack = true;
    const rollbackConfig = this.configManageService.getHistoryById(+id);

    const dialogRef = this.dialog.open(ConfirmDialogueComponent, {
      data: {
        message: 'Are you sure you want to rollback to this config?',
        rollback_to_config: rollbackConfig.values,
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        const rollbackService =
          this.configManageService.rollbackConfig(rollbackConfig)
            .subscribe((res: MyResponse) => {
                this.toast.success('Rollback Successful', 'Success');
              },
              (error) => {
                this.toast.error(error.error.message || 'Unknown Error');
              }).add(() => {
            this.changeDetectorRef.detectChanges();
            rollbackService.unsubscribe();
            this.router.navigateByUrl('config-management', ).then(() => {
              this.router.navigate([this.router.url]);
            });
          });
      } else {
        this.isRollingBack = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onEnvChange(env) {
    console.log('selected : ', env.value);
    this.isLoading = true;
    this.paginator.pageIndex = 0;
    this.paginator.pageSize = 10;
    this.fetchConfig('backup');
  }

  fetchConfig(type) {
    const getConfigService = this.configManageService.getConfigHistoryFromApi(
      {
        hub: this.selectedMarket[this.tabGroup.selectedIndex],
        pageSize: this.paginator.pageSize,
        pageIndex: this.paginator.pageIndex,
        env: this.selectedEnv,
        substring: type,
      }
    ).subscribe((res: MyResponse) => {
        this.getHistory(res);
      },
      (error) => {
        this.toast.error(
          error.error.message || 'Unknown Error'
        );
      }).add(() => {
      getConfigService.unsubscribe();
    });
  }
}
