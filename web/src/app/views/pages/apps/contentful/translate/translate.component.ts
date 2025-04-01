import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
  ViewChild,
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
import { TranslateDialogComponent } from "./confirm-dialog/confirm-dialog.component";
import { MatOption } from "@angular/material";
import { FormGroup, FormBuilder } from "@angular/forms";
import { NgxSpinnerService } from "ngx-spinner";
interface MyResponse {
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
export class TranslateComponent implements OnInit {
  faLanguage = faLanguage;
  faSearch = faSearch;
  destLocale = "";
  sourceLocale = "";
  contentype = "translationKeysValue";
  onTranslate = false;
  pageSize = 5;
  isLoading = false;
  isFetched = false;
  isSelected = false;
  enableTranslate: boolean = false;
  enableKeyTranslate: boolean = false;
  enableReviewer: boolean = false;
  translateSelection: any = [];
  enableUpdate: boolean = false;
  enableHeader: boolean = false;
  showTable = false;
  selection = new SelectionModel<Translate>(true, []);

  dataSource;
  pageIndex = 0;
  storedPageIndex = 0;
  isUpdate = false;
  totalCount: number;
  enterTranslation = false;
  allSelected = [];
  updateSelection = [];
  isScrolled = false;
  searchInput = "";

  searchValueInput = "";
  sourceLocaleOptions: any[] = [];
  destLocaleOptions: any[] = [];
  translationRole = "";
  contentManagerRole = "";
  isReviewPage = false;
  isCRM = false;
  isSpaceLoading = false;
  projects: any = [];
  spaceId;
  intervalLoading = false;
  translateAPI = false;
  filteredLocales: any[] = [];
  reviewerSubmit = false;

  destFilteredLocales: any[] = [];

  contentModels: any = [];
  tags: any = [];
  filteredTags: any[] = [];
  extags: any = [];
  exfilteredTags: any[] = [];
  filteredModel: any[] = [];

  @ViewChild("allModelSelected", { static: false }) allModelSelected: MatOption;
  @ViewChild("allTagSelected", { static: false }) allTagSelected: MatOption;
  @ViewChild("allexTagSelected", { static: false }) allexTagSelected: MatOption;

  tagForm: FormGroup;
  userName: string;
  previousContentModels: string[] = [];
  previousTags: string[] = [];
  previousExTags: string[] = [];
  isApproved: boolean = false;
  setToaster = false;

  constructor(
    private readonly contentService: ContentfulService,
    private readonly changesDetect: ChangeDetectorRef,
    private readonly toast: ToastrService,
    public dialog: MatDialog,
    private appStore: Store<AppState>,
    private router: Router,
    private ngZone: NgZone,
    private formBuilder: FormBuilder,
    private spinnerService: NgxSpinnerService
  ) {
    this.tagForm = this.formBuilder.group({
      tags: [{ value: [], disabled: false }],
      extags: [{ value: [], disabled: false }],
      contentModels: [{ value: [], disabled: false }],
      searchValueInput: [{ value: "", disabled: false }],
    });
  }

  ngOnInit(): void {
    this.isReviewPage = this.router.url.includes("reviewer");
    this.isCRM = this.router.url.startsWith("/crm");
    if (!this.isReviewPage) {
      this.getSpaces();
    } else {
      this.pageSize = 5;
      this.fetchRegions();
    }
    this.getTranslationRole();

    // Initialize previous values
    this.previousContentModels = this.tagForm
      .get("contentModels")
      .value.slice();
    this.previousTags = this.tagForm.get("tags").value.slice();
    this.previousExTags = this.tagForm.get("extags").value.slice();

    // Subscribe to changes in the contentModels form control
    this.tagForm.get("contentModels").valueChanges.subscribe((value) => {
      this.onSelectionChange();
    });

    // Subscribe to changes in the tags form control
    this.tagForm.get("tags").valueChanges.subscribe((value) => {
      this.onSelectionChange();
    });

    // Subscribe to changes in the extags form control
    this.tagForm.get("extags").valueChanges.subscribe((value) => {
      this.onSelectionChange();
    });
  }

  getTranslationRole() {
    this.appStore.select(currentUser).subscribe((user) => {
      const appRolePermission = user.rolePermissions.find(
        (item) => item.uniqueResourceName === "contentManagement"
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
        "contentManagement:translation",
        "contentManagement:translation:createTranslation"
      );

      const reviewerService = getSubResourceService(
        "contentManagement:reviewer",
        "contentManagement:reviewer:createTranslation"
      );

      if (translationService && !this.isReviewPage) {
        this.translationRole = "contentManager";
      } else if (reviewerService && this.isReviewPage) {
        this.translationRole = "reviewer";
      }
      this.userName = `${user.firstName} ${user.lastName}`;
    });
  }

