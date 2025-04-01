import {ChangeDetectorRef, Component} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ContentfulService} from '../contentful.service';
import {ToastrService} from 'ngx-toastr';

interface MyResponse {
  result: [];
  message: string;
  commonKeys: object[];
}

@Component({
  selector: 'kt-deeplinks-view',
  templateUrl: './deeplinks-view.component.html',
  styleUrls: ['./deeplinks-view.component.scss']
})
export class DeeplinksViewComponent {
  versionFetched = false;
  hideTable = true;
  isLoading = false;
  allEmpty = false;
  selectedLocale = '';
  versions = [];
  data = new MatTableDataSource<any>();
  displayedColumns = ['feature', 'deeplinks', 'sprint', 'comments', 'createdBy', 'createdAt'];

  deeplinksForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly contentfulService: ContentfulService,
    private readonly toast: ToastrService,
    private readonly changesDetect: ChangeDetectorRef,
  ) {
    this.deeplinksForm = this.formBuilder.group({
      locale: ['us', [Validators.required]],
      version: ['', [Validators.required]]
    });

    this.getVersions(this.deeplinksForm.value.locale);
    this.selectedLocale = 'us';
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
        this.data.data = res.result;
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
}
