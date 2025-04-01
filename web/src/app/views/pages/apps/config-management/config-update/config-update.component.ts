import {ChangeDetectorRef, Component} from '@angular/core';
import {AppState} from '../../../../../core/reducers';
import {faSearch} from '@fortawesome/free-solid-svg-icons';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {ConfigManagementService} from '../config-management.service';
import {MatTableDataSource} from '@angular/material/table';
import {Store} from '@ngrx/store';
import {ToastrService} from 'ngx-toastr';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: string;
}

interface MyResponse {
  data: {
    ID?: string;
    MISCELLANEOUS?: Array<object>;
  };
  markets: object;
  status: number;
  environments: [];
  message: string;
  allEmpty: boolean;
  categories: [];
}

@Component({
  templateUrl: './config-update.component.html',
  styleUrls: ['./config-update.component.scss']
})
export class ConfigUpdateComponent {
  faSearch = faSearch;
  categoriesFetched = true;
  hideComponent = false;
  configSearchForm: FormGroup; // For Market selection
  hideTable = true;
  isLoading = false;
  category: string[];
  localeFetched = false;
  dataSourceList;
  response = {};
  locales = [];
  envs = [];
  envFetched = false;
  categories = [];
  regions = [];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configManageService: ConfigManagementService,
    private readonly toast: ToastrService,
    private appStore: Store<AppState>,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly router: Router,
  ) {
    this.configSearchForm = this.formBuilder.group({
      locale: ['', [Validators.required]],
      envs: ['', [Validators.required]]
    });

    this.getLocales();
  }

  getLocales() {
    this.isLoading = true;
    const getLocaleService = this.configManageService.getPortalSettings()
      .subscribe((res: MyResponse) => {
          console.log('get locales response : ', res);
          if (Object.keys(res.markets).length > 0) {
            this.localeFetched = true;
            this.locales = this.localeArray(res.markets);
            this.regions = Object.keys(res.markets);
          }
          if (res.environments.length > 0) {
            this.envFetched = true;
            this.envs = res.environments;
          }
          if (res.categories.length > 0) {
            this.categoriesFetched = true;
            this.categories = res.categories;
          }
          this.toast.success(res.message || 'Locale and Environments fetched successfully');
          this.configManageService.saveCategories(res.categories);
        },
        (error) => {
          this.toast.error(error.error.message || 'Unknown Error');
        }).add(() => {
        this.isLoading = false;
        this.changesDetect.detectChanges();
        getLocaleService.unsubscribe();
      });
  }

  localeArray(markets) {
    const resultArray = [];
    for (const key in markets) {
      if (markets.hasOwnProperty(key)) {
        const regions = markets[key];
        regions.forEach(region => {
          resultArray.push(`${key}-${region}`);
        });
      }
    }
    return resultArray;
  }

  getConfig(formData: FormGroup): void {
    if (formData.valid) {
      this.configManageService.clearConfigs({});
      this.configManageService.saveLocale(formData.value.locale);
      this.configManageService.saveEnv(formData.value.envs);
      this.dataSourceList = [];
      this.isLoading = true;
      const getConfigService = this.configManageService.getConfig(
        {
          categories: this.categories,
          environment: formData.value.envs,
          regions: this.regions.map(item => item.toLowerCase()),
          locale: formData.value.locale.replace('-', '_'),
        }
      ).subscribe((res: MyResponse) => {
          if (res.data.hasOwnProperty('ID')) {
            this.configManageService.saveID(res.data.ID);
          } else {
            this.configManageService.saveID('create_new');
          }

          const keys = Object.keys(res.data);
          if (
            keys.length === 2 &&
            res.data.MISCELLANEOUS === [] &&
            res.data.hasOwnProperty('MISCELLANEOUS')
          ) {
            this.configManageService.cloneDataToModifiedConfig({empty: 'empty'});
          } else {
            this.configManageService.cloneDataToModifiedConfig(res.data);
          }

          this.fillDataSource(res);
          this.toast.success(res.message, 'Success');
        },
        (error) => {
          this.toast.error(error.error.message || 'Unknown Error');
        }).add(() => {
        getConfigService.unsubscribe();
      });
    }
  }

  hideEvent(data) {
    this.hideComponent = data;
    this.isLoading = data;
  }

  fillDataSource(res) {
    this.dataSourceList = [];
    this.category = [];
    Object.keys(res.data)
      .reverse()
      .forEach((key) => {
        if (key !== 'ID' && typeof res.data[key] !== 'string') {
          const dataSource = new MatTableDataSource<any>();
          dataSource.data = res.data[key];
          this.dataSourceList.push(dataSource);
          this.category.push(key);
          this.hideTable = false;
          this.isLoading = false;
          this.changesDetect.detectChanges();
        }
      });
  }
}