  filterOptions(searchText) {
    console.log(searchText);
    const filterValue = searchText.toLowerCase();
    this.filteredLocales = this.sourceLocaleOptions.filter((locale) => {
      return (
        locale.regionName.toLowerCase().includes(filterValue) ||
        locale.regionCode.toLowerCase().includes(filterValue)
      );
    });
  }

  destFilterOptions(searchText) {
    console.log(searchText);
    const filterValue = searchText.toLowerCase();
    this.destFilteredLocales = this.destLocaleOptions.filter((locale) => {
      return (
        locale.regionName.toLowerCase().includes(filterValue) ||
        locale.regionCode.toLowerCase().includes(filterValue)
      );
    });
  }

  @HostListener("window:scroll")
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  async getSpaces(): Promise<void> {
    this.pageIndex = 0;
    this.storedPageIndex = 0;
    this.isSpaceLoading = true;
    this.changesDetect.detectChanges();

    const contentfulServiceSubs = this.contentService
      .getProjects(this.isCRM)
      .subscribe((res: any) => {
        this.projects = res.items;
      })
      .add(() => {
        this.isSpaceLoading = false;
        !this.changesDetect["destroyed"] && this.changesDetect.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }

  getEnvironments(spaceId) {
    this.dataSource = [];
    this.sourceLocale = "";
    this.destLocale = "";
    this.spaceId = spaceId;
    this.fetchRegions();
  }

  payloadConstruction(pageIndex, pageSize) {
    const payloadData = {
      type: this.tagForm.value.contentModels,
      sourceLocale: this.sourceLocale,
      destinationLocale: this.destLocale,
      searchText: this.tagForm.value.tags,
      searchValue: this.tagForm.value.searchValueInput,
      pageIndex,
      pageSize,
      spaceId: this.spaceId,
      isCRM: this.isCRM,
      extags: this.tagForm.value.extags,
    };
    return payloadData;
  }

  searchContent() {
    this.enableTranslate = false;
    this.enableUpdate = false;
    this.showTable = false;
    this.spinnerService.show();
    this.changesDetect.detectChanges();
    const pageIndex = this.pageIndex;
    const pageSize = this.pageSize;
    const payload: any = this.payloadConstruction(pageIndex, pageSize);

    if (this.isReviewPage) {
      payload.isReviewPage = this.isReviewPage;
    }

    // Call the method in your service or API to fetch the entries
    const contentService = this.contentService
      .searchContent(payload)
      .subscribe(
        (res: MyResponse) => {
          this.spinnerService.hide();
          this.totalCount = res.data.totalEntries;
          res.data.extractedData.forEach((item) => {
            if (/^\d+$/.test(item.value)) {
              item.isCheckDisabled = true;
            }else{
              item.isCheckDisabled = false;
            }
            const contentData: any = this.contentModels.find(
              (modelData) => modelData.modelName === item.contentModelName
            );
            // Find the field definition within the content type
            const fieldDefinition = contentData.fields.find(
              (field) => field.id === item.key
            );

            if (fieldDefinition) {
              // Extract the validations from the field definition
              const validations = fieldDefinition.validations;

              // Find and return the character limit validation, if it exists
              const charLimitValidation = validations.find(
                (validation) => validation.size
              );

              item.charLimit =
                charLimitValidation && charLimitValidation.size.max
                  ? charLimitValidation.size.max
                  : this.getOverallLimit(fieldDefinition);
            }
          });
          this.dataSource = new MatTableDataSource<Translate>(
            res.data.extractedData
          );
          this.selection.clear();

          this.toast.success(res.message, "Success");
        },
        (error) => {
          this.spinnerService.hide();
          this.toast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.isLoading = false;
        this.showTable = true;
        this.isFetched = true;
        this.changesDetect.detectChanges();
        contentService.unsubscribe();
      });
  }

  getOverallLimit(fieldDefinition) {
    if (fieldDefinition.type === "RichText") {
      return 200000;
    }
    if (fieldDefinition.type === "Text") {
      return 50000;
    } else {
      return 256;
    }
  }

  performSearch(allRecord?, searchValue?) {
    if (!this.isReviewPage) {
      this.pageIndex = 0;
      this.storedPageIndex = 0;
    }
    if (this.isReviewPage) {
      if (allRecord && this.pageIndex > 0) {
        this.pageIndex = this.pageIndex - 1;
        this.storedPageIndex = this.storedPageIndex - 1;
      }
    }

    if (searchValue === "search") {
      this.pageIndex = 0;
      this.storedPageIndex = 0;
    }
    this.searchContent();
  }

  onLocaleChange() {
    this.allSelected = [];
    this.pageIndex = 0;
    this.storedPageIndex = 0;
    this.enableTranslate = false;
    this.translateAPI = false;
    if (this.isReviewPage) {
      this.searchInput = "";
      this.destLocale = this.sourceLocale;
      console.log("---------this.pageIndex-", this.pageIndex);
      this.searchContent();
      return;
    }
    if (!this.sourceLocale || !this.destLocale) return;
    this.searchInput = "";
    this.searchContent();
  }

  resetDestLocales($event) {
    this.sourceLocale = $event;
    if (this.destLocale && this.destLocale === this.sourceLocale) {
      this.destLocale = null;
    }

    this.destLocaleOptions = Array.from(this.sourceLocaleOptions || []);
    const index = this.destLocaleOptions.findIndex(
      (x) => x.regionCode === $event
    );
    if (index < 0) return;
    this.destLocaleOptions.splice(index, 1);
    this.changesDetect.detectChanges();
  }

  fetchRegions() {
    this.isLoading = true;
    this.pageIndex = 0;
    this.storedPageIndex = 0;
    const contentfulModels = this.contentService
      .fetchContentModel(this.spaceId, this.isReviewPage)
      .subscribe(
        (res: any) => {
          this.sourceLocaleOptions = Array.from(res.source || []);
          if (this.isReviewPage) {
            this.sourceLocaleOptions = Array.from(res.region || []);
          }
          this.destLocaleOptions = Array.from(res.region || []);
          this.filteredLocales = this.sourceLocaleOptions;
          this.destFilteredLocales = this.destLocaleOptions;
          this.contentModels = res.contentModel;
          this.filteredModel = res.contentModel;
          this.toast.success("Locales fetched successfully", "Success");

          this.isLoading = false;
        },
        (error) => {
          this.isLoading = false;
          if(error.error.message != "Please accept the terms and condition"){
            this.isLoading = true;
            this.toast.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
        this.changesDetect.detectChanges();
      });
    this.getTags();
  }

  translate() {
    this.spinnerService.show();
    this.enableTranslate = false;
    const translateService = this.contentService
      .translate(this.translateSelection, this.destLocale, this.sourceLocale)
      .subscribe(
        (res: MyResponse) => {
          this.translateAPI = true;
          this.onTranslate = true;
          this.enableTranslate = true;
          this.spinnerService.hide();
          this.updateTranslation(res.translatedValue);
          this.intervalLoading = false;
          this.translateAPI = false;
          this.enableUpdate = true;

          this.updateSelection = this.allSelected;

          this.changesDetect.detectChanges();

          this.toast.success(res.message);
        },
        (error) => {
          console.log(error);
          if (error.error.translatedValue) {
            this.updateTranslation(error.error.translatedValue);
            this.enableTranslate = true;
          }
          this.spinnerService.hide();
          this.changesDetect.detectChanges();
          this.toast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.onTranslate = false;
        this.changesDetect.detectChanges();
        translateService.unsubscribe();
      });
  }

  updateTranslation(translatedValue) {
    translatedValue.forEach((ele: any) => {
      if (ele) {
        const index = this.dataSource.data.findIndex(
          (obj) => obj.entryId === ele.orr.orr.entryId && obj.key === ele.key
        );

        const selectIndex = this.allSelected.findIndex(
          (obj) => obj.entryId === ele.orr.orr.entryId && obj.key === ele.key
        );
        if (this.allSelected[selectIndex]) {
          this.allSelected[selectIndex].translatedValue = ele.value;
          this.allSelected[selectIndex].existingValue = ele.value;
          this.dataSource.data[index].translatedValue = ele.value;
          this.dataSource.data[index].existingValue = ele.value;
        }
      }
    });
  }

  approveMessages() {
    console.log(this.dataSource);
    this.isApproved = false;
    const dialogRef = this.dialog.open(TranslateDialogComponent, {
      data: {
        selected: this.allSelected,
        isApprove: true,
        destLocale: this.destLocale,
        isReviewPage: this.isReviewPage,
        totalCount: this.dataSource.data.length,
        details: this.updateSelection,
        locale: this.destLocale,
        spaceId: this.spaceId,
      },
    });

    dialogRef.afterClosed().subscribe(
      (response: any) => {
        console.log("[response]", response);

        if (response === true) {
          let allRecord = false;
          if (this.dataSource.data.length === this.allSelected.length) {
            allRecord = true;
            this.allSelected = [];
            this.updateSelection = [];
            this.enableHeader = false;
            this.isApproved = true;
            this.performSearch(allRecord);
          } else {
            this.dataSource = new MatTableDataSource<Translate>(
              this.dataSource.data.filter((item) => {
                return !this.allSelected.some(
                  (selected) =>
                    selected.key === item.key &&
                    selected.entryId === item.entryId
                );
              })
            );
            this.allSelected = [];
            this.updateSelection = [];
            this.enableHeader = false;
            this.isApproved = true;
            this.spinnerService.hide();
            this.isLoading = false;
            this.selection.clear();
          }
        } else {
          this.isApproved = true;
          this.spinnerService.hide();
          this.enableUpdate = true;
          this.changesDetect.detectChanges();
        }
      },
      (error) => {
        this.isApproved = true;
        this.spinnerService.hide();
        this.toast.error(error.error.message || "Unknown Error");
        this.showTable = false;
        this.isLoading = true;
      }
    );
  }

  getUpdateTranslation() {
    this.enableTranslate = false;
    this.enterTranslation = true;

    const translateService = this.contentService
      .getTranslation()
      .subscribe(
        (res: MyResponse) => {
          res.translatedValue.forEach((ele: any) => {
            if (ele) {
              const index = this.dataSource.data.findIndex(
                (obj) =>
                  obj.entryId === ele.orr.orr.entryId && obj.key === ele.key
              );

              const selectIndex = this.allSelected.findIndex(
                (obj) =>
                  obj.entryId === ele.orr.orr.entryId && obj.key === ele.key
              );
              if (this.allSelected[selectIndex]) {
                this.allSelected[selectIndex].translatedValue = ele.value;
                this.allSelected[selectIndex].existingValue = ele.value;
                this.dataSource.data[index].translatedValue = ele.value;
                this.dataSource.data[index].existingValue = ele.value;
              }
            }
          });

          this.changesDetect.detectChanges();
          this.enterTranslation = false;
        },
        (error) => {
          this.enterTranslation = false;
          this.changesDetect.detectChanges();
        }
      )
      .add(() => {
        this.onTranslate = false;
        this.changesDetect.detectChanges();
        translateService.unsubscribe();
      });
  }

  update() {
    this.enableUpdate = false;
    const translatedData = {
      details: this.updateSelection,
      locale: this.destLocale,
      spaceId: this.spaceId,
      isReviewPage: this.isReviewPage,
      totalCount: this.dataSource.data.length,
    };
    const dialogRef = this.dialog.open(TranslateDialogComponent, {
      data: translatedData,
    });

    dialogRef.afterClosed().subscribe(
      (response: any) => {
        if (response === true) {
          this.selection.selected.map(item => {
            item.isUploaded = true;
          })
          this.enableReviewer = true;
          this.allSelected = [];
          this.updateSelection = [];          
          this.selection.clear();
          this.enableHeader = false;
          this.spinnerService.hide();
          this.changesDetect.detectChanges();
        } else {
          this.spinnerService.hide();
          this.enableUpdate = true;
          this.changesDetect.detectChanges();
        }
      },
      (error) => {
        this.spinnerService.hide();
        this.toast.error(error.error.message || "Unknown Error");
        this.showTable = false;
        this.isLoading = true;
      }
    );
  }

  submitReviewer() {
    this.spinnerService.show();
    this.reviewerSubmit = true;
    this.contentService
      .submitReviewer({
        data: this.allSelected,
        sourceLocale: this.sourceLocale,
        destLocale: this.destLocale,
        isCRM: this.isCRM,
      })
      .subscribe(
        (res: MyResponse) => {
          this.spinnerService.hide();
          this.reviewerSubmit = false;
          this.toast.success(res.message, "Success");

          this.changesDetect.detectChanges();
        },
        (error) => {
          this.spinnerService.hide();
          this.reviewerSubmit = false;
          this.changesDetect.detectChanges();
          this.toast.error(error.error.message || "Unknown Error");
        }
      )
      .add(() => {
        this.changesDetect.detectChanges();
      });
  }

  getSelected(data) {
    this.enableUpdate = data.enableUpdate;
    this.enableKeyTranslate = data.enableKeyTranslate;
    this.enableReviewer = data.enableReviewer;
    this.enableTranslate = data.enableTranslate;
    this.isSelected = data.selected.length !== 0;
    this.dataSource.data = data.data;
    this.allSelected = data.selection.selected;
    this.translateSelection = this.allSelected.filter((x) => {
      return !x.existingValue;
    });

    this.enableHeader = data.enableHeader;
    this.updateSelection = !this.isReviewPage
      ? data.update
      : data.selection.selected;

    this.changesDetect.detectChanges();
  }

  loadMore(event) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.storedPageIndex = this.pageIndex;
    this.searchContent();
  }

  async tossleModelSelection(): Promise<void> {
    if (this.allModelSelected.selected) {
      this.tagForm.controls.contentModels.patchValue(
        [0].concat(this.contentModels.map((item) => item.modelId))
      );
      delete this.tagForm.controls.contentModels[0];
    } else {
      this.tagForm.controls.contentModels.patchValue([]);
      this.performSearch();
    }
  }

  async tossleTagSelection(): Promise<void> {
    if (this.allTagSelected.selected) {
      this.tagForm.controls.tags.patchValue(
        [0].concat(this.tags.map((item) => item.sys.id))
      );
      delete this.tagForm.controls.tags[0];
    } else {
      this.tagForm.controls.tags.patchValue([]);
      this.performSearch();
    }
  }

  async tossleExTagSelection(): Promise<void> {
    if (this.allexTagSelected.selected) {
      this.tagForm.controls.extags.patchValue(
        [0].concat(this.extags.map((item) => item.sys.id))
      );
      delete this.tagForm.controls.extags[0];
    } else {
      this.tagForm.controls.extags.patchValue([]);
      this.performSearch();
    }
  }

  async getTags(): Promise<void> {
    const contentfulServiceSubs = this.contentService
      .getTags({ spaceId: this.spaceId, forTranslation: true })
      .subscribe(
        (res: any) => {
          this.tags = res.items;
          this.filteredTags = res.items;
          this.extags = res.items;
          this.exfilteredTags = res.items;
        },
        (_) => {
          console.log("error");
        }
      )
      .add(() => {
        contentfulServiceSubs.unsubscribe();
      });
  }

  tagFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.tagForm.get("tags").value;
    const filteredTag = this.tags.filter((tags) => {
      return (
        tags.sys.id.toLowerCase().includes(filterValue) ||
        tags.name.toLowerCase().includes(filterValue)
      );
    });
    // Include previously selected items if not already in the filtered list
    const selectedItems = this.extags.filter((tags) =>
      previouslySelectedItems.includes(tags.sys.id)
    );

    // Combine filtered results with selected items
    let combinedResults = filteredTag.slice();

    selectedItems.forEach((item) => {
      // Add previously selected items if they are not already in the combinedResults
      if (!combinedResults.some((tags) => tags.sys.id === item.sys.id)) {
        combinedResults.push(item);
      }
    });

    this.filteredTags = combinedResults;
  }
  extagFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.tagForm.get("extags").value;
    const exfilteredTag = this.extags.filter((tags) => {
      return (
        tags.sys.id.toLowerCase().includes(filterValue) ||
        tags.name.toLowerCase().includes(filterValue)
      );
    });
    // Include previously selected items if not already in the filtered list
    const selectedItems = this.extags.filter((tags) =>
      previouslySelectedItems.includes(tags.sys.id)
    );

    // Combine filtered results with selected items
    let combinedResults = exfilteredTag.slice();

    selectedItems.forEach((item) => {
      // Add previously selected items if they are not already in the combinedResults
      if (!combinedResults.some((tags) => tags.sys.id === item.sys.id)) {
        combinedResults.push(item);
      }
    });

    this.exfilteredTags = combinedResults;
  }

