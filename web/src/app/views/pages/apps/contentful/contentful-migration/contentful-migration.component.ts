import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@env/environment";
import { FormGroup, Validators, FormBuilder, ValidatorFn, ValidationErrors } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { MatDatepicker, MatDialog, MatOption } from "@angular/material";
import { ContentfulService } from "../contentful.service";
import { Subscription } from "rxjs";
import { get } from "lodash";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { DatePipe } from "@angular/common";
import { ConfirmMigrationDialogComponent } from "../confirm-migration/confirm-migration.dialog.component";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: "kt-contentful-migration",
  templateUrl: "./contentful-migration.component.html",
  styleUrls: ["./contentful-migration.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentfulMigrationComponent implements OnInit {
  safeGet = get;
  projects: any = [];
  environments: any = environment.LOCALE_ENVIRONMENTS;
  toEnvironments: any = [];
  includeTags: any = [];
  excludeTags: any = [];
  filteredTagList: any = [];
  filteredexTagList: any = [];
  migrateFromDate: Date;
  currentSpaceId = "";
  currentEnvironmentId = "";
  isCRM = false;
  migrationForm: FormGroup;
  subscriptions: Subscription[] = [];
  permission: any;

  // loaders
  isSpaceLoading: boolean = false;
  isEnvironmentLoading: boolean = false;
  isTagsLoading: boolean = false;
  isModelLoading: boolean = false;
  contentModels: any = [];
  filteredModelList: any = [];
  sourceLocaleOptions: any = [];

  userRegion: any = [];
  filteredRegionList: any = [];
  marketList: any = [];
  filteredMarketList: any = [];
  localeList: any = [];
  filteredLocaleList: any = [];
  isLocaleChecked: boolean = false;
  isModelChecked: boolean = false;
  isTagChecked: boolean = false;
  isexTagChecked: boolean = false;
  @ViewChild("allSelected", { static: true }) allSelected: MatOption;
  @ViewChild("allSelected2", { static: true }) allSelected2: MatOption;
  @ViewChild("allModelSelected", { static: true }) allModelSelected: MatOption;
  @ViewChild("allLocalesSelected", { static: true }) allLocalesSelected: MatOption;
  @ViewChild('migrateFromDatePicker', { static: true }) migrateFromDatePicker!: MatDatepicker<Date>;

  disableMigrateCTA: boolean = false;

  constructor(
    private store: Store<AppState>,
    public contenfulService: ContentfulService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe,
    private router: Router,
    private readonly dialog: MatDialog,
    private spinnerService: NgxSpinnerService
  ) {
    this.isCRM = this.router.url.startsWith("/crm");

    this.migrationForm = this.formBuilder.group({
      region: [{ value: "", disabled: false }, [Validators.required]],
      markets: [{ value: "", disabled: false }, [Validators.required]],
      includeTags: [{ value: [], disabled: false }],
      excludeTags: [{ value: [], disabled: false }],
      migrateFromDate: ["", [Validators.required]],
      contentModels: [{ value: [], disabled: false }],
      localesToMigrate: [{ value: '', disabled: false }, [Validators.required]],
      isRollBack:[{ value: true, disabled: false }]
    }, {
      validators: this.atLeastOneFieldValidator('contentModels', 'includeTags', 'excludeTags')
    });

    this.subscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions;
      })
    );
  }

  atLeastOneFieldValidator(...fields: string[]): ValidatorFn {
    return (formGroup: FormGroup): ValidationErrors | null => {
      const hasAtLeastOne = fields.some(field => {
        const control = formGroup.get(field);
        return control && Array.isArray(control.value) ? control.value.length > 0 : !!control.value;
      });
  
      return hasAtLeastOne ? null : { atLeastOneRequired: true };
    };
  }

  fetchContentModel() {
    this.isModelLoading = true;
    const contentfulModels = this.contenfulService
      .fetchMigrationModel(this.currentSpaceId, this.currentEnvironmentId)
      .subscribe(
        (res: any) => {
          this.sourceLocaleOptions = Array.from(res.region || []);

          this.contentModels = res.contentModel.sort((a, b) => a.modelName.localeCompare(b.modelName));
          this.filteredModelList = res.contentModel.sort((a, b) => a.modelName.localeCompare(b.modelName));
          this.isModelLoading = false;
          this.cdr.detectChanges();
        },
        (error) => {

        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
      });
  }

  ngOnInit(): void {
    this.getSpaces();
    this.getUserRegion();
  }

  async getSpaces(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .getProjects(this.isCRM)
      .subscribe((res: any) => {
        this.projects = res.items;
        this.currentSpaceId = this.projects[0].sys.id;
        this.getTags(this.environments[0])
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getEnvironments(spaceId: string): Promise<void> {
    this.isEnvironmentLoading = true;
    this.cdr.detectChanges();
    const contentfulServiceSubs = this.contenfulService
      .getEnvironments({ spaceId, isCRM: this.isCRM })
      .subscribe((res: any) => {
        this.environments = res.items;
        if (!this.isCRM && (environment.env === 'prod' || environment.env === 'us-prod')) {
          this.environments = [{ name: "staging" }]
        }
        this.currentSpaceId = spaceId;
      })
      .add(() => {
        this.isEnvironmentLoading = false;
        this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getTags(environmentId): Promise<void> {
    this.isTagsLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .getTags({ spaceId: this.currentSpaceId, environmentId })
      .subscribe(
        (res: any) => {
          this.includeTags = res.items.sort((a, b) => a.name.localeCompare(b.name));
          this.excludeTags = res.items.sort((a, b) => a.name.localeCompare(b.name));
          this.filteredTagList = res.items.sort((a, b) => a.name.localeCompare(b.name));
          this.filteredexTagList = res.items.sort((a, b) => a.name.localeCompare(b.name));
          this.currentEnvironmentId = environmentId;
          this.toEnvironments = this.environments.filter(
            (item) => item.name !== environmentId && item.name !== "crm-sit"
          );
          if (!this.isCRM && (environment.env === 'prod' || environment.env === 'us-prod')) {
            this.toEnvironments = [{ name: "master" }]
          }
          this.fetchContentModel()
        },
        (_) => {
          // This is left intentionally
        }
      )
      .add(() => {
        this.isTagsLoading = false;
        this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async tosslePerOne(): Promise<boolean | undefined> {
    if (this.allSelected.selected) {
      this.allSelected.deselect();
      this.cdr.detectChanges();
      return false;
    }
    if (this.migrationForm.controls.includeTags) {
      if (
        this.migrationForm.controls.includeTags.value.length ==
        this.includeTags.length
      ) {
        this.allSelected.select();
      }
    }


    this.cdr.detectChanges();
  }

  async tossleModelSelection(): Promise<void> {
    if (this.allModelSelected.selected) {
      this.migrationForm.controls.contentModels.patchValue(
        [0].concat(this.contentModels.map((item) => item.modelId))
      );
      delete this.migrationForm.controls.contentModels[0]
    } else {
      this.migrationForm.controls.contentModels.patchValue([]);
    }
  }

  async tossleLocaleSelection(): Promise<void> {
    if (this.allLocalesSelected.selected) {
      this.migrationForm.controls.localesToMigrate.patchValue(
        [0].concat(this.sourceLocaleOptions.map((item) => item))
      );
    } else {
      this.migrationForm.controls.localesToMigrate.patchValue([]);
    }
  }

  async tosslePerOne2(): Promise<boolean | undefined> {
    if (this.allSelected2.selected) {
      this.allSelected2.deselect();
      this.cdr.detectChanges();
      return false;
    }
    if (
      this.migrationForm.controls.excludeTags.value.length ==
      this.excludeTags.length
    ) {
      this.allSelected2.select();
    }

    this.cdr.detectChanges();
  }

  async toggleAllSelection(): Promise<void> {
    if (this.allSelected.selected) {
      this.migrationForm.controls.includeTags.patchValue(
        [0].concat(this.includeTags.map((item) => item.sys.id))
      );
    } else {
      this.migrationForm.controls.includeTags.patchValue([]);
    }
  }

  async toggleAllSelection2(): Promise<void> {
    if (this.allSelected2.selected) {
      this.migrationForm.controls.excludeTags.patchValue(
        [0].concat(this.excludeTags.map((item) => item.sys.id))
      );
    } else {
      this.migrationForm.controls.excludeTags.patchValue([]);
    }
  }

  constructPayload(selectedModelNames,selectedTagNames,selectedExTagNames,selectedRegionNames, selectedMarketNames, formValue){
    const modalData = {
      contentModels: selectedModelNames,
      includeTags: selectedTagNames,
      excludeTags: selectedExTagNames,
      region: selectedRegionNames,
      markets: selectedMarketNames,
      localesToMigrate: formValue.localesToMigrate,
      migrateFromDate: formValue.migrateFromDate,
      isRollBack : formValue.isRollBack ? "Yes" : "No"
    };
  
    const payload = {
      spaceId: this.currentSpaceId,
      project: this.projects[0].name,
      migrateFromDate: formValue.migrateFromDate,
      region: formValue.region,
      market: formValue.markets,
      localesToMigrate: formValue.localesToMigrate || [],
      contentModels: formValue.contentModels || [],
      includeTags: formValue.includeTags ? formValue.includeTags.join(',') : '',
      excludeTags: formValue.excludeTags ? formValue.excludeTags.join(',') : '',
      isCRM:  this.isCRM ? true : false,
      isRollBack : formValue.isRollBack 
    };

    const finalPayload = {
      modalData : modalData,
      payload: payload
    }
    return finalPayload;
  }

  async migration(): Promise<void> {
    const { includeTags, excludeTags, contentModels, migrateFromDate, region, markets } = this.migrationForm.value;
  
    const hasDuplicateTags = Array.isArray(includeTags) && Array.isArray(excludeTags) &&
      includeTags.some(tag => excludeTags.includes(tag));
    if (hasDuplicateTags) {
      this.toastr.error("Same tags cannot be included and excluded!");
      return;
    }
  
    this.migrationForm.patchValue({
      migrateFromDate: this.datePipe.transform(migrateFromDate, "yyyy-MM-dd")
    });
  
    const selectedModels = this.getSelectedItems(contentModels, this.filteredModelList, 'content');
    const selectedTags = this.getSelectedItems(includeTags, this.filteredTagList, 'tag');
    const selectedExTags = this.getSelectedItems(excludeTags, this.filteredexTagList, 'tag');
    const selectedRegion = this.getSelectedRegion(region, this.filteredRegionList, 'regionCode');
    const selectedMarkets = this.getSelectedRegion(markets, this.filteredMarketList, 'code');
  
    const payloadData = this.constructPayload(
      selectedModels.map(m => m.modelName),
      selectedTags.map(t => t.name),
      selectedExTags.map(t => t.name),
      selectedRegion.map(t => t.region),
      selectedMarkets.map(t => t.name),
      this.migrationForm.value
    );
  
    this.openMigrationDialog(payloadData);
  }
  
  getSelectedItems(sourceList: string[], filterList: any[], key: string) {
    return filterList.filter(item => {
      if(key === "content"){
        return sourceList && sourceList.includes(item.modelId);
      }else{
        return sourceList && sourceList.includes(item.sys.id);
      }
    });
  }

  getSelectedRegion(sourceList: string[], filterList: any[], key: string) {
    return filterList.filter((item) => sourceList && sourceList == item[key]);
  }
  
  openMigrationDialog(payloadData: any) {
    this.dialog.open(ConfirmMigrationDialogComponent, { data: { formData: payloadData.modalData } })
      .afterClosed()
      .subscribe(res => {
        if (res && res.type === "yes") {
          this.executeMigration(payloadData.payload);
        } else {
          this.spinnerService.hide();
        }
      });
  }
  
  executeMigration(payload: any) {
    const sub = this.contenfulService.postMigration(payload).subscribe(
      (response: any) => {
        if (response) {
          this.toastr.success(response.message);
          this.resetForm();
        } else {
          this.toastr.error("Something went wrong");
        }
        this.spinnerService.hide();
      },
      (err: any) => {
        this.toastr.error(err.error.error);
        this.spinnerService.hide();
      }
    ).add(() => sub.unsubscribe());
  }
  
  

  resetForm(){
    this.updateModelSelectAllCheckboxStatus();
    this.updateTagSelectAllCheckboxStatus();
    this.updatelocalesSelectAllCheckboxStatus();
    this.updateexTagSelectAllCheckboxStatus();
    this.migrationForm = this.formBuilder.group({
      region: [{ value: "", disabled: false }, [Validators.required]],
      markets: [{ value: "", disabled: false }, [Validators.required]],
      includeTags: [{ value: [], disabled: false }],
      excludeTags: [{ value: [], disabled: false }],
      migrateFromDate: ["", [Validators.required]],
      contentModels: [{ value: [], disabled: false }],
      localesToMigrate: [{ value: '', disabled: false }, [Validators.required]],
      isRollBack:[{ value: true, disabled: false }]
    }, {
      validators: this.atLeastOneFieldValidator('contentModels', 'includeTags', 'excludeTags')
    });
  }

  convertTags(tags: string[]) {
    if (tags) {
      if (
        tags.length - 1 == this.includeTags.length ||
        tags.length - 1 == this.excludeTags.length
      ) {
        tags = tags.slice(1);
      }

      const promoCode = JSON.stringify(tags);

      return promoCode.replace(/[\[\]"]+/g, "");
    }

  }
  regionFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("region").value;
    const filtered = this.userRegion.filter(region => region.region.toLowerCase().includes(filterValue));
    const selectedItems = this.userRegion.filter(region => previouslySelectedItems.includes(region.regionCode));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(region => region.region === item.region)) {
        combinedResults.push(item);
      }
    });
    this.filteredRegionList = combinedResults;
  }

  handleSpaceKey(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.stopPropagation();
    }
  }
  marketFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("markets").value;
    const filtered = this.marketList.filter(market => market.name.toLowerCase().includes(filterValue));
    const selectedItems = this.marketList.filter(market => previouslySelectedItems.includes(market.code));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(market => market.name === item.name)) {
        combinedResults.push(item);
      }
    });
    this.filteredMarketList = combinedResults;
  }

  singleRegionSelectToggle() {
    let markets = [];
    const regionObj = this.userRegion.find(r => r.regionCode === this.migrationForm.value.region);
    if (regionObj) {
      markets = markets.concat(regionObj.markets);
    }
    markets =  markets.sort((a, b) => a.name.localeCompare(b.name));
    const marketData = markets;
    this.marketList = marketData;
    this.filteredMarketList = marketData;
    this.migrationForm.get('markets').setValue([]);
    this.migrationForm.get('localesToMigrate').setValue([]);
    this.updatelocalesSelectAllCheckboxStatus();
  }

  singleMarketSelectToggle() {
    const selectedMarkets = this.migrationForm.value.markets;
    let locales = [];
    const marketObj = this.marketList.find(m => m.code === selectedMarkets);
    if (marketObj) {
      locales = locales.concat(marketObj.locales);
    }
    locales = locales.sort((a, b) => a.code.localeCompare(b));
    const localesData = locales;
    this.localeList = localesData;
    this.filteredLocaleList = localesData;
    this.migrationForm.get('localesToMigrate').setValue([]);
  }

  localeFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("localesToMigrate").value;
    const filtered = this.localeList.filter(locale => locale.code.toLowerCase().includes(filterValue) || locale.name.toLowerCase().includes(filterValue));
    const selectedItems = this.localeList.filter(locale => previouslySelectedItems.includes(locale.code));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(locale => locale.name === item.name)) {
        combinedResults.push(item);
      }
    });
    this.filteredLocaleList = combinedResults;
  }

  singleLocaleSelectToggle() {
    this.updatelocalesSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  updatelocalesSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isLocaleChecked = this.isAlllocalesSelected(this.filteredLocaleList, 'localesToMigrate');
      this.cdr.detectChanges();
    }, 50);
  }

  isAlllocalesSelected(list, controlName) {
    const control = this.migrationForm.get(controlName).value ? this.migrationForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.code))
  }

  togglelocalesSelectAll(list, controlName) {
    const control = this.migrationForm.get(controlName);
    if (this.isAlllocalesSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.code));
    }
    this.updatelocalesSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  async getUserRegion(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .fetchUserRegion()
      .subscribe((res: any) => {
        this.userRegion = res.data;
        this.filteredRegionList = this.userRegion;
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  modelFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("contentModels").value;
    const filtered = this.contentModels.filter(model => model.modelId.toLowerCase().includes(filterValue) || model.modelName.toLowerCase().includes(filterValue));
    const selectedItems = this.contentModels.filter(model => previouslySelectedItems.includes(model.modelId));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(model => model.modelName === item.modelName)) {
        combinedResults.push(item);
      }
    });
    this.filteredModelList = combinedResults;
    this.updateModelSelectAllCheckboxStatus();
  }

  singleModelSelectToggle() {
    this.updateModelSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  updateModelSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isModelChecked = this.isAllModelSelected(this.filteredModelList, 'contentModels');
      this.cdr.detectChanges();
    }, 50);
  }

  isAllModelSelected(list, controlName) {
    const control = this.migrationForm.get(controlName).value ? this.migrationForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.modelId))
  }

  toggleModelSelectAll(list, controlName) {
    const control = this.migrationForm.get(controlName);
    if (this.isAllModelSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.modelId));
    }
    this.updateModelSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  tagFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("includeTags").value;
    const filtered = this.includeTags.filter(tags => tags.sys.id.toLowerCase().includes(filterValue) || tags.name.toLowerCase().includes(filterValue));
    const selectedItems = this.includeTags.filter(tags => previouslySelectedItems.includes(tags.sys.id));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(tags => tags.name === item.name)) {
        combinedResults.push(item);
      }
    });

    this.filteredTagList = combinedResults;
    this.updateTagSelectAllCheckboxStatus();
  }

  singleTagSelectToggle() {
    this.updateTagSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  updateTagSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isTagChecked = this.isAllTagSelected(this.filteredTagList, 'includeTags');
      this.cdr.detectChanges();
    }, 50);
  }

  isAllTagSelected(list, controlName) {
    const control = this.migrationForm.get(controlName).value ? this.migrationForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.sys.id))
  }

  toggleTagSelectAll(list, controlName) {
    const control = this.migrationForm.get(controlName);
    if (this.isAllTagSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.sys.id));
    }
    this.updateTagSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  extagFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.migrationForm.get("excludeTags").value;
    const filtered = this.excludeTags.filter(extags => extags.sys.id.toLowerCase().includes(filterValue) || extags.name.toLowerCase().includes(filterValue));
    const selectedItems = this.excludeTags.filter(extags => previouslySelectedItems.includes(extags.sys.id));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(extags => extags.name === item.name)) {
        combinedResults.push(item);
      }
    });
    this.filteredexTagList = combinedResults;
    this.updateTagSelectAllCheckboxStatus();
  }

  singleexTagSelectToggle() {
    this.updateexTagSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  updateexTagSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isexTagChecked = this.isAllexTagSelected(this.filteredexTagList, 'excludeTags');
      this.cdr.detectChanges();
    }, 50);
  }

  isAllexTagSelected(list, controlName) {
    const control = this.migrationForm.get(controlName).value ? this.migrationForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.sys.id))
  }

  toggleexTagSelectAll(list, controlName) {
    const control = this.migrationForm.get(controlName);
    if (this.isAllexTagSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.sys.id));
    }
    this.updateexTagSelectAllCheckboxStatus();
    this.onDatePickerClick();
  }

  onDatePickerClick(){
    let payload: any = {
      contentModels:  this.migrationForm.value.contentModels ? this.migrationForm.value.contentModels : [],
      includeTags: this.migrationForm.value.includeTags ? this.migrationForm.value.includeTags.join(',') : null,
      excludeTags: this.migrationForm.value.excludeTags ? this.migrationForm.value.excludeTags.join(',') : null,
      localesToMigrate:  this.migrationForm.value.localesToMigrate ? this.migrationForm.value.localesToMigrate : [],
    }
    if(this.migrationForm.value.localesToMigrate.length > 0 && (this.migrationForm.value.contentModels.length || this.migrationForm.value.includeTags.length || this.migrationForm.value.excludeTags.length)){
      const contentfulServiceSubs = this.contenfulService
      .getPublishedDate(payload)
      .subscribe(
        (res: any) => {         
            this.migrationForm.patchValue({
              migrateFromDate: res.publishedDate,
            });          
        },
        (error) => {
          // Handle the error appropriately
          this.migrationForm.patchValue({
            migrateFromDate: '',
          });
        }
      )
      .add(() => {
        !this.cdr["destroyed"] && this.cdr.detectChanges();
    
        contentfulServiceSubs.unsubscribe();
      });
    
    }else{
      this.migrationForm.patchValue({
        migrateFromDate : ''
      })
    }
    
  }
}