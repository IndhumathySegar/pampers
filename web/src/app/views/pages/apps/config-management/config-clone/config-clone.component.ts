import {ChangeDetectorRef, Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {faSearch} from '@fortawesome/free-solid-svg-icons';
import {ConfigManagementService} from '../config-management.service';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogueComponent} from '../confirm-dialogue/confirm-dialogue.component';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

interface MyResponse {
  status: number;
  message: string;
  data: {
    ID?: string;
    MISCELLANEOUS?: Array<object>;
  };
  allEmpty: boolean;
  categories: [];
  environments: [];
  markets: object;
}

@Component({
  selector: 'kt-config-clone',
  templateUrl: './config-clone.component.html',
  styleUrls: ['./config-clone.component.scss']
})
export class ConfigCloneComponent {
  faSearch = faSearch;
  fromCloneConfigForm: FormGroup;
  toCloneConfigForm: FormGroup;
  isLoading = false;
  isKeySelected = false;
  hideTable = true;
  allEmpty = false;
  enableToggle = false;
  toggled = false;
  localeFetched = false;
  selected = false;
  envFetched = false;
  categoriesFetched = true;
  category: string[];
  locales = [];
  envs = [];
  categories = [];
  regions = [];
  keyMap = {};
  orrKeyMap = {};
  configs = {};
  details = [];
  toLocale = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly configManageService: ConfigManagementService,
    private readonly toast: ToastrService,
    private readonly changesDetect: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {
    this.isLoading = true;
    this.toCloneConfigForm = this.formBuilder.group({
      envs: ['', [Validators.required]],
      locale: ['', [Validators.required]],
    });
    this.fromCloneConfigForm = this.formBuilder.group({
      envs: ['', [Validators.required]],
      locale: ['', [Validators.required]],
    });

    this.getLocales();
  }

