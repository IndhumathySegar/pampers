import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from "@angular/core";
import { ContentfulService } from "../contentful.service";
import { ToastrService } from "ngx-toastr";
import { MatTableDataSource } from "@angular/material/table";
import { currentUser } from "app/core/auth";
import { select, Store } from "@ngrx/store";
import { take } from "rxjs/operators";
import { AppState } from "app/core/reducers";

interface ContentModel {
  modelName: string;
  selected: boolean;
  modelId: string;
}

@Component({
  selector: "kt-market-expansion",
  templateUrl: "./contentful-market-expansion.component.html",
  styleUrls: ["./contentful-market-expansion.component.scss"],
})
export class NewMarketTranslations implements OnInit {
  dataSource: MatTableDataSource<ContentModel>;
  originalData: ContentModel[] = [];
  displayedColumns: string[] = ["modelName", "select"]; // Add more column names as needed
  isScrolled: boolean = false;
  isLoading: boolean;
  anyRowSelected: boolean = false;
  allRowsSelected: boolean = false;
  selectedRows: ContentModel[] = [];
  sourceLocale: any;
  destLocale: any;
  sourceLocaleOptions: any[] = [];
  destLocaleOptions: any[] = [];
  userName: string;
  searching: boolean = false;
  isCloneJob: boolean = true;
  byTags: boolean = false;
  includeTags: any[] = [];
  excludeTags: any[] = [];
  includedTags: any = [];
  excludedTags: any = [];

  constructor(
    private readonly contentService: ContentfulService,
    private readonly toast: ToastrService,
    private cdr: ChangeDetectorRef,
    private readonly store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store.pipe(select(currentUser), take(1)).subscribe((user) => {
      this.userName = user.firstName + " " + user.lastName;
    });

    this.fetchContentModel();
    this.getTags();
  }

  @HostListener("window:scroll")
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  toggleAllRowsSelection() {
    this.allRowsSelected = !this.allRowsSelected;
    this.dataSource.data.forEach((row) => {
      row.selected = this.allRowsSelected;
    });

    if (this.allRowsSelected) {
      this.selectedRows = this.dataSource.data.map((row) => ({ ...row })); // Select all rows
    } else {
      this.selectedRows = []; // Deselect all rows
    }
    this.anyRowSelected = this.selectedRows.length > 0;
    this.resetSelection(); // Add this line to reset the selection
  }

  toggleRowSelection(row: ContentModel) {
    row.selected = !row.selected;
    const originalRow = this.originalData.find(
      (original) => original.modelId === row.modelId
    );
    if (originalRow) {
      originalRow.selected = row.selected;
    }

    if (row.selected) {
      this.selectedRows.push(row); // Use selectedRows instead of selectedEntries
    } else {
      // Remove the entry if it was deselected
      const index = this.selectedRows.findIndex(
        (selected) => selected.modelId === row.modelId
      );
      if (index !== -1) {
        this.selectedRows.splice(index, 1);
      }
    }

    this.anyRowSelected = this.selectedRows.length > 0;
    this.allRowsSelected =
      this.selectedRows.length === this.dataSource.data.length;
  }

  resetSelection() {
    this.dataSource.data.forEach((row) => {
      const originalRow = this.originalData.find(
        (original) => original.modelId === row.modelId
      );
      if (originalRow) {
        row.selected = originalRow.selected;
      }
    });

    this.updateSelectedRows();
  }

  updateSelectedRows() {
    this.selectedRows = this.dataSource.data.filter((row) => row.selected);
    this.anyRowSelected = this.selectedRows.length > 0;
    this.allRowsSelected =
      this.selectedRows.length === this.dataSource.data.length;
  }

  setIncludedTags(event) {
    if (!event) {
      return;
    }

    if (Array.isArray(this.excludedTags) && this.excludedTags.some(x => event.includes(x))) {
      this.toast.error("Same tags can't be included or excluded!");
      this.includedTags = JSON.parse(JSON.stringify(this.includedTags));
      return;
    }

    this.includedTags = event;
    this.cdr.detectChanges();
  }

  setExcludedTags(event) {
    if (!event) {
      return;
    }

    if (Array.isArray(this.includedTags) && this.includedTags.some(x => event.includes(x))) {
      this.toast.error("Same tags can not be included and excluded!");
      this.excludedTags = JSON.parse(JSON.stringify(this.excludedTags));
      return;
    }

    this.excludedTags = event;
    this.cdr.detectChanges();
  }
  