  modelFilterOptions(searchText) {
    const filterValue = searchText.toLowerCase();
    const previouslySelectedItems = this.tagForm.get("contentModels").value;

    // Filter content models based on search text
    const filtered = this.contentModels.filter((models) =>
      models.modelName.toLowerCase().includes(filterValue)
    );

    // Include previously selected items if not already in the filtered list
    const selectedItems = this.contentModels.filter((model) =>
      previouslySelectedItems.includes(model.modelId)
    );

    // Combine filtered results with selected items
    let combinedResults = filtered.slice();

    selectedItems.forEach((item) => {
      // Add previously selected items if they are not already in the combinedResults
      if (!combinedResults.some((model) => model.modelId === item.modelId)) {
        combinedResults.push(item);
      }
    });

    this.filteredModel = combinedResults;
  }

  setIncludedTags(event) {
    if (!event) {
      return;
    }
    if (
      Array.isArray(this.tagForm.value.extags) &&
      this.tagForm.value.extags.some((x) => event == x)
    ) {
      this.toast.error("Same tags can't be included or excluded!");
      const updatedTags = this.tagForm.value.tags.filter(
        (tag) => tag !== event
      );
      this.tagForm.controls["tags"].setValue(updatedTags);
      return;
    }
    this.changesDetect.detectChanges();
  }