  getLocales() {
    const getLocaleService = this.configManageService.getPortalSettings()
      .subscribe((res: MyResponse) => {
        console.log('getting res : ', res);
        if (Object.keys(res.markets).length > 0) {
          this.regions = Object.keys(res.markets);
          this.locales = this.localeArray(res.markets);
          this.localeFetched = true;
        }
        if (res.environments.length > 0) {
          this.envs = res.environments;
          this.envFetched = true;
        }
        if (res.categories.length > 0) {
          this.categories = res.categories;
          this.categoriesFetched = true;
        }
        this.toast.success(res.message || 'Locale and Environments fetched successfully');
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
    console.log('locale array : ', resultArray);
    return resultArray;
  }

  getConfig(formData: FormGroup): void {
    if (formData.valid) {
      this.configManageService.clearSelectedConfigToClone();
      this.toLocale = '';
      this.details = [];
      this.keyMap = {};
      this.orrKeyMap = {};
      this.enableToggle = false;
      this.isKeySelected = false;
      console.log('fetching config : ', formData.value.locale, formData.value.envs);
      this.configManageService.saveFromCloneEnv(formData.value.envs);
      this.configManageService.saveFromCloneLocale(formData.value.locale);
      this.hideTable = true;
      this.isLoading = true;
      const getConfigService = this.configManageService.getConfig(
        {
          locale: formData.value.locale.replace('-', '_'),
          environment: formData.value.envs,
          regions: this.regions.map(item => item.toLowerCase()),
          categories: this.categories,
        }
      ).subscribe((res: MyResponse) => {
          console.log('fetching response : ', res);
          const keys = Object.keys(res.data);
          if (res.data.hasOwnProperty('ID')) {
            this.configManageService.saveID(res.data.ID);
          } else {
            this.configManageService.saveID('create_new');
          }

          if (
            res.data.hasOwnProperty('MISCELLANEOUS') &&
            keys.length === 2 &&
            res.data.MISCELLANEOUS === []
          ) {
            this.configManageService.cloneDataToModifiedConfig({empty: 'empty'});
          } else {
            this.configManageService.cloneDataToModifiedConfig(res.data);
          }

          this.configs = res.data;
          this.fillKeySource(res);
          this.toast.success(res.message, 'Success');
        },
        (error) => {
          this.toast.error(error.error.message || 'Unknown Error');
      }).add(() => {
        this.changesDetect.detectChanges();
        getConfigService.unsubscribe();
      });
    }
  }

  cloneConfig(formData: FormGroup): void {
    if (formData.valid) {
      const showCloneKeys = {};
      const keys = this.configManageService.getSelectedConfigToClone();
      Object.keys(keys)
        .forEach((table) => {
          if (!showCloneKeys.hasOwnProperty(table)) {
            showCloneKeys[table] = keys[table].join('\n');
          }
        });
      console.log('showCloneKeys : ', showCloneKeys);
      console.log('keys : ', keys);
      const dialogRef = this.dialog.open(ConfirmDialogueComponent, {
        data: {
          clone_keys_per_category: showCloneKeys,
          message: 'Are you sure you want to clone the following?',
        }
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.hideTable = true;
          this.isLoading = true;
          this.changesDetect.detectChanges();
          const to = { locale: formData.value.locale, env: formData.value.envs};
          const from = { locale: this.configManageService.getFromCloneLocale(), env: this.configManageService.getFromCloneEnv()};
          const cloneConfigService = this.configManageService.cloneConfig(
            from,
            to,
            keys,
            this.configs
          ).subscribe((res: MyResponse) => {
              this.toast.success(res.message, 'Success');
              if (Object.keys(res.data).length !== 0) {
                this.showDupKeyModal(res);
              }
            },
            (error) => {
              this.toast.error(error.error.message || 'Unknown Error');
            }).add(() => {
            this.hideTable = false;
            this.isKeySelected = false;
            this.isLoading = false;
            this.changesDetect.detectChanges();
            cloneConfigService.unsubscribe();
            this.configManageService.clearSelectedConfigToClone();
          });
        }
      });
    }
  }

  fillKeySource(res) {
    this.category = [];
    Object.keys(res.data)
      .reverse()
      .forEach((key) => {
        if (key !== 'ID' && typeof res.data[key] !== 'string') {
          this.details.push(`${key} Configs : ${res.data[key].length}`);
          this.hideTable = false;
          this.isLoading = false;
          this.category.push(key);
          this.keyMap[key] = res.data[key];
        }
      });
    if (res.allEmpty) {
      console.log('disabling toggle');
      this.allEmpty = res.allEmpty;
      this.enableToggle = false;
    } else {
      console.log('enabling toggle');
      this.enableToggle = true;
    }
    this.allEmpty = res.allEmpty;
    this.orrKeyMap = this.keyMap;
  }

  showDupKeyModal(res) {
    console.log('Show duplicate key modal');
    const showDuplicate = {};
    Object.keys(res.data)
      .forEach((table) => {
        if (!showDuplicate.hasOwnProperty(table)) {
          showDuplicate[table] = res.data[table].join('\n');
        }
      });
    console.log('duplicate table : ', showDuplicate);
    this.dialog.open(ConfirmDialogueComponent, {
      data: {
        message: 'Following duplicate keys found and were not cloned. Continue?',
        duplicate_keys_present: showDuplicate
      }
    });
  }

  buttonStatus(data) {
    this.isKeySelected = data;
  }

  onSelectCard() {
    this.selected = !this.selected;
  }

  saveLocale($event) {
    this.toLocale = $event.value.toUpperCase();
  }

  toggle(event: MatSlideToggleChange) {
    console.log('Toggle fired ', event.checked);
    this.toggled = false;
    this.isLoading = true;
    this.changesDetect.detectChanges();
    if (event.checked) {
      const toggledMap = {};
      const fromLocale = this.configManageService.getFromCloneLocale().toUpperCase().split('-')[1];
      console.log('fromLocale : ', fromLocale);
      Object.keys(this.keyMap)
        .forEach((table) => {
          if (!toggledMap.hasOwnProperty(table)) {
            toggledMap[table] = [];
          }
          this.keyMap[table].forEach((key, index) => {
            if (key.configKey.includes(fromLocale)) {
              const newKey = key.configKey.replace(fromLocale, this.toLocale.split('-')[1]);
              toggledMap[table].push({configKey: newKey, configValue: key.configValue});
            } else {
              toggledMap[table].push(key);
            }
          });
        });
      this.keyMap = toggledMap;
    } else {
      this.keyMap = this.orrKeyMap;
    }
    this.configManageService.clearSelectedConfigToClone();
    this.isLoading = false;
    this.isKeySelected = false;
    this.toggled = true;
    this.changesDetect.detectChanges();
  }
}