  resetDestLocales($event) {
    this.sourceLocale = $event;
    if (this.destLocale && this.destLocale.regionCode === this.sourceLocale.regionCode) {
      this.destLocale = null;
    }

    this.destLocaleOptions = Array.from(this.destLocaleOptions || []);
    const index = (this.destLocaleOptions).findIndex(x => x.regionCode === $event.regionCode);
    if (index < 0) return;
    this.destLocaleOptions.splice(index, 1);
    this.cdr.detectChanges();
  }

  fetchContentModel() {
    this.isLoading = true;
    const contentfulModels = this.contentService
      .fetchContentModel()
      .subscribe(
        (res: any) => {
          this.sourceLocaleOptions = Array.from(res.source || []);
          this.destLocaleOptions = Array.from(res.region || []);
          this.dataSource = new MatTableDataSource<ContentModel>(
            res.contentModel
          );
          this.originalData = res.contentModel;
          this.toast.success(res.message, "Success");

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        (error) => {
          if(error.error.message != "Please accept the terms and condition"){
            this.toast.error(error.error.message || "Unknown Error");
          }
        }
      )
      .add(() => {
        contentfulModels.unsubscribe();
      });
  }

  startTranslation(modelId) {
    this.isLoading = true;
    console.log(this.sourceLocale, this.destLocale);
    console.log(modelId);

    if (this.selectedRows.length === 0) {
      // Handle no selected rows case
      return;
    }

    const modelIds = this.selectedRows.map((row) => row.modelId);
    console.log(modelIds);

    this.contentService
      .startTranslationJob({
        sourceLocale: this.sourceLocale,
        destLocale: this.destLocale,
        models: modelIds,
        user: this.userName,
        clone: this.isCloneJob,
      })
      .subscribe(
        (res: any) => {
          console.log(res);
          this.selectedRows = [];
          this.allRowsSelected = false;
          console.log(this.selectedRows);
          // Reset the selected state of each row to false
          this.dataSource.data.forEach((row) => {
            row.selected = false;
          });
          this.anyRowSelected = false;

          this.toast.success(res.message, "Success");
          this.isLoading = false;
        },
        (error) => {
          this.toast.error(error.error.message || "Unknown Error");
          this.isLoading = false;
        }
      )
      .add(() => {
        this.cdr.detectChanges();
      });
  }

  startTranslationByTags() {
    this.isLoading = true;
    this.contentService
      .startTranslationJob({
        sourceLocale: this.sourceLocale,
        destLocale: this.destLocale,
        includedTags: this.includedTags,
        excludedTags: this.excludedTags,
        byTags: true,
        user: this.userName,
        clone: this.isCloneJob,
      })
      .subscribe(
        (res: any) => {
          console.log(res);
          this.toast.success(res.message, "Success");
          this.isLoading = false;
        },
        (error) => {
          this.toast.error(error.error.message || "Unknown Error");
          this.isLoading = false;
        }
      )
      .add(() => {
        this.cdr.detectChanges();
      });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim().toLowerCase();

    this.dataSource.data = this.originalData.filter((entry) =>
      entry.modelName.toLowerCase().includes(filterValue)
    );

    this.searching = filterValue.length > 0;
    console.log(this.searching);
    if (!this.searching) {
      this.allRowsSelected = false;
    }
  }

  submitButtonDisabled() {
    if (!this.byTags) {
      return (
        !this.anyRowSelected ||
        !this.destLocale ||
        !this.sourceLocale ||
        this.isLoading
      );
    }

    return (
      (!Array.isArray(this.includedTags) &&
        !Array.isArray(this.excludedTags)) ||
      (!this.includedTags.length && !this.excludedTags.length) ||
      !this.destLocale ||
      !this.sourceLocale ||
      this.isLoading
    );
  }

  async getTags(): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    const contentfulServiceSubs = this.contentService
      .getTags({ forTranslation: true })
      .subscribe(
        (res: any) => {
          console.log(res, "fetch tags for translation");
          this.includeTags = res.items;
          this.excludeTags = res.items;
          this.toast.success("Tags fetched successfully", "Success");
        },
        (error) => {
          console.log(error);
        }
      )
      .add(() => {
        this.isLoading = false;
        this.cdr.detectChanges();

        contentfulServiceSubs.unsubscribe();
      });
  }
}