  setExcludedTags(event) {
    if (!event) {
      return;
    }
    if (
      Array.isArray(this.tagForm.value.tags) &&
      this.tagForm.value.tags.some((x) => event == x)
    ) {
      this.toast.error("Same tags can not be included and excluded!");
      const updatedExTags = this.tagForm.value.extags.filter(
        (extag) => extag !== event
      );
      this.tagForm.controls["extags"].setValue(updatedExTags);
      return;
    }
    this.changesDetect.detectChanges();
  }

  startTranslationByTags() {
    let tempSource = this.filteredLocales.filter(
      (x) => x.regionCode == this.sourceLocale
    );
    let tempDest = this.destFilteredLocales.filter(
      (x) => x.regionCode == this.destLocale
    );
    this.spinnerService.show();
    this.isLoading = true;
    this.contentService
      .startTranslationJob({
        sourceLocale: tempSource[0],
        destLocale: tempDest[0],
        includedTags: this.tagForm.value.tags,
        excludedTags: this.tagForm.value.extags,
        byTags:
          this.tagForm.value.tags.length > 0 ||
          this.tagForm.value.extags.length > 0
            ? true
            : false,
        user: this.userName,
        clone: false,
        models: this.tagForm.value.contentModels,
      })
      .subscribe(
        (res: any) => {
          this.spinnerService.hide();
          console.log(res);
          this.toast.success(res.message, "Success");
          this.isLoading = false;
        },
        (error) => {
          this.spinnerService.hide();
          this.toast.error(error.error.message || "Unknown Error");
          this.isLoading = false;
        }
      )
      .add(() => {
        this.changesDetect.detectChanges();
      });
  }

