import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {ContentfulService} from '../contentful.service';
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
import _ from 'lodash';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../../core/reducers';
import {currentUser} from '../../../../../core/auth';
interface MyResponse {
  result: {
    feature: string;
    deeplinks: string;
    sprint: string;
    comments: string;
    createdBy: string;
    createdAt: Date;
  }[];
  message: string;
  commonKeys: object[];
  newVersion: boolean;
}

const DEEPLINK_SCHEMA = {
  US : 'pampersclubusnotif',
  CA : 'pampersclubcanotif',
  DE : 'pampersclubdenotif',
  JP : 'pampersclubjpnotif',
  BR : 'pampersclubbrnotif',
  ES : 'dodotesnotif',
  FR : 'clubpampersfrnotif',
  UK : 'clubpampersuknotif'
};

const DEEPLINK_PREFIX = '://generic?screentoopen=';

@Component({
  selector: 'kt-deeplinks-manage',
  templateUrl: './deeplinks-manage.component.html',
  styleUrls: ['./deeplinks-manage.component.scss']
})
export class DeeplinksManageComponent implements OnInit {
  hideTable = true;
  isLoading = false;
  noNewRow = true;
  versionFetched = false;
  selectedLocale = '';
  currUser = '';
  versions = [];
  initialValues = [];
  data = new MatTableDataSource<any>();
  displayedColumns = ['feature', 'deeplinks', 'sprint', 'comments', 'createdBy', 'createdAt', 'action'];

