import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {ConfigManagementService} from '../../config-management.service';
import {MatSelectionList} from '@angular/material/list';

@Component({
  selector: 'kt-config-key-table',
  templateUrl: './config-key-table.component.html',
  styleUrls: ['./config-key-table.component.scss']
})
export class ConfigKeyTableComponent implements OnChanges {
  toCloneConfig = new Map();
  selected: any;
  checkedState = false;
  @Input() isLoading: boolean;
  @ViewChild('allSelected', {static: false}) private allSelected: MatSelectionList;
  @Input() categoryKeys;
  @Input() tableId: string;
  @Input() toggled: boolean;
  @Output() isKeySelected = new EventEmitter<boolean>();

  constructor(
    private readonly changesDetect: ChangeDetectorRef,
    private readonly configManageService: ConfigManagementService,
  ) {
    this.toCloneConfig = new Map(Object.entries(this.configManageService.getModifiedConfig()));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('toggled')) {
      if (changes.toggled && this.allSelected) {
        this.allSelected.deselectAll();
      }
      this.checkedState = false;
    }
  }

  selectionChange($event: any) {
    this.toCloneConfig.set(
      $event.option.value,
      !this.toCloneConfig.get($event.option.value)
    );
    if (this.selected.length > 0) {
      this.isKeySelected.emit(true);
    } else {
      this.isKeySelected.emit(false);
    }

    this.checkedState = Object.keys(this.categoryKeys).length === this.selected.length;
    this.configManageService.saveSelectedConfigToClone(this.tableId, this.selected);
  }

  selectAll(val: boolean) {
    if (val) {
      this.allSelected.selectAll();
      this.checkedState = true;
      this.isKeySelected.emit(true);
      this.configManageService.saveSelectedConfigToClone(this.tableId, this.selected);
    } else {
      this.checkedState = false;
      this.allSelected.deselectAll();
      this.configManageService.saveSelectedConfigToClone(this.tableId, this.selected);
      if (Object.keys(this.configManageService.getSelectedConfigToClone()).length === 0) {
        this.isKeySelected.emit(false);
      }
    }
  }
}
