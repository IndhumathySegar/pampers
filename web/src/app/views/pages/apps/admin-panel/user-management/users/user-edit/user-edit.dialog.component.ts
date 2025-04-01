// Angular
import {
  Component,
  OnInit,
  Inject,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ContentfulService } from "../../../../../apps/contentful/contentful.service";

// Material
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
// RxJS
import { Subscription } from "rxjs";

// NGRX
import { Store, select } from "@ngrx/store";

// State
import { AppState } from "../../../../../../../core/reducers";
// CRUD
// Services and Models
import { get, cloneDeep } from "lodash";
import { ToastrService } from "ngx-toastr";
import {
  User,
  UserOnServerCreated,
  selectLastCreatedUserId,
  selectAllRoles,
  RolesPageRequested,
  isRequesting,
  Logout,
} from "../../../../../../../core/auth";
import { AuthService } from "app/core/auth/_services";
import { FormlyFieldConfig } from "@ngx-formly/core";
import { ValidationService } from "../../validation-service";

import { QueryParamsModel } from "app/core/_base/crud";
import { ParentRoute } from "../../../../../../../constents/resources";
import { AdminPanelService } from "../../../admin-panel.service";
import { debounceTime } from 'rxjs/operators';
import { NgxSpinnerService } from "ngx-spinner";
import { Router } from "@angular/router";

