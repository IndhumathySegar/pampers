import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
} from "@angular/core";
import { Router } from "@angular/router";
import { SelectionModel } from "@angular/cdk/collections";

import { faLanguage, faSearch } from "@fortawesome/free-solid-svg-icons";
import { ContentfulService } from "../contentful.service";
import { ToastrService } from "ngx-toastr";
import { Store } from "@ngrx/store";
import { AppState } from "../../../../../core/reducers";
import { currentUser } from "../../../../../core/auth";
import { MatTableDataSource } from "@angular/material/table";
import { Translate } from "./translate-table/translate-table.component";
import { MatDialog } from "@angular/material/dialog";
import { CRMTranslateDialogComponent } from "./confirm-dialog/confirm-dialog.component";
import { NgxSpinnerService } from "ngx-spinner";
import { environment } from "@env/environment";

const { env } = environment;

interface MyCRMResponse {
  status: number;
  message: string;
  data;
  translatedValue: [
    {
      key: undefined;
      value: undefined;
      orr: undefined;
    }
  ];
  allEmpty: boolean;
}

@Component({
  selector: "kt-translate",
  templateUrl: "./translate.component.html",
  styleUrls: ["./translate.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrmTranslateComponent implements OnInit {
  crmDevEnvironment = env;
  crmFaLanguage = faLanguage;
  crmFaSearch = faSearch;
  destCRMLocale = "";
  sourceCRMLocale = "";
  CRMcontentype = "";
  onCRMTranslate = false;
  CRMPageSize = 100;
  isCRMLoading = false;
  isCRMFetched = false;
  isCRMSelected = false;
  translateCRMSelection: any = [];
  enableCRMTranslate: boolean = false;
  enableCRMUpdate: boolean = false;
  showCRMTable = false;
  crmSelection = new SelectionModel<Translate>(true, []);

  crmDataSource;
  crmPageIndex = 0;
  crmStoredPageIndex = 0;
  isCrmUpdate = false;
  totalCrmCount: number;
  enterCrmTranslation = false;
  allCrmSelected = [];
  updateCrmSelection = [];
  isCrmScrolled = false;
  searchCrmInput = "";

  crmSearchValueInput = "";
  sourceCRMLocaleOptions: any[] = [];
  destCRMLocaleOptions: any[] = [];
  crmTranslationRole = "";
  isCrmReviewPage = false;
  isCRM = false;
  isCrmSpaceLoading = false;
  crmProjects: any = [];
  crmSpaceId;
  crmIntervalLoading = false;
  crmTranslateAPI = false;
  filteredCrmLocales: any[] = [];
  crmReviewerSubmit = false;

  destFilteredCrmLocales: any[] = [];
  enableCrmKeyTranslate: boolean = false;
  enableCrmReviewer: boolean = false;

  constructor(
    private readonly crmContentService: ContentfulService,
    private readonly crmChangesDetect: ChangeDetectorRef,
    private readonly crmToast: ToastrService,
    public crmDialog: MatDialog,
    private crmAppStore: Store<AppState>,
    private crmRouter: Router,
    private crmNgZone: NgZone,
    private crmSpinnerService: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.isCrmReviewPage = this.crmRouter.url.includes("reviewer");
    this.isCRM = this.crmRouter.url.startsWith("/crm");
    if (!this.isCrmReviewPage) {
      this.getCrmSpaces();
    } else {
      this.CRMPageSize = 10;
      this.fetchCrmRegions();
    }

    this.getCRMTranslationRole();
  }

  getCRMTranslationRole() {
    this.crmAppStore.select(currentUser).subscribe((user) => {
      const appRolePermission = user.rolePermissions.find(
        (item) => item.uniqueResourceName === "crmManagement"
      );

      if (!appRolePermission) return;

      const getSubResourceService = (subResourceName, serviceName) => {
        const subResource = appRolePermission.subResources.find(
          (item) => item.uniqueSubResourceName === subResourceName
        );
        return subResource.services.find(
          (item) => item.uniqueServiceName === serviceName
        );
      };

      const translationService = getSubResourceService(
        "crmManagement:translation",
        "crmManagement:translation:createTranslation"
      );

      const reviewerService = getSubResourceService(
        "crmManagement:reviewer",
        "crmManagement:reviewer:createTranslation"
      );

      if (translationService && !this.isCrmReviewPage) {
        this.crmTranslationRole = "contentManager";
      } else if (reviewerService && this.isCrmReviewPage) {
        this.crmTranslationRole = "reviewer";
      }
    });
  }

  filterCrmOptions(searchText) {
    console.log(searchText);
    const filterValue = searchText.toLowerCase();
    this.filteredCrmLocales = this.sourceCRMLocaleOptions.filter((locale) => {
      return (
        locale.regionName.toLowerCase().includes(filterValue) ||
        locale.regionCode.toLowerCase().includes(filterValue)
      );
    });
  }

  destFilterCrmOptions(searchText) {
    console.log(searchText);
    const filterValue = searchText.toLowerCase();
    this.destFilteredCrmLocales = this.destCRMLocaleOptions.filter((locale) => {
      return (
        locale.regionName.toLowerCase().includes(filterValue) ||
        locale.regionCode.toLowerCase().includes(filterValue)
      );
    });
  }

  @HostListener("window:scroll")
  onWindowScroll() {
    this.isCrmScrolled = window.scrollY > 0;
  }

  async getCrmSpaces(): Promise<void> {
    this.crmPageIndex = 0;
    this.crmStoredPageIndex = 0;
    this.isCrmSpaceLoading = true;
    this.crmChangesDetect.detectChanges();

    const contentfulServiceSubs = this.crmContentService
      .getProjects(this.isCRM)
      .subscribe((res: any) => {
        this.crmProjects = res.items;
      })
      .add(() => {
        this.isCrmSpaceLoading = false;
        !this.crmChangesDetect["destroyed"] &&
          this.crmChangesDetect.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  getCrmEnvironments(crmSpaceId) {
    this.crmDataSource = [];
    this.sourceCRMLocale = "";
    this.destCRMLocale = "";
    this.crmSpaceId = crmSpaceId;
    this.fetchCrmRegions();
  }

  searchCrmContent() {
    this.enableCRMTranslate = false;
    this.enableCRMUpdate = false;
    this.isCRMLoading = true;
    this.showCRMTable = false;

    const payload: any = {
      type: this.CRMcontentype,
      sourceLocale: this.sourceCRMLocale,
      destinationLocale: this.destCRMLocale,
      searchText: this.searchCrmInput,
      searchValue: this.crmSearchValueInput,
      pageIndex: this.crmPageIndex,
      pageSize: this.CRMPageSize,
      spaceId: this.crmSpaceId,
      isCRM: this.isCRM,
    };

    if (this.isCrmReviewPage) {
      payload.isReviewPage = this.isCrmReviewPage;
    }

    // Call the method in your service or API to fetch the entries
    const crmContentService = this.crmContentService
      .searchCrmContent(payload)
      .subscribe(
        (res: MyCRMResponse) => {
          this.crmSpinnerService.hide();
          this.totalCrmCount = res.data.totalEntries;
          res.data.extractedData.forEach((item) => {
            if (/^\d+$/.test(item.value)) {
              item.isCheckDisabled = true;
            }else{
              item.isCheckDisabled = false;
            }
          });
          this.crmDataSource = new MatTableDataSource<Translate>(
            res.data.extractedData
          );
          this.crmSelection.clear();

          this.crmToast.success(res.message, "Success");
        },
        (error) => {
          this.crmSpinnerService.hide();
          this.crmToast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.isCRMLoading = false;
        this.showCRMTable = true;
        this.isCRMFetched = true;
        this.crmChangesDetect.detectChanges();
        crmContentService.unsubscribe();
      });
  }

  performCrmSearch() {
    this.crmPageIndex = 0;
    this.crmStoredPageIndex = 0;
    this.searchCrmContent();
  }

  onCrmLocaleChange() {
    this.allCrmSelected = [];
    this.crmPageIndex = 0;
    this.enableCRMTranslate = false;
    this.crmTranslateAPI = false;
    if (this.isCrmReviewPage) {
      this.searchCrmInput = "";
      this.destCRMLocale = this.sourceCRMLocale;
      this.searchCrmContent();
      return;
    }
    if (!this.sourceCRMLocale || !this.destCRMLocale) return;
    this.searchCrmInput = "";
    this.searchCrmContent();
  }

  resetDestCRMLocales($event) {
    this.sourceCRMLocale = $event;
    if (this.destCRMLocale && this.destCRMLocale === this.sourceCRMLocale) {
      this.destCRMLocale = null;
    }

    this.destCRMLocaleOptions = Array.from(this.sourceCRMLocaleOptions || []);
    const index = this.destCRMLocaleOptions.findIndex(
      (x) => x.regionCode === $event
    );
    if (index < 0) return;
    this.destCRMLocaleOptions.splice(index, 1);
    this.crmChangesDetect.detectChanges();
  }

  fetchCrmRegions() {
    this.isCRMLoading = true;
    this.crmPageIndex = 0;
    this.crmStoredPageIndex = 0;
    const contentfulModels = this.crmContentService
      .fetchContentModel(this.crmSpaceId, this.isCrmReviewPage)
      .subscribe(
        (res: any) => {
          this.sourceCRMLocaleOptions = Array.from(res.source || []);
          if (this.isCrmReviewPage) {
            this.sourceCRMLocaleOptions = Array.from(res.region || []);
          }
          this.destCRMLocaleOptions = Array.from(res.region || []);
          this.filteredCrmLocales = this.sourceCRMLocaleOptions;
          this.destFilteredCrmLocales = this.destCRMLocaleOptions;
          this.crmToast.success("Locales fetched successfully", "Success");

          this.isCRMLoading = false;
        },
        (error) => {
          this.isCRMLoading = false;
          if(error.error.message != "Please accept the terms and condition"){
            this.isCRMLoading = true;
            this.crmToast.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
        this.crmChangesDetect.detectChanges();
      });
  }

  crmTranslate() {
    this.crmSpinnerService.show();
    this.enableCRMTranslate = false;
    const translateService = this.crmContentService
      .translate(
        this.translateCRMSelection,
        this.destCRMLocale,
        this.sourceCRMLocale
      )
      .subscribe(
        (res: MyCRMResponse) => {
          this.crmTranslateAPI = true;
          this.onCRMTranslate = true;
          this.enableCRMTranslate = false;
          this.crmIntervalLoading = false;
          this.crmToast.success(res.message);
          this.enableCRMUpdate = true;
          this.updateCRMTranslation(res.translatedValue);

          this.updateCrmSelection = this.allCrmSelected;
          this.crmSpinnerService.hide();

          this.crmChangesDetect.detectChanges();
        },
        (error) => {
          this.crmSpinnerService.hide();
          console.log(error);
          if (error.error.translatedValue) {
            this.updateCRMTranslation(error.error.translatedValue);
          }
          this.crmChangesDetect.detectChanges();
          this.crmToast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.onCRMTranslate = false;
        this.crmChangesDetect.detectChanges();
        translateService.unsubscribe();
      });
  }

  updateCRMTranslation(translatedCRMValue) {
    translatedCRMValue.forEach((eleCRM: any) => {
      if (eleCRM) {
        const index = this.crmDataSource.data.findIndex(
          (obj) => obj.entryId === eleCRM.orr.orr.entryId && obj.key === eleCRM.key
        );

        const selectIndex = this.allCrmSelected.findIndex(
          (obj) => obj.entryId === eleCRM.orr.orr.entryId && obj.key === eleCRM.key
        );
        if (this.allCrmSelected[selectIndex]) {
          this.allCrmSelected[selectIndex].translatedValue = eleCRM.value;
          this.allCrmSelected[selectIndex].existingValue = eleCRM.value;
          this.crmDataSource.data[index].translatedValue = eleCRM.value;
          this.crmDataSource.data[index].existingValue = eleCRM.value;
          this.crmDataSource.data[index].isTranslated = true;
          
        }
      }
    });
  }

  approveCrmMessages() {
    console.log(this.crmDataSource);

    const dialogRef = this.crmDialog.open(CRMTranslateDialogComponent, {
      data: {
        selected: this.allCrmSelected,
        isApprove: true,
        destLocale: this.destCRMLocale,
        isReviewPage: this.isCrmReviewPage,
        totalCrmCount: this.crmDataSource.data.length,
        details: this.updateCrmSelection,
        locale: this.destCRMLocale,
        spaceId: this.crmSpaceId,
      },
    });

    dialogRef.afterClosed().subscribe(
      (response: any) => {
        if (response === true) {
          this.allCrmSelected = [];
          this.updateCrmSelection = [];
          this.performCrmSearch();
        } else {
          this.crmSpinnerService.hide();
          this.enableCRMUpdate = true;
          this.crmChangesDetect.detectChanges();
        }
      },
      (error) => {
        this.crmSpinnerService.hide();
        this.crmToast.error(error.error.message || "Unknown Error");
        this.showCRMTable = false;
        this.isCRMLoading = true;
      }
    );
  }

  updateCrm() {
    this.enableCRMUpdate = false;
    const translatedData = {
      details: this.updateCrmSelection,
      locale: this.destCRMLocale,
      spaceId: this.crmSpaceId,
      isReviewPage: this.isCrmReviewPage,
      totalCrmCount: this.crmDataSource.data.length,
      sourceLocale: this.sourceCRMLocale,
    };
    const dialogRef = this.crmDialog.open(CRMTranslateDialogComponent, {
      data: translatedData,
    });

    dialogRef.afterClosed().subscribe(
      (response: any) => {
        if (response === true) {
          this.crmSelection.selected.map(item => {
            item.isUploaded = true;
          })
          this.enableCrmReviewer = true;
          this.crmChangesDetect.detectChanges();
          this.allCrmSelected = [];
          this.updateCrmSelection = [];
          this.performCrmSearch();
        } else {
          this.crmSpinnerService.hide();
          this.enableCRMUpdate = true;
          this.crmChangesDetect.detectChanges();
        }
      },
      (error) => {
        this.crmSpinnerService.hide();
        this.crmToast.error(error.error.message || "Unknown Error");
        this.showCRMTable = false;
        this.isCRMLoading = true;
      }
    );
  }

  submitCrmReviewer() {
    this.crmSpinnerService.show();
    this.crmReviewerSubmit = true;
    this.crmContentService
      .submitReviewer({
        data: this.allCrmSelected,
        sourceLocale: this.sourceCRMLocale,
        destLocale: this.destCRMLocale,
        isCRM: this.isCRM,
      })
      .subscribe(
        (res: MyCRMResponse) => {
          this.crmSpinnerService.hide();
          this.crmReviewerSubmit = false;
          this.crmToast.success(res.message, "Success");

          this.crmChangesDetect.detectChanges();
        },
        (error) => {
          this.crmSpinnerService.hide();
          this.crmReviewerSubmit = false;
          this.crmChangesDetect.detectChanges();
          this.crmToast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.crmChangesDetect.detectChanges();
      });
  }

  getCrmSelected(data) {
    this.enableCRMUpdate = data.enableCRMUpdate;
    this.enableCrmKeyTranslate = data.enableCrmKeyTranslate;
    this.enableCrmReviewer = data.enableCrmReviewer;
    this.enableCRMTranslate = data.enableCRMTranslate;
    this.isCRMSelected = data.selected.length !== 0;
    this.crmDataSource.data = data.data;
    this.allCrmSelected = data.crmSelection.selected;
    this.translateCRMSelection = this.allCrmSelected.filter((x) => {
      return !x.existingValue;
    });

    this.updateCrmSelection = !this.isCrmReviewPage
      ? data.updateCrm
      : data.crmSelection.selected;

    this.crmChangesDetect.detectChanges();
  }

  loadMoreCrm(event) {
    this.crmPageIndex = event.pageIndex;
    this.CRMPageSize = event.pageSize;
    this.crmStoredPageIndex = this.crmPageIndex;
    this.searchCrmContent();
  }
}