  onSelectionChange() {
    const currentContentModels = this.tagForm.get("contentModels").value;
    const currentTags = this.tagForm.get("tags").value;
    const currentExTags = this.tagForm.get("extags").value;
    // Restrict selection to 5 items
    if (
      !this.isReviewPage &&
      currentContentModels.length > 5 &&
      !this.setToaster
    ) {
      this.setToaster = true;
      this.toast.warning(
        "You can only select up to 5 items to translate and submit to reviewer."
      );
      setTimeout(() => {
        this.setToaster = false;
      }, 300);
    }

    // Check if any option was unselected
    const wasContentModelUnselected =
      this.previousContentModels.length > currentContentModels.length;
    const wasTagUnselected = this.previousTags.length > currentTags.length;
    const wasExTagUnselected =
      this.previousExTags.length > currentExTags.length;

    // Update previous values
    this.previousContentModels = currentContentModels.slice();
    this.previousTags = currentTags.slice();
    this.previousExTags = currentExTags.slice();

    // If any option was unselected, perform the API call
    if (wasContentModelUnselected || wasTagUnselected || wasExTagUnselected) {
      if (
        wasContentModelUnselected &&
        this.tagForm.value.contentModels.length == 1 &&
        this.tagForm.value.tags.length == 0 &&
        this.tagForm.value.extags.length == 0
      ) {
        this.tagForm.value.contentModels = [];
        this.pageIndex = 0;
        this.storedPageIndex = 0;
        this.performSearch();
      }
      if (
        wasTagUnselected &&
        this.tagForm.value.tags.length == 1 &&
        this.tagForm.value.contentModels.length == 0 &&
        this.tagForm.value.extags.length == 0
      ) {
        this.tagForm.value.tags = [];
        this.pageIndex = 0;
        this.storedPageIndex = 0;
        this.performSearch();
      }
      if (
        wasExTagUnselected &&
        this.tagForm.value.extags.length == 1 &&
        this.tagForm.value.contentModels.length == 0 &&
        this.tagForm.value.tags.length == 0
      ) {
        this.tagForm.value.extags = [];
        this.pageIndex = 0;
        this.storedPageIndex = 0;
        this.performSearch();
      }
    }
  }
}