@Component({
  selector: "kt-user-edit-dialog",
  templateUrl: "./user-edit.dialog.component.html",
  styleUrls: ["./user-edit.dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class UserEditDialogComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild("focusInput", { static: false }) focusInput: ElementRef;

  safeGet = get;
  reg = "(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?";

  permission: any;
  hasFormErrors = false;
  isLoading = true;
  roles: any[] = [];

  bannerPath = "";
  form = new FormGroup({});
  model: User = new User();
  userForm: any;

  region: any = [];

  fields: FormlyFieldConfig[] = [
    {
      key: "email",
      type: "input",
      templateOptions: {
        label: "Email",
        placeholder: "Enter Email",
        required: true,
      },
      expressionProperties: {
        "templateOptions.disabled": "model._id",
      },
      validators: {
        validation: Validators.compose([
          Validators.required,
          ValidationService.emailValidator,
        ]),
      },
    },
    {
      key: "role",
      type: "select",
      templateOptions: {
        label: "Role",
        placeholder: "Select Role",
        required: true,
        change: () => {
          this.setLandingPageAndRoles();
        },
        options: [],
      },
    },
    {
      key: "organization",
      type: "input",
      templateOptions: {
        label: "Organization",
        placeholder: "Enter Organization",
        required: true,
        attributes: {
          style: "text-transform: uppercase",
        },
      },
     
      parsers: [
        (value) => {
          return value.toUpperCase();
        },
      ],
      validators: {
        validation: Validators.compose([
          Validators.required,
          (control) => {
            const trimmedValue = control.value ? control.value.trim() : '';
            if (trimmedValue === '') {
              return { emptySpaces: true };
            }
            return null;
          },
        ]),
      },
    },
    {
      key: "enabled",
      type: "radio",
      templateOptions: {
        required: false,
        options: [
          {
            label: "Active",
            value: true,
          },
          {
            label: "De-active",
            value: false,
          },
        ],
      },
    },
    {
      key: "landingPage",
      type: "select",
      className: 'cdk-overlay-pane-test',
      templateOptions: {
        label: "Landing Page",
        placeholder: "Select Page",
        required: true,
        options: [],
      },
    },
    {
      key: "translationRole",
      type: "select",
      className: 'cdk-overlay-pane-test',
      templateOptions: {
        label: "Translation Role",
        placeholder: "Select Role",
        required: true,
        options: [{
          label: "Reviewer",
          value: "reviewer"
        },
        {
          label: "Content Manager",
          value: "contentManager"
        }
        ],
      },
    },
    {
      key: "market",
      type: "select",
      templateOptions: {
        label: "Market",
        multiple: true,
        placeholder: "Select Market",
        required: true,
        options: [
        ],
        className: 'cdk-overlay-pane market-dropdown',
      },
    },
  ];

  organizationList: any = [{id : 1, name : "AYM"},{id : 2, name : "P&G"},{id : 3, name : "S&S"},{id : 4, name : "Others"}]
  regionList: any = [];
  localeList: any = [];
  moduleList: any = [];
  marketList: any = [];
  filteredRegionList: any = [];
  filteredLocaleList: any = [];
  filteredMarketList: any = [];

  private componentSubscriptions: Subscription[] = [];
  filteredRoles: any[];
  landingPage: any;
  isRegionChecked: boolean = false;
  isMarketChecked: boolean = false;
  isLocaleChecked: boolean = false;
  isModuleChecked: boolean = false;
  displayEmailError: boolean = false;
  loggedinUser: any;
  private readonly router: Router;
  
  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<UserEditDialogComponent>,
    private readonly store: Store<AppState>,
    private readonly cdr: ChangeDetectorRef,
    private readonly auth: AuthService,
    private readonly toastr: ToastrService,
    private contentService: ContentfulService,
    private adminService: AdminPanelService,
    private spinnerService: NgxSpinnerService

  ) {}

  ngOnInit() {
    this.filteredRegionList = this.regionList;
    this.filteredLocaleList = this.localeList;
    this.filteredMarketList = this.marketList;

    this.createForm();
    this.componentSubscriptions.push(
      this.store.select(isRequesting).subscribe((isLoading) => {
        this.isLoading = isLoading;

        this.cdr.detectChanges();
      })
    );

    // request roles
    this.loadRolesList();

    // roles subscription
    this.componentSubscriptions.push(
      this.store.select(selectAllRoles).subscribe((roles: any) => {
        const role = roles.sort((a, b) => a.name.localeCompare(b.name));
        this.roles =role;
        this.filteredRoles = role
        this.setLandingPageAndRoles();
      })
    );

    // set model data
    this.model = cloneDeep(this.data.model);
    this.fetchRegions();
    this.fetchModules();

    // for checking permissions
    this.permission = cloneDeep(this.data.permission);
  }

  createForm() {
    this.userForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      organization: ['', [Validators.required]],
      enabled: [true, [Validators.required]],
      region: ['', [Validators.required]],
      markets: ['', [Validators.required]],
      locales:['', [Validators.required]],
      modules: ['', [Validators.required]],
      role: ['', [Validators.required]],
    });

    if(!this.data.model._id){
      this.userForm.get('email').valueChanges.pipe(
        debounceTime(1000) 
      ).subscribe(value => {
        this.checkEmail();
      });
    }

    this.cdr.detectChanges();
  }

  patchUserFormValue() {
    this.userForm.controls.email.disable();
    this.selectModule(this.model.modules, "edit");
    this.userForm.patchValue({
      email: this.model.email,
      organization: this.model.organization,
      region: this.model.region,
      market: this.model.market,
      markets: this.model.markets,
      locales: this.model.locales,
      modules: this.model.modules,
      role: this.model.role,
    })
    if(!this.model.enabled) {
      this.userForm.patchValue({enabled: this.model.enabled})
    }
    this.cdr.detectChanges();

    const selectedRegions = this.userForm.value.region;
    let markets = [];
    if(selectedRegions && selectedRegions.length){
      selectedRegions.forEach(region => {
        const regionObj = this.regionList.find(r => r.regionCode === region);
        if (regionObj) {
          markets = markets.concat(regionObj.markets);
        }
      });
    }
    markets = markets.sort((a, b) => a.name.localeCompare(b.name));
    const marketList = markets;
    this.marketList = marketList;
    this.filteredMarketList = marketList;

    const selectedMarkets = this.userForm.value.markets;
    let locales = [];

    if(selectedMarkets) {
      selectedMarkets.forEach(market => {
        const marketObj = this.marketList.find(m => m.code === market);
        if (marketObj) {
          locales = locales.concat(marketObj.locales);
        }
      });
    }
    locales = locales.sort((a, b) => a.code.localeCompare(b));
    const localList = locales;
    this.localeList = localList;
    this.filteredLocaleList = localList
    this.updateregionSelectAllCheckboxStatus(); 
    this.updatemarketsSelectAllCheckboxStatus();    
    this.updatelocalesSelectAllCheckboxStatus();    
    this.updatemodulesSelectAllCheckboxStatus();    

    this.cdr.detectChanges();
  }

 

  async setLandingPageAndRoles() {

    // load loading pages for user on selected role
    this.roles.forEach((role) => {
      if (role.name === this.model.role) {
        let landingPages = [];
        role.permissions.forEach(({ uniqueResourceName }) => {
          landingPages.push(uniqueResourceName);
        });

        console.log("landing page", landingPages);

        this.landingPage = landingPages.filter(Boolean).map((urn) => {
          console.log("urn", urn)
          console.log("parent route", ParentRoute[urn])

         return ({
          label: ParentRoute[`${urn}Display`],
          value: ParentRoute[urn],
        })});
        this.model.landingPage = this.landingPage.length ? this.landingPage[0].value : '';
        this.model.defaultPage = this.model.landingPage;
      }
    });

    this.cdr.detectChanges();
  }

  fetchRegions() {
    this.isLoading = true;
    const contentfulModels = this.adminService
      .getRegions()
      .subscribe(
        (res: any) => {
          this.regionList = res.data.sort((a, b) => a.region.localeCompare(b.region));
          this.filteredRegionList = this.regionList;
          this.isLoading = false;
          this.spinnerService.hide();
          if(this.model._id){
            this.patchUserFormValue();        
          }         
        },
        (error) => {
          this.spinnerService.hide();
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
      });
  }

  fetchModules() {
    this.isLoading = true;
    const contentfulModels = this.adminService
      .getModules()
      .subscribe(
        (res: any) => {
          this.moduleList = res.data.sort((a, b) => a.name.localeCompare(b.name));
          this.isLoading = false;
        },
        (error) => {}
      )
      .add(() => {
        contentfulModels.unsubscribe();
      });
  }

  ngAfterViewInit() {
    if (this.focusInput) {
      setTimeout(() => {
        this.focusInput.nativeElement.focus();
      }, 0);
    }
  }

  loadRolesList() {
    const queryParams = new QueryParamsModel('');
    this.store.dispatch(new RolesPageRequested({ page: queryParams }));
  }

  ngOnDestroy() {
    this.componentSubscriptions.forEach((subscription) =>
      subscription.unsubscribe()
    );
  }

  getTitle(): string {
    if (this.model._id) {
      return "Edit User";
    } else {
      return "New User";
    }
  }

  onSubmit() {
    this.userForm.markAllAsTouched();
    if(this.displayEmailError){
       return;   
    }
    if (this.userForm.valid) {
      this.model.email = this.userForm.value.email ? this.userForm.value.email.trim() : this.model.email;
      this.model.enabled = this.userForm.value.enabled;
      this.model.organization = this.userForm.value.organization;
      this.model.role = this.userForm.value.role;
      this.model.markets = this.userForm.value.markets;
      this.model.region = this.userForm.value.region;
      this.model.locales= this.userForm.value.locales;
      this.model.modules = this.userForm.value.modules;
      if (this.model._id) {
        this.updateUser(cloneDeep(this.model));
      } else {       
        this.createUser(cloneDeep(this.model));
      }
    }
  }

  updateUser(_user: User) {
    const updateUserSubscription = this.auth
      .updateUser(_user)
      .subscribe(
        (_: any) => {
          let loggedInData = localStorage.getItem("_user")
          this.loggedinUser = JSON.parse(loggedInData);
          const enabled: any = this.model.enabled;
          if((this.loggedinUser._id == this.model._id &&  this.loggedinUser.role != this.model.role) || (this.loggedinUser._id == this.model._id && enabled=="false") ){
            this.logoutWeb();
          }else{
            this.dialogRef.close({ _user, isEdit: true });
          }
        },
        (err: any) => {
          this.toastr.error(err.error.error, err.statusText);
        }
      )
      .add(() => {
        updateUserSubscription.unsubscribe();
      });
  }

  createUser(_user: User) {
    this.store.dispatch(new UserOnServerCreated({ user: _user }));
    this.componentSubscriptions.push(
      this.store.pipe(select(selectLastCreatedUserId)).subscribe((res) => {
        if (!res) {
          return;
        }
        this.dialogRef.close({ _user, isEdit: false });
      })
    );
  }

  
  selectModule(event, type?){
    const selectedItems = type == 'edit' ? event : event.value;
    setTimeout(() => {
      this.filteredRoles = this.roles.filter(role => {
        return role.permissions.some(permission => {
          if(selectedItems && selectedItems.length){
            return selectedItems.some(item => item === permission.uniqueResourceName);
          }else{
            return role;
          }
        });
      });
      const getRole = this.filteredRoles.find(r => r.name == this.userForm.value.role);
  
      if(!getRole){
        this.userForm.patchValue({
          role : ''
        })
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  selectRole(item){
    this.model.role = this.userForm.value.role;
    if(this.userForm.value.role == "Admin"){
      this.userForm.patchValue({
        modules : [],
        region : [],
        markets: [],
        locales: []
      })
      this.toggleregionSelectAll(this.regionList, "region");
      this.togglemarketsSelectAll(this.marketList, "markets");
      this.togglelocalesSelectAll(this.localeList, "locales");
      this.togglemodulesSelectAll(this.moduleList, "modules");
      this.filteredRoles = this.roles;
      this.cdr.detectChanges();
    }
    else if(this.userForm.value.role != "Admin"){
      this.userForm.patchValue({
        region : [],
        markets: [],
        locales: []
      })  
      this.updateregionSelectAllCheckboxStatus();
      this.updatemarketsSelectAllCheckboxStatus();
      this.updatelocalesSelectAllCheckboxStatus();
      this.filteredRoles = this.roles;
      this.cdr.detectChanges();
    }
    this.setLandingPageAndRoles();
  }

  singleRegionSelectToggle() {
    const selectedRegions = this.userForm.value.region;
    let markets = [];
    selectedRegions.forEach(region => {
      const regionObj = this.regionList.find(r => r.regionCode === region);
      if (regionObj) {
        markets = markets.concat(regionObj.markets);
      }
    });
    markets = markets.sort((a, b) => a.name.localeCompare(b.name))
    const marketList = markets;
    this.marketList = marketList;
    this.filteredMarketList = marketList;
    this.userForm.get('markets').setValue([]);
    this.localeList = [];
    this.filteredLocaleList = [];
    this.userForm.get('locales').setValue([]);
    this.updateregionSelectAllCheckboxStatus();
    this.updatemarketsSelectAllCheckboxStatus();    
    this.updatelocalesSelectAllCheckboxStatus();  
  }
  
  singleMarketSelectToggle() {
    const selectedMarkets = this.userForm.value.markets;
    let locales = [];
    selectedMarkets.forEach(market => {
      const marketObj = this.marketList.find(m => m.code === market);
      if (marketObj) {
        locales = locales.concat(marketObj.locales);
      }
    });
    locales = locales.sort((a, b) => a.code.localeCompare(b))
    const localeList = locales;
    this.localeList = localeList;
    this.filteredLocaleList = localeList
    this.userForm.get('locales').setValue([]);
    this.updatemarketsSelectAllCheckboxStatus();
    this.updatelocalesSelectAllCheckboxStatus();  
  }
  
  singleLocaleSelectToggle() {
    this.updatelocalesSelectAllCheckboxStatus();
  }

  singleModuleSelectToggle() {
    this.updatemodulesSelectAllCheckboxStatus();
  }
  
  toggleregionSelectAll(list, controlName) {
    const control = this.userForm.get(controlName);
    if (this.isAllregionSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.regionCode));
      this.singleRegionSelectToggle();    
    }
    this.updateregionSelectAllCheckboxStatus();
  }

  togglemarketsSelectAll(list, controlName) {
    const control = this.userForm.get(controlName);
    if (this.isAllmarketsSelected(list, controlName)) {
      control.setValue([]);
    } else {
        control.setValue(list.map(item => item.code));
        this.singleMarketSelectToggle();
    } 
    this.updatemarketsSelectAllCheckboxStatus();
  }

  togglelocalesSelectAll(list, controlName) {
    const control = this.userForm.get(controlName);
    if (this.isAlllocalesSelected(list, controlName)) {
      control.setValue([]);
    } else {
        control.setValue(list.map(item => item.code));     
    }   
    this.updatelocalesSelectAllCheckboxStatus();
  }

  togglemodulesSelectAll(list, controlName) {
    const control = this.userForm.get(controlName);
    if (this.isAllmodulesSelected(list, controlName)) {
      control.setValue([]);
    } else {
      control.setValue(list.map(item => item.uniqueResourceName));
      this.singleModuleSelectToggle();
      this.filteredRoles = this.roles
    }
    this.updatemodulesSelectAllCheckboxStatus();
  }
  
  isAllregionSelected(list, controlName) {
    const control = this.userForm.get(controlName).value ? this.userForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.regionCode))
  }
  isAllmarketsSelected(list, controlName) {
    const control = this.userForm.get(controlName).value ? this.userForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.code))
  }
  isAlllocalesSelected(list, controlName) {
    const control = this.userForm.get(controlName).value ? this.userForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.code))
  }
  isAllmodulesSelected(list, controlName) {
    const control = this.userForm.get(controlName).value ? this.userForm.get(controlName).value : [];
    return list.length && list.every(item => control.includes(item.uniqueResourceName))
  }
  updateregionSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isRegionChecked = this.isAllregionSelected(this.filteredRegionList, 'region');      
      this.cdr.detectChanges();
    }, 50);

  }
  updatemarketsSelectAllCheckboxStatus() {
    setTimeout(() => {      
      this.isMarketChecked = this.isAllmarketsSelected(this.filteredMarketList, 'markets');    
      this.cdr.detectChanges();
    }, 50);
  }
  updatelocalesSelectAllCheckboxStatus() {
    setTimeout(() => {
      this.isLocaleChecked = this.isAlllocalesSelected(this.filteredLocaleList, 'locales');
      this.cdr.detectChanges();
    }, 50);
  }
  updatemodulesSelectAllCheckboxStatus() {
    setTimeout(() => {    
      this.isModuleChecked = this.isAllmodulesSelected(this.moduleList, 'modules');
      this.cdr.detectChanges();
    }, 50);

  }
  
  regionFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.userForm.get("region").value;
    const filtered = this.regionList.filter(region => region.region.toLowerCase().includes(filterValue));
    const selectedItems = this.regionList.filter(region => previouslySelectedItems.includes(region.regionCode));
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(region => region.region === item.region)) {
        combinedResults.push(item);
      }
    });
    this.filteredRegionList = combinedResults;
  }
  
  marketFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.userForm.get("markets").value;
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
  
  localeFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.userForm.get("locales").value;
    const filtered = this.localeList.filter(locale => locale.code.toLowerCase().includes(filterValue) ||  locale.name.toLowerCase().includes(filterValue));
    const selectedItems = this.localeList.filter(locale => previouslySelectedItems.includes(locale.code) );
    let combinedResults = filtered.slice();
    selectedItems.forEach(item => {
      if (!combinedResults.some(locale => locale.name === item.name)) {
        combinedResults.push(item);
      }
    });
    this.filteredLocaleList = combinedResults;
  }

  handleSpaceKey(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.stopPropagation();
    }
  }

  checkEmail() {
    const emailModel = this.adminService
      .checkEmailExist({email: this.userForm.value.email})
      .subscribe(
        (res: any) => {
         if(res.status === "Email already exists"){
          this.displayEmailError = true;
          this.cdr.detectChanges();
         }else{
          this.displayEmailError = false;
          this.cdr.detectChanges();
         }
        },
        (error) => {}
      )
      .add(() => {
        emailModel.unsubscribe();
      });
  }

  logoutWeb() {
    this.auth.logout()
      .subscribe(
        () => {
          this.store.dispatch(new Logout())
        }
      ).add(() => {
        localStorage.clear();
        window.location.reload();
      })
  }
}
