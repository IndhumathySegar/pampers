import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { FormGroup, Validators, FormBuilder, ValidatorFn, ValidationErrors } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ContentfulService } from "../contentful.service";
import { Subscription } from "rxjs";
import { get } from "lodash";
import { environment } from "@env/environment";
import { NgxSpinnerService } from "ngx-spinner";
import { MatDialog } from "@angular/material";
import { ConfirmRegionMappingDialogComponent } from "../confirm-region-mapping/confirm-region-mapping.dialog.component";
 
@Component({
  selector: "kt-create-new-region",
  templateUrl: "./create-new-region.component.html",
  styleUrls: ["./create-new-region.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateNewRegionComponent implements OnInit {
  safeGet = get;
  projects: any = [];
  environments: any = environment.LOCALE_ENVIRONMENTS;
  toEnvironments: any = [];
  tags: any = [];
  filteredTagList: any = [];
  isCountry;
  contentModels: any = [];
  filteredModelList: any = [];
  currentSpaceId = "";
  currentEnvironmentId = "";
  regionForm: FormGroup;
  subscriptions: Subscription[] = [];
  isSpaceLoading: boolean = false;
  isEnvironmentLoading: boolean = false;
  isTagsLoading: boolean = false;
  isModelLoading: boolean = false;
  showCodeValidations: boolean = false;
  loading: boolean = false;
  userRegion: any = [];
  filteredRegionList: any = [];
  isRegionChecked: any = false;
  isModelChecked: boolean = false;
  isTagChecked: boolean = false;
  filterMarket;
  userMarket;
  isMarketChecked: any = false;
 
  constructor(
    public contenfulService: ContentfulService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private spinnerService: NgxSpinnerService,
    private cdr: ChangeDetectorRef,
    private readonly dialog: MatDialog,
  ) {
    this.regionForm = this.formBuilder.group({
      project:[{value: "", disabled: false }, [Validators.required]],
      region:[{value: [], disabled: false }, [Validators.required]],
      contentModels:[{value: [], disabled: false }],
      tags:[{value: [], disabled: false }],
    }, {
      validators: this.atLeastOneFieldValidator('contentModels', 'tags')
    });
  }
 
 
 
  ngOnInit(): void {
    this.getSpaces();
    this.getUserRegion();
    this.getUserMarkets();
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
 
  regionFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.regionForm.get("region").value;
    const filtered = this.userRegion.filter(region => region.regionName.toLowerCase().includes(filterValue) ||  region.regionCode.toLowerCase().includes(filterValue));
    const selectedItems = this.userRegion.filter(region => previouslySelectedItems.includes(region.regionCode));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(region => region.regionName === item.regionName)) {
        combinedResults.push(item);
      }
    });
    this.filteredRegionList = combinedResults;
    this.updateRegionSelectAllCheckboxStatus();
  }

  marketFilterOptions(searchText) {
    const filterMarketValue = searchText.toLowerCase();
    const previouslyMarketSelectedItems = this.regionForm.get("region").value;
    const filtered = this.userMarket.filter(region => region.name.toLowerCase().includes(filterMarketValue) ||  region.code.toLowerCase().includes(filterMarketValue));
    const selectedMarketItems = this.userMarket.filter(region => previouslyMarketSelectedItems.includes(region.code));
    let combinedMarketResults = filtered.slice();
    selectedMarketItems.forEach(item => {
      if (!combinedMarketResults.some(region => region.name === item.name)) {
        combinedMarketResults.push(item);
      }
    });
    this.filterMarket = combinedMarketResults;
    this.updateMarketSelectAllCheckboxStatus();
  }
 
  singleRegionSelectToggle() {
    this.updateRegionSelectAllCheckboxStatus();
  }
  singleMarketSelectToggle() {
    this.updateMarketSelectAllCheckboxStatus();
  }
 
  updateRegionSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isRegionChecked = this.isAllRegionSelected(this.filteredRegionList, 'region');
      this.cdr.detectChanges();
    }, 50);
  }

  updateMarketSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isMarketChecked = this.isAllMarketSelected(this.filterMarket, 'region');
      this.cdr.detectChanges();
    }, 50);
  }
 
  isAllRegionSelected(list, controlName) {
    const control = this.regionForm.get(controlName).value ? this.regionForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.regionCode))
  }

  isAllMarketSelected(list, controlName) {
    const controlMarket = this.regionForm.get(controlName).value ? this.regionForm.get(controlName).value : [];
    return list.length && list.every(item => controlMarket.includes(item.code))
  }
 
  toggleRegionSelectAll(list, controlName) {
    const controlMarket = this.regionForm.get(controlName);
    console.log("list", list)
    if (this.isAllRegionSelected(list, controlName)) {
      controlMarket.setValue([]);
    } else {
      controlMarket.setValue(list.map(item => item.regionCode));
    }
    this.updateRegionSelectAllCheckboxStatus();
  }

  toggleMarketSelectAll(list, controlName) {
    const control = this.regionForm.get(controlName);
    if (this.isAllMarketSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.code));
    }
    this.updateMarketSelectAllCheckboxStatus();
  }
 
  handleSpaceKey(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.stopPropagation();
    }
  }
 
  async getSpaces(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();
 
    const contentfulServiceSubs = this.contenfulService
      .getProjects()
      .subscribe((res: any) => {
        this.projects = res.items;
        this.currentSpaceId = this.projects[0].sys.id;
        this.regionForm.patchValue({
          project : this.projects[0].name
        })
        this.getTags(this.environments[0]);
        this.updateRegionSelectAllCheckboxStatus();
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
      .getEnvironments({ spaceId, isLocale: true })
      .subscribe((res: any) => {
        this.environments = res.items;
        this.currentSpaceId = spaceId;
      })
      .add(() => {
        this.isEnvironmentLoading = false;
        this.cdr.detectChanges();
 
        contentfulServiceSubs.unsubscribe();
      });
  }
 
  getUserRegion() {
    this.isSpaceLoading = true;
   
    const contentfulModels = this.contenfulService
      .fetchContentModel(this.currentSpaceId, {isReviewPage: false})
      .subscribe(
        (res: any) => {
       
          this.userRegion = Array.from(res.region || []);
          this.filteredRegionList = this.userRegion;
          this.isSpaceLoading = false;
          this.isCountry = res.isCountry;
         
        },
        (error) => {
         
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
       
      });
   
  }

  
  async getUserMarkets(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .fetchUserRegion()
      .subscribe((res: any) => {
        this.isCountry = res.isCountry;
        const allMarkets = res.data.flatMap(region => region.markets);

console.log("all markets",allMarkets);
this.filterMarket = allMarkets;
this.userMarket = allMarkets;

     
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }
 
 
  fetchContentModel() {
    this.isModelLoading = true;
    const contentfulModels = this.contenfulService
      .fetchMigrationModel(this.currentSpaceId, this.currentEnvironmentId)
      .subscribe(
        (res: any) => {
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
 
  async getTags(environmentId): Promise<void> {
    this.isTagsLoading = true;
    this.cdr.detectChanges();
 
    const contentfulServiceSubs = this.contenfulService
      .getTags({ spaceId: this.currentSpaceId, environmentId })
      .subscribe(
        (res: any) => {
          this.tags = res.items.sort((a, b) => a.name.localeCompare(b.name));
          this.filteredTagList = res.items.sort((a, b) => a.name.localeCompare(b.name));      
          this.currentEnvironmentId = environmentId;        
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
 
  modelFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.regionForm.get("contentModels").value;
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
  }
 
  updateModelSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isModelChecked = this.isAllModelSelected(this.filteredModelList, 'contentModels');
      this.cdr.detectChanges();
    }, 50);
  }
 
  isAllModelSelected(list, controlName) {
    const control = this.regionForm.get(controlName).value ? this.regionForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.modelId))
  }
 
  toggleModelSelectAll(list, controlName) {
    const control = this.regionForm.get(controlName);
    if (this.isAllModelSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.modelId));
    }
    this.updateModelSelectAllCheckboxStatus();
  }
 
  tagFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.regionForm.get("tags").value;
    const filtered = this.tags.filter(tags => tags.sys.id.toLowerCase().includes(filterValue) || tags.name.toLowerCase().includes(filterValue));
    const selectedItems = this.tags.filter(tags => previouslySelectedItems.includes(tags.sys.id));
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
  }
 
  updateTagSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isTagChecked = this.isAllTagSelected(this.filteredTagList, 'tags');
      this.cdr.detectChanges();
    }, 50);
  }
 
  isAllTagSelected(list, controlName) {
    const control = this.regionForm.get(controlName).value ? this.regionForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.sys.id))
  }
 
  toggleTagSelectAll(list, controlName) {
    const control = this.regionForm.get(controlName);
    if (this.isAllTagSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.sys.id));
    }
    this.updateTagSelectAllCheckboxStatus();
  }
 
  createRegion(){
    const formValue: any = this.regionForm.value;
  
   let selectedRegionName;
   if(this.isCountry === 'TRUE') {
    const selectedRegion = this.filterMarket.filter(item =>
      formValue.region && formValue.region.length > 0
          ? formValue.region.includes(item.code)
          : false
    );
     selectedRegionName = selectedRegion.map(x => `${x.code} (${x.name})`)
   } else {
    const selectedRegion = this.filteredRegionList.filter(item =>
      formValue.region && formValue.region.length > 0
          ? formValue.region.includes(item.regionCode)
          : false
    );
    selectedRegionName = selectedRegion.map(x => `${x.regionName} (${x.regionCode})`)
   }
   
 
    let payload = {
      regions : formValue.region,
      tags: formValue.tags,
      contentModels: formValue.contentModels,
      project: formValue.project,
      spaceId :  this.currentSpaceId
    };
    const dialogRef = this.dialog.open(ConfirmRegionMappingDialogComponent, {
      data: { formData: selectedRegionName },
    }).afterClosed().subscribe(
      (res) => {
        if(res && res.type === "yes"){          
          const contentfulServiceSubs = this.contenfulService
            .createRegionMapping(payload)
            .subscribe(
              (res: any) => {
                if (res) {
                  this.toastr.success(res.message);
                  this.resetForm();
                    this.spinnerService.hide();
                } else {
                    this.spinnerService.hide();
                  this.toastr.error("something went wrong");
                }
              },
              (err: any) => {
                this.spinnerService.hide();
                this.toastr.error(err.error.error);
              }
            )
            .add(() => {
              this.cdr.detectChanges();
              contentfulServiceSubs.unsubscribe();
            });
        }
        else if(res && res.type === "no"){
          this.spinnerService.hide();
        }
      },
      (_: any) => {})
      .add(() => {
      dialogRef.unsubscribe();
    });
  }
 
  resetForm(){
    this.updateRegionSelectAllCheckboxStatus();
    this.updateModelSelectAllCheckboxStatus();
    this.updateTagSelectAllCheckboxStatus();
    this.regionForm.reset();  
    this.regionForm = this.formBuilder.group({
      project:[{value: "", disabled: false }, [Validators.required]],
      region:[{value: [], disabled: false }, [Validators.required]],
      contentModels:[{value: [], disabled: false }],
      tags:[{value: [], disabled: false }],
    }, {
      validators: this.atLeastOneFieldValidator('contentModels', 'tags')
    });
    this.regionForm.patchValue({
      project : this.projects[0].name
    })
  }
}