import {
  Component, EventEmitter,
  Input,
  OnInit, Output,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {MatTableDataSource} from '@angular/material/table';
import _, {cloneDeep} from 'lodash';
import {SelectionModel} from '@angular/cdk/collections';
import {ConfigManagementService} from '../../config-management.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogueComponent} from '../../confirm-dialogue/confirm-dialogue.component';
import {ToastrService} from 'ngx-toastr';
import {
  faUndo,
  faPlus,
  faWrench,
  faTrash,
  faTrashAlt,
  faPenSquare,
  faSave,
  faBan } from '@fortawesome/free-solid-svg-icons';
import {currentUser} from '../../../../../../core/auth';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../../core/reducers';
import {Resources} from '../../../../../../constents/resources';

export interface IPeriodicElement {
  configName: number;
  configKey: string;
  value?: {
    configKey?: string;
    configValue?: string;
  };
}

@Component({
  selector: 'kt-config-table',
  templateUrl: './config-table.component.html',
  styleUrls: ['./config-table.component.scss']
})
export class ConfigTableComponent implements OnInit {
  faUndo = faUndo;
  faPlus = faPlus;
  faWrench = faWrench;
  faTrash = faTrash;
  faTrashAlt = faTrashAlt;
  faPenSquare = faPenSquare;
  faSave = faSave;
  faBan = faBan;
  @Output() updatingEvent = new EventEmitter<boolean>();
  @Input() data = new MatTableDataSource<any>();
  @Input() tableId: string;
  @Input() hideTable: boolean;
  priorEditData = {};
  backupConfig = {};
  backupData = [];

  selection = new SelectionModel<IPeriodicElement>(true, []);
  VOForm: FormGroup;

  displayedColumns = ['select', 'configKey', 'configValue', 'action'];
  displayedColumnsNotPermitted = ['select1', 'configKey1', 'configValue1'];
  disableButtons = false;
  isLoading = true;
  inEditingMode = false;
  isUpdating = false;
  isPermitted = false;
  pageNumber = 1;

  constructor(
    private readonly toast: ToastrService,
    private readonly configManageService: ConfigManagementService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private appStore: Store<AppState>,
  ) {
    this.backupConfig = this.configManageService.getBackupConfig();
  }

  ngOnInit() {
    // call a service to store table data with ID
    this.configManageService.saveComponentData(this.data.data, this.tableId);
    this.configManageService.saveBackupComponentData(this.data.data);
    this.backupData = cloneDeep(this.data.data);

    this.appStore.select(currentUser).subscribe((user) => {
      user.rolePermissions.forEach((section) => {
        this.checkPermission(section);
      });

      if (!this.isPermitted) {
        this.isPermitted = false;
      }
    });

    if (this.isPermitted) {
      this.VOForm = this.formBuilder.group({
        VORows: this.formBuilder.array([])
      });

      this.VOForm = this.formBuilder.group({
        VORows: this.formBuilder.array(this.data.data.map((val, index) => this.formBuilder.group({
            position: new FormControl(index + 1),
            configKey: new FormControl(val.configKey,
              [
                Validators.required,
                Validators.pattern('^[A-Z]+(?:_{0,2}[A-Z0-9]+)*$'),
                this.keyRepeatValidator(index).bind(this)
              ]),
            configValue: new FormControl(val.configValue, [Validators.required]),
            action: new FormControl('existingRecord'),
            isEditable: new FormControl(true),
            isNewRow: new FormControl(false),
          })
        )) // end of fb array
      }); // end of form group creation
      this.isLoading = false;
      this.data = new MatTableDataSource((this.VOForm.get('VORows') as FormArray).controls);

      const filterPredicate = this.data.filterPredicate;
      this.data.filterPredicate = (data: AbstractControl, filter) => {
        return filterPredicate.call(this.data, data.value, filter);
      };
    }
  }

  checkPermission(section) {
    if (section.uniqueResourceName === Resources.configManagement) {
      section.subResources.forEach((subResource) => {
        if (subResource.uniqueSubResourceName === `${Resources.configManagement}:config`) {
          subResource.services.forEach((subSection) => {
            if (subSection.uniqueServiceName === `${Resources.configManagement}:config:updateConfig`) {
              this.isPermitted = true;
            }
          });
        }
      });
    }
  }

  keyRepeatValidator(index): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      if ((
        control.value !== undefined && control.value !== '' && control.parent !== undefined &&
        control.parent.value.isEditable !== undefined && control.parent.value.isEditable === false
      )
      ) {
        let keys = [];
        if (control.parent.value.action === 'newRecord') {
          keys = Object.keys(this.configManageService.getModifiedConfig());
        } else {
          control.parent.parent.value.forEach((config, idx) => {
            if (idx !== index) {
              keys.push(config.configKey);
            }
          });
          // populate the keys from other components
          const allCompData = this.configManageService.getAllComponentData();
          keys = this.populateKeys(allCompData, keys);
        }
        const count = _.countBy(keys);

        if (count.hasOwnProperty(control.value) && control.dirty) {
          control.markAsPristine();
          return {keyRepeat: true};
        }
      }
      return null;
    };
  }

  populateKeys(allCompData, keys) {
    Object.keys(allCompData)
      .forEach((category) => {
        if (category !== this.tableId && allCompData[category].length !== 0) {
          allCompData[category].forEach((config) => {
            keys.push(config.configKey);
          });
        }
      });

    return keys;
  }

  AddNewRow() {
    const control = this.VOForm.get('VORows') as FormArray;
    control.insert(0, this.initiateVOForm());
    this.restructureData(0, false);
    // @ts-ignore
    this.data = new MatTableDataSource(control.controls);
    this.disableButtons = true;
  }

  initiateVOForm(): FormGroup {
    return this.formBuilder.group({
      position: new FormControl(this.data.data.length + 1),
      configKey: new FormControl('',
        [
          Validators.required,
          Validators.pattern('^[A-Z]+(?:_{0,2}[A-Z0-9]+)*$'),
          this.keyRepeatValidator(this.data.data.length + 1).bind(this),
        ]),
      configValue: new FormControl('', [Validators.required]),
      action: new FormControl('newRecord'),
      isEditable: new FormControl(false),
      isNewRow: new FormControl(true),
    });
  }

  restructureData(index, flag: boolean) {
    const data = cloneDeep(this.priorEditData);
    if (flag) {
      Object.keys(data)
        .sort()
        .forEach((key) => {
          if (index < key) {
            data[+key - 1] = data[key];
            delete data[key];
          }
        });
    }

    if (!flag) {
      Object.keys(data)
        .sort()
        .reverse()
        .forEach((key) => {
          data[+key + 1] = data[key];
          delete data[key];
        });
    }
    this.priorEditData = {};
    this.priorEditData = data;
  }

  EditSVO(VOFormElement, i) {
    this.inEditingMode = true;
    this.disableButtons = true;
    this.priorEditData[i] = VOFormElement.get('VORows').at(i).value;
    VOFormElement.get('VORows').at(i).get('isEditable').patchValue(false);
  }

  SaveVO(VOFormElement, i) {
    VOFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
    // if new record
    const objectAdded = VOFormElement.get('VORows').at(i).value;
    objectAdded.configValue = objectAdded.configValue.trim().replace(/(\r\n|\n|\r)/gm, '');
    objectAdded.configValue = objectAdded.configValue.replace(/\s/g, '');
    VOFormElement.get('VORows').at(i).get('configValue').patchValue(objectAdded.configValue);
    if (objectAdded.action === 'newRecord') {
      this.configManageService.addConfig(_.omit(objectAdded,
        ['position', 'action', 'isEditable', 'isNewRow']));
      this.backupData.unshift(_.omit(objectAdded,
        ['position', 'action', 'isEditable', 'isNewRow']));
      this.backupConfig[objectAdded.configKey] = objectAdded.configValue;
    } else {
      if (this.configManageService.getModifiedConfig().hasOwnProperty(objectAdded.configKey)) {
        if (objectAdded.configValue !== this.priorEditData[i].configValue) {
          this.configManageService.addToExistingConfig(_.omit(objectAdded,
            ['position', 'action', 'isEditable', 'isNewRow']));
          if (this.configManageService.getAddedChanges().hasOwnProperty(objectAdded.configKey)) {
            this.configManageService.removeFromAdded(objectAdded.configKey);
          }
        }
      } else {
        this.configManageService.replaceConfig(
          _.omit(this.priorEditData[i],
            ['position', 'action', 'isEditable', 'isNewRow']),
          _.omit(objectAdded,
          ['position', 'action', 'isEditable', 'isNewRow'])
        );
      }
    }

    VOFormElement.get('VORows').at(i).get('action').patchValue('existingRecord');
    this.configManageService.saveComponentData(this.getCurrComponentData(), this.tableId);

    if (this.selection.selected.includes(VOFormElement.get('VORows').at(i))) {
      const idx = this.selection.selected.indexOf(VOFormElement.get('VORows').at(i));
      this.selection.selected.splice(idx, 1);
      this.selection.clear();
    }

    this.disableButtons = false;
    // @ts-ignore
    this.data.filter = ' ';
    this.inEditingMode = false;
  }

  CancelSVO(VOFormElement, i) {
    if (VOFormElement.get('VORows').at(i).value.action !== 'newRecord') {
      // delete if existing Record
      VOFormElement.get('VORows').at(i).get('configKey').patchValue(this.priorEditData[i].configKey);
      VOFormElement.get('VORows').at(i).get('configValue').patchValue(this.priorEditData[i].configValue);
      VOFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
      delete this.priorEditData[i];
    } else {
      // delete if new Record
      const control = this.VOForm.get('VORows') as FormArray;
      control.removeAt(i);
      // @ts-ignore
      this.data = new MatTableDataSource(control.controls);
    }

    if (this.selection.selected.includes(VOFormElement.get('VORows').at(i))) {
      const idx = this.selection.selected.indexOf(VOFormElement.get('VORows').at(i));
      this.selection.selected.splice(idx, 1);
      this.selection.clear();
    }

    this.disableButtons = false;
    this.inEditingMode = false;
  }

  DeleteSVO(VOFormElement, i) {
    const control = this.VOForm.get('VORows') as FormArray;
    const objectDeleted = VOFormElement.get('VORows').at(i).value;
    this.configManageService.removeConfig(_.omit(objectDeleted,
      ['position', 'action', 'isEditable', 'isNewRow']));
    if (this.selection.selected.includes(VOFormElement.get('VORows').at(i))) {
      const idx = this.selection.selected.indexOf(VOFormElement.get('VORows').at(i));
      this.selection.selected.splice(idx, 1);
      this.selection.clear();
    }
    control.removeAt(i);
    this.backupData.splice(i, 1);
    this.configManageService.saveComponentData(this.getCurrComponentData(), this.tableId);
    // readjust priorEditData
    this.restructureData(i, true);
    // @ts-ignore
    this.data = new MatTableDataSource(control.controls);
  }

  RollBack(VOFormElement, i) {
    // check if key exists
    if (!this.configManageService.getBackupConfig().hasOwnProperty(VOFormElement.get('VORows').at(i).get('configKey').value)) {
      console.log('key not found in orr config map : ', VOFormElement.get('VORows').at(i).get('configKey').value);
      this.configManageService.removeConfig(
        {
          configKey : VOFormElement.get('VORows').at(i).get('configKey').value,
          configValue : VOFormElement.get('VORows').at(i).get('configValue').value
        }
      );
    }

    this.configManageService.addToExistingConfig(
      {
        configKey : this.backupData[i].configKey,
        configValue : this.backupData[i].configValue
      });
    VOFormElement.get('VORows').at(i).get('configKey').patchValue(this.backupData[i].configKey);
    VOFormElement.get('VORows').at(i).get('configValue').patchValue(this.backupData[i].configValue);
    this.configManageService.saveComponentData(this.getCurrComponentData(), this.tableId);
  }

  enableDelete() {
    return this.selection.selected.length >= 1;
  }

  deleteSelected() {
    const bulkDelete = {};
    for ( const selected of this.selection.selected) {
      bulkDelete[selected.value.configKey] = selected.value.configValue;
    }
    const dialogRef = this.dialog.open(ConfirmDialogueComponent, {
      data: {
        message: 'Are you sure you want to delete the following?',
        delete_multiple_configs: bulkDelete,
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.isUpdating = true;
        this.updatingEvent.emit(this.isUpdating);
        for ( const selected of this.selection.selected) {
          const index: number = this.data.data.findIndex(d => d === selected.value);
          this.data.data.splice(index, 1);
          const newData = this.data.data;
          this.data = new MatTableDataSource<any>(newData);
          const objectDeleted = selected.value;
          this.configManageService.removeConfig(_.omit(objectDeleted,
            ['position', 'action', 'isEditable', 'isNewRow']));
        }
        this.isUpdating = false;
        this.updatingEvent.emit(this.isUpdating);
        this.configManageService.saveComponentData(this.getCurrComponentData(), this.tableId);
        this.selection.clear();
      }
    });
  }

  UpdateConfig() {
    this.configManageService.cloneModifiedToTemp(this.configManageService.getModifiedConfig());
    // Change format of Config to Array of objects
    const dialogRef = this.dialog.open(ConfirmDialogueComponent, {
      data: {
        isPrior: true,
        message: 'Are you sure about the following modifications?',
        added_configs: this.configManageService.getAddedChanges(),
        deleted_configs: this.configManageService.getDeletedChanges(),
        modified_configs: this.configManageService.getExistingChanges(),
        backup_configs: this.configManageService.getBackupConfig(),
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        let [commonKeys, deletedKeys] = this.modifyCommonKeys();
        if (Object.keys(commonKeys).length > 0 || Object.keys(deletedKeys).length > 0) {
          [commonKeys, deletedKeys] = this.showCommonModalAndUpdate(commonKeys, deletedKeys);
          console.log('reset common and deleted keys to ', commonKeys, deletedKeys);
        } else {
          const localeEnv = { locale: this.configManageService.getLocale().replace('-', '_'),
            env: this.configManageService.getEnv()};
          this.isUpdating = true;
          this.updatingEvent.emit(this.isUpdating);
          const updateConfigService = this.configManageService.updateConfig(
            this.configManageService.getBackupConfig(),
            this.configManageService.getModifiedConfig(),
            {},
            {},
            localeEnv,
            this.configManageService.getID(),
            this.configManageService.getCategories()
          )
            .subscribe((res: Response) => {
                this.configManageService.saveBackupComponentData(this.data.data);
                this.configManageService.clearConfigs(this.configManageService.getTempConfig());
                this.selection.clear();
              },
              (error) => {
                this.toast.error(error.error.message || 'Unknown Error');
              }).add(() => {
              updateConfigService.unsubscribe();
              this.toastSuccess();
            });
        }
      }
    });
  }

  showCommonModalAndUpdate(commonKeys, deletedKeys) {
    const commonDialogRef = this.dialog.open(ConfirmDialogueComponent, {
      data: {
        isPrior: true,
        message: 'Are you sure about updating common keys as it will update across all markets?',
        common_keys_modified: Object.keys(commonKeys).length > 0 ? commonKeys : {},
        common_keys_deleted: Object.keys(deletedKeys).length > 0 ? deletedKeys : {},
        backup_configs: this.configManageService.getBackupConfig(),
      }
    });
    commonDialogRef.afterClosed().subscribe((commonConfirmed: boolean) => {
      if (commonConfirmed) {
        const localeEnv = { locale: this.configManageService.getLocale().replace('-', '_'),
          env: this.configManageService.getEnv()};
        this.isUpdating = true;
        this.updatingEvent.emit(this.isUpdating);
        const updateConfigService = this.configManageService.updateConfig(
          this.configManageService.getBackupConfig(),
          this.configManageService.getModifiedConfig(),
          Object.keys(commonKeys).length > 0 ? commonKeys : {},
          Object.keys(deletedKeys).length > 0 ? deletedKeys : {},
          localeEnv,
          this.configManageService.getID(),
          this.configManageService.getCategories()
        )
          .subscribe((res: Response) => {
              deletedKeys = {};
              commonKeys = {};
              console.log('saving backupCommonData : ', this.getCurrComponentData());
              this.configManageService.saveBackupComponentData(this.getCurrComponentData());
              this.configManageService.clearConfigs(this.configManageService.getTempConfig());
              this.selection.clear();
            },
            (error) => {
              this.toast.error(error.error.message || 'Unknown Error');
            }).add(() => {
            updateConfigService.unsubscribe();
            this.toastSuccess();
          });
      }
    });

    return [commonKeys, deletedKeys];
  }

  toastSuccess() {
    this.isUpdating = false;
    this.updatingEvent.emit(this.isUpdating);
    this.backupConfig = this.configManageService.getBackupConfig();
    this.toast.success('Config Updated Successfully', 'Success');
  }

  doFilter = (value: string) => {
    this.data.filter = value.trim().toLocaleLowerCase();
  }

  isUpdateEnabled() {
    console.log('is updated enabled : ',
        Object.keys(this.configManageService.getExistingChanges()).length !== 0,
        Object.keys(this.configManageService.getAddedChanges()).length !== 0,
        Object.keys(this.configManageService.getDeletedChanges()).length !== 0,
      JSON.stringify(this.configManageService.getModifiedConfig()), JSON.stringify(this.configManageService.getBackupConfig()));
    return (
      (
        Object.keys(this.configManageService.getExistingChanges()).length !== 0 ||
        Object.keys(this.configManageService.getAddedChanges()).length !== 0 ||
        Object.keys(this.configManageService.getDeletedChanges()).length !== 0
      )
    );
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    let endIndex: number;
    endIndex = this.data.data.length;

    return numSelected === endIndex;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() : this.selectRows();
  }

  selectRows() {
    let endIndex: number;
    endIndex = this.data.data.length;

    for (let index = 0; index < endIndex; index++) {
      this.selection.select(this.data.data[index]);
    }
  }

  getCurrComponentData() {
    const componentData = [];
    this.data.data
      .forEach(
        (ele) => {
          componentData.push((_.omit(ele.value, ['position', 'action', 'isEditable', 'isNewRow'])));
        }
      );

    return componentData;
  }

  modifyCommonKeys() {
    const locale = this.configManageService.getLocale().toUpperCase().replace('-', '_').split('_')[1];
    console.log('locale selected : ', locale);
    const config = this.configManageService.getModifiedConfig();
    console.log('modified config : ', config);
    const backupConfig = this.configManageService.getBackupConfig();
    console.log('backup config : ', backupConfig);
    const commonConfig = this.configManageService.getBackupCommonData();
    console.log('common keys : ', commonConfig);
    const commonData = {};
    const deletedData = {};
    _.union(Object.keys(config), Object.keys(backupConfig))
      .forEach((ele) => {
        if (!ele.includes(locale)) {
          // key exists already in common
          if (commonConfig.hasOwnProperty(ele) && config.hasOwnProperty(ele) && commonConfig[ele] !== config[ele]) {
            commonData[ele] = config[ele];
          }
          // new key is added, check if added as common key
          if (!commonConfig.hasOwnProperty(ele) && !backupConfig.hasOwnProperty(ele)) {
            commonData[ele] = config[ele];
          }
          // if a key is deleted
          if (!config.hasOwnProperty(ele) && backupConfig.hasOwnProperty(ele)) {
            deletedData[ele] = backupConfig[ele];
          }
        }
      });
    return [commonData, deletedData];
  }
}