  deeplinksForm: FormGroup;
  UpdateForm: FormGroup;
  faUndo = faUndo;
  faPlus = faPlus;
  faWrench = faWrench;
  faTrash = faTrash;
  faTrashAlt = faTrashAlt;
  faPenSquare = faPenSquare;
  faSave = faSave;
  faBan = faBan;
  color = '#0abb87';
  checked = false;
  disabled = false;
  allEmpty = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly contentfulService: ContentfulService,
    private readonly toast: ToastrService,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly router: Router,
    private store: Store<AppState>,
  ) {
    this.deeplinksForm = this.formBuilder.group({
      locale: ['us', [Validators.required]],
      version: ['', [Validators.required, Validators.pattern('^[1-9](\\.[1-9]\\d*\\.[1-9]\\d*)*$')]]
    });

    this.data.data = [];
  }

  ngOnInit() {
    this.store.select(currentUser).subscribe((user) => {
      console.log('user : ', user);
      this.currUser = user ? user.firstName + ' ' + user.lastName : '';
    });

    this.UpdateForm = this.formBuilder.group({
      VORows: this.formBuilder.array(
        [{feature: '', deeplinks: '', sprint: '', comments: '', createdBy: '', createdAt: '' }]
          .map((val, index) => this.initiateUpdateForm()
      )) // end of fb array
    }); // end of form group creation

    this.data = new MatTableDataSource((this.UpdateForm.get('VORows') as FormArray).controls);
    this.isLoading = false;
  }

  getVersions(market) {
    console.log('fetching versions for : ', market);
    this.deeplinksForm.controls.version.setValue(null);
    this.deeplinksForm.controls.version.setErrors(null);
    this.versionFetched = false;
    this.isLoading = true;
    this.hideTable = true;
    const getVersionsService = this.contentfulService.getVersions({
      market
    }).subscribe(async (res: MyResponse) => {
        if (Object.keys(res.result).length === 0) {
          this.allEmpty = true;
        } else {
          this.allEmpty = false;
          this.versionFetched = true;
          this.versions = await this.sortVersions(res.result);
          this.selectedLocale = market;
        }
        this.toast.success(res.message);
      },
      (error) => {
        this.toast.error(error.message || 'Unknown Error');
      }).add(() => {
      getVersionsService.unsubscribe();
      this.isLoading = false;
      this.changesDetect.detectChanges();
    });
  }

  getDeeplinks(formData: FormGroup): void {
    if (formData.valid) {
      this.isLoading = true;
      this.hideTable = true;
      const getDeeplinksService = this.contentfulService.getDeeplinks(
        {
          market: formData.value.locale,
          version: formData.value.version
        }
      ).subscribe((res: MyResponse) => {
          console.log('res deeplinks : ', res.result);
          this.initialValues = res.result;
          this.UpdateForm = this.formBuilder.group({
            VORows: this.formBuilder.array(res.result.map((val, index) => this.formBuilder.group({
                feature: new FormControl(val.feature, [Validators.required]),
                deeplinks: new FormControl(val.deeplinks.replace(
                  DEEPLINK_SCHEMA[this.deeplinksForm.value.locale.toUpperCase()] + DEEPLINK_PREFIX,
                  ''), [Validators.required]),
                sprint: new FormControl(val.sprint, [Validators.required]),
                comments: new FormControl(val.comments, [Validators.required]),
                createdBy: new FormControl(val.createdBy),
                createdAt: new FormControl(val.createdAt),
                action: new FormControl('existingRecord'),
                isEditable: new FormControl(true),
              })
            )) // end of fb array
          }); // end of form group creation
          this.data = new MatTableDataSource((this.UpdateForm.get('VORows') as FormArray).controls);
          this.toast.success(res.message);
        },
        (error) => {
          this.toast.error(error.message || 'Unknown Error');
        }).add(() => {
        getDeeplinksService.unsubscribe();
        this.isLoading = false;
        this.hideTable = false;
        this.changesDetect.detectChanges();
      });
    }
  }

  async sortVersions(arr) {
    arr = arr.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

    return arr;
  }

  AddNewRow() {
    this.hideTable = false;
    this.noNewRow = false;
    const control = this.UpdateForm.get('VORows') as FormArray;
    control.insert(0, this.initiateUpdateForm());
    this.initialValues.unshift([{feature: '', deeplinks: '', sprint: '', comments: '', createdBy: '', createdAt: '' }]);
    this.data = new MatTableDataSource(control.controls);
  }

  SaveVO(UpdateFormElement, i) {
    this.noNewRow = true;
    const currentVal = UpdateFormElement.get('VORows').at(i).value;
    if (
      currentVal.action === 'newRecord' || (
      currentVal.feature !== this.initialValues[i].feature ||
      currentVal.deeplinks !== this.initialValues[i].deeplinks ||
      currentVal.sprint !== this.initialValues[i].sprint ||
      currentVal.comments !== this.initialValues[i].comments )
    ) {
      currentVal.createdBy = this.currUser;
      const date = new Date().toISOString();
      const control = this.UpdateForm.get('VORows') as FormArray;
      control.at(i).get('createdAt').patchValue(date);
      control.at(i).get('createdBy').patchValue(this.currUser);
      this.data = new MatTableDataSource(control.controls);
    }

    UpdateFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
    UpdateFormElement.get('VORows').at(i).get('action').patchValue('existingRecord');
    console.log('UpdateFormElement.get(\'VORows\').at(i) : ', UpdateFormElement.get('VORows').at(i).value);
    this.data.data.forEach((ele, idx) => {
      if (UpdateFormElement.get('VORows').at(idx).get('action').value === 'newRecord') {
        this.noNewRow = false;
      }
    });
  }

  CancelSVO(UpdateFormElement, i) {
    if (UpdateFormElement.get('VORows').at(i).value.action !== 'newRecord') {
      // delete if existing Record
      UpdateFormElement.get('VORows').at(i).get('isEditable').patchValue(true);
    } else {
      // delete if new Record
      const control = this.UpdateForm.get('VORows') as FormArray;
      control.removeAt(i);
      this.data = new MatTableDataSource(control.controls);
    }
    if (this.data.data.length === 0) {
      this.emptyForm();
    }
    this.hideTable = this.isEmpty();
  }

  EditSVO(VOFormElement, i) {
    VOFormElement.get('VORows').at(i).get('isEditable').patchValue(false);
  }

  DeleteSVO(UpdateFormElement, i) {
    const control = this.UpdateForm.get('VORows') as FormArray;
    control.removeAt(i);
    this.data = new MatTableDataSource(control.controls);
    if (this.data.data.length === 0) {
      this.emptyForm();
    }
    this.hideTable = this.isEmpty();
  }

  initiateUpdateForm(): FormGroup {
    return this.formBuilder.group({
      feature: new FormControl('', [Validators.required]),
      deeplinks: new FormControl('', [Validators.required]),
      sprint: new FormControl('', [Validators.required]),
      comments: new FormControl('', [Validators.required]),
      createdBy: new FormControl(''),
      createdAt: new FormControl(''),
      action: new FormControl('newRecord'),
      isEditable: new FormControl(false),
    });
  }

  updateDeeplinks() {
    if (this.UpdateForm.valid) {
      this.isLoading = true;
      const deeplinktUpdate = [];
      this.UpdateForm.value.VORows.forEach(row => {
        deeplinktUpdate.push(this.extractDeeplinks(row));
      });

      const manageDeeplinksService = this.contentfulService.manageDeeplinks(
        deeplinktUpdate,
        this.deeplinksForm.value.locale,
        this.deeplinksForm.value.version.replaceAll('.', '-')
      ).subscribe((res: MyResponse) => {
          res.commonKeys.length === 0 && !res.newVersion ?
            this.toast.warning(res.message, 'Not Permitted') :
            this.toast.success(res.message, 'Success');
          this.emptyForm();
          this.hideTable = this.isEmpty();
          this.deeplinksForm.controls.version.setValue(null);
          this.router.navigate(['contentful/deeplinks-view']);
        },
        (error) => {
          console.log('error in updating : ', error);
          if (error.status === 403) {
            this.toast.error('Invalid version number');
          } else {
            this.toast.error(error.message || 'Unknown Error');
          }
        }).add(() => {
        manageDeeplinksService.unsubscribe();
        this.isLoading = false;
        this.changesDetect.detectChanges();
      });
    }
  }

  isEmpty() {
    return this.data.data.length === 0;
  }

  extractDeeplinks(row) {
    if (!row.deeplinks.includes(DEEPLINK_SCHEMA[this.deeplinksForm.value.locale.toUpperCase()])) {
      row.deeplinks = DEEPLINK_SCHEMA[this.deeplinksForm.value.locale.toUpperCase()] + DEEPLINK_PREFIX + row.deeplinks;
    }
    return _.omit(row,
      ['action', 'isEditable']);
  }

  isToggled(event) {
    this.checked = event.checked;
    this.deeplinksForm.controls.version.setValue(null);
    console.log('toggled : ', event.checked);
    console.log('checked : ', this.checked);
    if (event.checked) {
      this.getVersions(this.deeplinksForm.value.locale);
    } else {
      this.emptyForm();
    }
  }

  emptyForm() {
    this.UpdateForm = this.formBuilder.group({
      VORows: this.formBuilder.array(
        [{feature: '', deeplinks: '', sprint: '', comments: '' }]
          .map((val, index) => this.initiateUpdateForm()
          )) // end of fb array
    });
    this.data = new MatTableDataSource((this.UpdateForm.get('VORows') as FormArray).controls);
  }

  ifValidVersion() {
    this.hideTable = !this.deeplinksForm.controls.version.valid;
    if (this.data.data.length < 1) {
      this.emptyForm();
    }
  }
}
