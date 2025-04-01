import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@env/environment";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { MatOption } from "@angular/material";
import { ContentfulService } from "../contentful.service";
import { Subscription } from "rxjs";
import { get } from "lodash";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import { selectUserPermissions } from "app/core/auth/_selectors/auth.selectors";
import { DatePipe } from "@angular/common";

@Component({
  selector: "kt-crm-contentful-migration",
  templateUrl: "./crm-contentful-migration.component.html",
  styleUrls: ["./crm-contentful-migration.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CRMContentfulMigrationComponent implements OnInit {
  safeGet = get;
  projectsCRM: any = [];
  environmentsCRM: any = [];
  toCRMEnvironments: any = [];
  includeCRMTags: any = [];
  excludeCRMTags: any = [];
  migrateCRMFromDate: Date;
  currentCRMSpaceId = "";
  currentCRMEnvironmentId = "";
  isCRM = false;
  migrationCRMForm: FormGroup;
  subscriptionsCRM: Subscription[] = [];
  permissionCRM: any;

  // loaders
  isCRMSpaceLoading: boolean = false;
  isCRMEnvironmentLoading: boolean = false;
  isCRMTagsLoading: boolean = false;
  isCRMModelLoading: boolean = false;
  contentModelsCRM: any = [];
  sourceCRMLocaleOptions: any = [];

  @ViewChild("allSelected", { static: true }) allCRMSelected: MatOption;
  @ViewChild("allSelected2", { static: true }) allCRMSelected2: MatOption;
  @ViewChild("allModelSelected", { static: true }) allModelCRMSelected: MatOption;
  @ViewChild("allLocalesSelected", { static: true }) allLocalesCRMSelected: MatOption;

  constructor(
    private storeCRM: Store<AppState>,
    public contenfulCRMService: ContentfulService,
    private formBuilderCRM: FormBuilder,
    private toastrCRM: ToastrService,
    private cdrCRM: ChangeDetectorRef,
    private datePipeCRM: DatePipe,
    private routerCRM: Router
  ) {
    this.isCRM = this.routerCRM.url.startsWith("/crm");

    this.migrationCRMForm = this.formBuilderCRM.group({
      spaceId: [{ value: "", disabled: false }, [Validators.required]],
      project: [{ value: "", disabled: false }, [Validators.required]],
      fromEnvironmentId: [
        { value: "", disabled: false },
        [Validators.required],
      ],
      toEnvironmentId: [{ value: "", disabled: false }, [Validators.required]],
      includeTags: [{ value: "", disabled: false }],
      excludeTags: [{ value: "", disabled: false }],
      migrateFromDate: ["", [Validators.required]],
      contentModels:[{value:"", disabled:false}],
      localesToMigrate:[{value:'', disabled: false}]
    });

    this.subscriptionsCRM.push(
      this.storeCRM.select(selectUserPermissions).subscribe((permissions) => {
        this.permissionCRM = permissions;
      })
    );
  }

  fetchCRMContentModel() {
    this.isCRMModelLoading = true;
    const contentfulModels = this.contenfulCRMService
      .fetchMigrationModel( this.currentCRMSpaceId,this.currentCRMEnvironmentId)
      .subscribe(
        (res: any) => {
          this.sourceCRMLocaleOptions = Array.from(res.region || []);

          this.contentModelsCRM = res.contentModel;

          this.isCRMModelLoading = false;
          this.cdrCRM.detectChanges();
        },
        (error) => {
         
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
      });
  }

  ngOnInit(): void {
    this.getCRMSpaces();
  }

  async getCRMSpaces(): Promise<void> {
    this.isCRMSpaceLoading = true;
    this.cdrCRM.detectChanges();
    const contentfulServiceSubs = this.contenfulCRMService
      .getProjects(this.isCRM)
      .subscribe((res: any) => {
        this.projectsCRM = res.items;
      })
      .add(() => {
        this.isCRMSpaceLoading = false;
        !this.cdrCRM["destroyed"] && this.cdrCRM.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getCRMEnvironments(spaceId: string): Promise<void> {
    this.isCRMEnvironmentLoading = true;
    this.cdrCRM.detectChanges();

    const currProject = this.projectsCRM.find(
      (project) => project.sys.id === spaceId
    );
    this.migrationCRMForm.controls.project.patchValue(currProject.name);

    const contentfulServiceSubs = this.contenfulCRMService
      .getCrmEnvironments({ spaceId, isCRM: this.isCRM })
      .subscribe((res: any) => {
        this.environmentsCRM = res.items;
        if(!this.isCRM && (environment.env==='prod' || environment.env==='us-prod')) {
          this.environmentsCRM=[{name:"staging"}]
        }
        this.currentCRMSpaceId = spaceId;
      })
      .add(() => {
        this.isCRMEnvironmentLoading = false;
        this.cdrCRM.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async getCRMTags(environmentId): Promise<void> {
    this.isCRMTagsLoading = true;
    this.cdrCRM.detectChanges();

    const contentfulServiceSubs = this.contenfulCRMService
      .getTags({ spaceId: this.currentCRMSpaceId, environmentId })
      .subscribe(
        (res: any) => {
          this.includeCRMTags = res.items;
          this.excludeCRMTags = res.items;
          this.currentCRMEnvironmentId = environmentId;
          this.toCRMEnvironments = this.environmentsCRM.filter(
            (item) => item.name !== environmentId && item.name !== "crm-sit"
          );
          if(!this.isCRM && (environment.env==='prod' || environment.env==='us-prod')) {
            this.toCRMEnvironments=[{name:"master"}]
          }
          this.fetchCRMContentModel()
        },
        (_) => {
          // This is left intentionally
        }
      )
      .add(() => {
        this.isCRMTagsLoading = false;
        this.cdrCRM.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  async tossleCRMPerOne(): Promise<boolean | undefined> {
    if (this.allCRMSelected.selected) {
      this.allCRMSelected.deselect();
      this.cdrCRM.detectChanges();
      return false;
    }
    if(this.migrationCRMForm.controls.includeTags) {
      if (
        this.migrationCRMForm.controls.includeTags.value.length ==
        this.includeCRMTags.length
      ) {
        this.allCRMSelected.select();
      }
    }
    

    this.cdrCRM.detectChanges();
  }

  async tossleModelSelection(): Promise<void> {
    if (this.allModelCRMSelected.selected) {
      this.migrationCRMForm.controls.contentModels.patchValue(
        [0].concat(this.contentModelsCRM.map((item) => item.modelId))
      );
      delete this.migrationCRMForm.controls.contentModels[0]
    } else {
      this.migrationCRMForm.controls.contentModels.patchValue([]);
    }
  }

  async tossleLocaleSelection(): Promise<void> {
   if (this.allLocalesCRMSelected.selected) {
      this.migrationCRMForm.controls.localesToMigrate.patchValue(
        [0].concat(this.sourceCRMLocaleOptions.map((item) => item))
      );
    } else {
      this.migrationCRMForm.controls.localesToMigrate.patchValue([]);
    }
  }

  async tossleCRMPerOne2(): Promise<boolean | undefined> {
    if (this.allCRMSelected2.selected) {
      this.allCRMSelected2.deselect();
      this.cdrCRM.detectChanges();
      return false;
    }
    if (
      this.migrationCRMForm.controls.excludeTags.value.length ==
      this.excludeCRMTags.length
    ) {
      this.allCRMSelected2.select();
    }

    this.cdrCRM.detectChanges();
  }

  async toggleCRMAllSelection(): Promise<void> {
    if (this.allCRMSelected.selected) {
      this.migrationCRMForm.controls.includeTags.patchValue(
        [0].concat(this.includeCRMTags.map((item) => item.sys.id))
      );
    } else {
      this.migrationCRMForm.controls.includeTags.patchValue([]);
    }
  }

  async toggleCRMAllSelection2(): Promise<void> {
    if (this.allCRMSelected2.selected) {
      this.migrationCRMForm.controls.excludeTags.patchValue(
        [0].concat(this.excludeCRMTags.map((item) => item.sys.id))
      );
    } else {
      this.migrationCRMForm.controls.excludeTags.patchValue([]);
    }
  }

  async migrationCRM(): Promise<void> {
    const formNewValue: any = this.migrationCRMForm.value;

    if (
      Array.isArray(formNewValue.includeTags) &&
      Array.isArray(formNewValue.excludeTags) &&
      formNewValue.includeTags.length &&
      formNewValue.excludeTags.length &&
      (formNewValue.includeTags.some((x) => formNewValue.excludeTags.includes(x)) ||
      formNewValue.excludeTags.some((x) => formNewValue.includeTags.includes(x)))
    ) {
      this.toastrCRM.error("Same tags can not be included and excluded!");
      return;
    }

    const test = this.migrationCRMForm.get("migrateFromDate").value;
    formNewValue.migrateFromDate = this.datePipeCRM.transform(test, "yyyy-MM-dd");
    formNewValue.includeTags = this.convertCRMTags(formNewValue.includeTags);
    formNewValue.excludeTags = this.convertCRMTags(formNewValue.excludeTags);

    const contentfulServiceSubs = this.contenfulCRMService
      .postCRMMigration(formNewValue)
      .subscribe(
        (res: any) => {
          if (res) {
            this.toastrCRM.success(res.message);
            this.migrationCRMForm.reset();
          } else {
            this.toastrCRM.error("something went wrong");
          }
        },
        (err: any) => {
          this.toastrCRM.error(err.error.error);
        }
      )
      .add(() => {
        this.cdrCRM.detectChanges();
        contentfulServiceSubs.unsubscribe();
      });
  }

  convertCRMTags(tags: string[]) {
    if(tags) {
      if (
        tags.length - 1 == this.includeCRMTags.length ||
        tags.length - 1 == this.excludeCRMTags.length
      ) {
        tags = tags.slice(1);
      }
  
      const promoCode = JSON.stringify(tags);
  
      return promoCode.replace(/[\[\]"]+/g, "");
    }
   
  }
}