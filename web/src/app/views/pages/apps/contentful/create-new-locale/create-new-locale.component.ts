import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ContentfulService } from "../contentful.service";
import { Subscription } from "rxjs";
import { get } from "lodash";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { environment } from "@env/environment";

@Component({
  selector: "kt-create-new-locale",
  templateUrl: "./create-new-locale.component.html",
  styleUrls: ["./create-new-locale.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateNewLocaleComponent implements OnInit {
  safeGet = get;
  projects: any = [];
  environments: any = environment.LOCALE_ENVIRONMENTS;
  toEnvironments: any = [];
  includeTags: any = [];
  excludeTags: any = [];
  migrateFromDate: Date;
  currentSpaceId = "";
  regionObj: any;
  currentEnvironmentId = "";
  localeForm: FormGroup;
  subscriptions: Subscription[] = [];
  permission: any;
  isSpaceLoading: boolean = false;
  isEnvironmentLoading: boolean = false;
  showCodeValidations: boolean = false;
  loading: boolean = false;
  userRegion: any = [];
  filteredRegionList: any = [];
  marketList: any = [];
  filteredMarketList: any = [];
  isRegionChecked: any = false;
  isMarketChecked: any = false;
  isoCodes: any = [];
  filterIsoCode: any = [];
  spaceId='';
  isCountry: any;

  constructor(
    private store: Store<AppState>,
    public contenfulService: ContentfulService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.localeForm = this.formBuilder.group({
      region:[{value: "", disabled: false }, [Validators.required]],
      markets:[{value: "", disabled: false }, [Validators.required]],
      isoCode:[{value: "", disabled: false }, [Validators.required]],
      language: [{ value: "", disabled: false }, [Validators.required, Validators.pattern("^[A-Z][a-zA-Z\\s]*$")]],
      code: [
        { value: "", disabled: false },
        [
          Validators.required,
          Validators.pattern("^[a-z]{2,3}$"),
          Validators.min(2),
          Validators.max(3),
        ],
      ],
    });

    this.subscriptions.push(
      this.store.select(selectUserPermissions).subscribe((permissions) => {
        this.permission = permissions;
      })
    );
  }

  marketFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.localeForm.get("markets").value;
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
      this.regionObj = this.userRegion.find(r => r.regionCode === this.localeForm.value.region);
      console.log("regionObj", this.regionObj)
      if (this.regionObj) {
        markets = markets.concat(this.regionObj.markets);
      }
      markets = markets.sort((a, b) => a.name.localeCompare(b.name));
      const sortedMarkets = markets;
      this.marketList = sortedMarkets;
      this.filteredMarketList = sortedMarkets;
      this.localeForm.get('markets').setValue([]); 
    this.getIsoCode(this.regionObj.region) 
  }


  ngOnInit(): void {
    this.getSpaces();
   this.getUserRegion();
  }

  regionFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.localeForm.get("region").value;
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

  async getSpaces(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .getProjects()
      .subscribe((res: any) => {
        this.projects = res.items;
        this.spaceId = this.projects[0].sys.id;
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getUserRegion(): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contenfulService
      .fetchUserRegion()
      .subscribe((res: any) => {
        this.userRegion = res.data;
        this.filteredRegionList = this.userRegion;
        this.isCountry = res.isCountry;
        console.log("region", this.userRegion)
     
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getIsoCode(name): Promise<void> {
    this.isSpaceLoading = true;
    this.cdr.detectChanges();
  
    const contentfulServiceSubs = this.contenfulService
      .fetchIsoCode({region:name})
      .subscribe((res: any) => {
        this.isoCodes = res.sort((a, b) => a.code.localeCompare(b.code));
        this.filterIsoCode = res.sort((a, b) => a.code.localeCompare(b.code));
       
     
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.cdr["destroyed"] && this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }
  localeFilter(data) {
    const filterValue = data.toLowerCase();
    const filtered = this.isoCodes.filter((codeData) => {
      return (
        codeData.code.toLowerCase().includes(filterValue) ||
        codeData.name.toLowerCase().includes(filterValue)
      );
    });   
    this.filterIsoCode = filtered;

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

  async createLocale() {
    this.loading = true;
    const { region, markets, isoCode, code, language } =
      this.localeForm.value;  
      console.log(this.localeForm.value)  
    const apiPayload = {
      spaceId: this.spaceId,
      region,
      regionName: this.regionObj.region,
      markets,
      code : `${code}-${isoCode}`,
      language,
      environmentIds: this.environments,
    };

    const contentfulServiceSubs = this.contenfulService
      .createLocale(apiPayload)
      .subscribe(
        (res: any) => {
          if (res) {
            if (res.isError) {
              this.toastr.error(res.message);
            } else {
              this.toastr.success(res.message);
              this.resetForm();
            }
          
          } else {
            this.toastr.error("something went wrong");
          }
          this.loading = false;
        },
        (err: any) => {
          this.toastr.error(err.error.message);
          this.loading = false;
        }
      )
      .add(() => {
        this.cdr.detectChanges();
        contentfulServiceSubs.unsubscribe();
      });
  }

  resetForm(){
    this.localeForm.reset();
    this.localeForm = this.formBuilder.group({
      region:[{value: "", disabled: false }, [Validators.required]],
      markets:[{value: "", disabled: false }, [Validators.required]],
      isoCode:[{value: "", disabled: false }, [Validators.required]],
      language: [{ value: "", disabled: false }, [Validators.required, Validators.pattern("^[A-Z][a-zA-Z\\s]*$")]],
      code: [
        { value: "", disabled: false },
        [
          Validators.required,
          Validators.pattern("^[a-z]{2,3}$"),
          Validators.min(2),
          Validators.max(3),
        ],
      ],
    });
  }
}
