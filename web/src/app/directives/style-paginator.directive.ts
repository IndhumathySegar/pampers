import {
  AfterViewInit,
  Directive,
  Host,
  Optional,
  Renderer2,
  Self,
  ViewContainerRef,
  Input
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";

@Directive({
  selector: "[style-paginator]"
})
export class StylePaginatorDirective implements AfterViewInit {
  private _pageGapTxt = "...";
  private _rangeStart: number;
  private _rangeEnd: number;
  private _buttons = [];
  private _curPageObj = {
    length: 0,
    pageIndex: 0,
    pageSize: 0,
    previousPageIndex: 0
  };

  @Input()
  set manualPageInput(value: number) {
    if (value >= 1 && value <= this.numOfPages) {
      this.switchPage(value - 1);
    }
  }

  @Input()
  get showTotalPages(): number {
    return this._showTotalPages;
  }
  set showTotalPages(value: number) {
    this._showTotalPages = value % 2 === 0 ? value + 1 : value;
  }
  private _showTotalPages = 2;

  get inc(): number {
    return this._showTotalPages % 2 === 0
      ? this.showTotalPages / 2
      : (this.showTotalPages - 1) / 2;
  }

  get numOfPages(): number {
    return this.matPag.getNumberOfPages();
  }

  get lastPageIndex(): number {
    return this.matPag.getNumberOfPages() - 1;
  }

  constructor(
    @Host() @Self() @Optional() private readonly matPag: MatPaginator,
    private vr: ViewContainerRef,
    private ren: Renderer2
  ) {
    this.matPag.page.subscribe((e: any) => {
      if (this._curPageObj.pageSize !== e.pageSize && this._curPageObj.pageIndex !== 0) {
        e.pageIndex = 0;
        this._rangeStart = 0;
        this._rangeEnd = this._showTotalPages - 1;
      }
      this._curPageObj = e;
      this.initPageRange();
    });
  }

  private buildPageNumbers() {
    const actionContainer = this.vr.element.nativeElement.querySelector(
      "div.mat-paginator-range-actions"
    );
    const nextPageNode = this.vr.element.nativeElement.querySelector(
      "button.mat-paginator-navigation-next"
    );

    // Remove existing buttons
    if (this._buttons.length > 0) {
      this._buttons.forEach(button => {
        this.ren.removeChild(actionContainer, button);
      });
      this._buttons.length = 0;
    }

    for (let i = 0; i < this.numOfPages; i++) {
      if (i >= this._rangeStart && i <= this._rangeEnd) {
        this.ren.insertBefore(
          actionContainer,
          this.createButton(i, this.matPag.pageIndex),
          nextPageNode
        );
      }

      if (i === this._rangeEnd && this._rangeEnd < this.lastPageIndex - 1) {
        this.ren.insertBefore(
          actionContainer,
          this.createButton(this._pageGapTxt, this._rangeEnd),
          nextPageNode
        );
      }
    }

    // Add the last page button if not already in range
    if (this._rangeEnd < this.lastPageIndex) {
      this.ren.insertBefore(
        actionContainer,
        this.createButton(this.lastPageIndex, this.matPag.pageIndex),
        nextPageNode
      );
    }
  }

  private createButton(i: any, pageIndex: number): any {
    const linkBtn = this.ren.createElement("button");
    this.ren.addClass(linkBtn, "mat-mini-fab");
    this.ren.setStyle(linkBtn, "margin", "1%");
  
    // Check if the button corresponds to the current page
    if (i === pageIndex) {
      this.ren.setStyle(linkBtn, "background-color", "#0abb87");  // Highlight the current page with green
      this.ren.setStyle(linkBtn, "color", "white"); 
    } else {
      this.ren.setStyle(linkBtn, "background-color", "white");  // Set other pages to white
    }
  
    const pagingTxt = isNaN(i) ? this._pageGapTxt : +(i + 1);
    const text = this.ren.createText(pagingTxt + "");

    this.ren.addClass(linkBtn, "mat-custom-page");
    switch (i) {
      case pageIndex:
        this.ren.setAttribute(linkBtn, "disabled", "disabled");
        break;
        case this._pageGapTxt:
          let jumpToPage = this._rangeEnd + 1; // Move to the page after the current range
          if (jumpToPage >= this.numOfPages) {
              jumpToPage = this.lastPageIndex; // Ensure we don't go past the last page
          }
          this.ren.listen(linkBtn, "click", () => this.switchPage(jumpToPage));
          break;
      default:
        this.ren.listen(linkBtn, "click", () => this.switchPage(i));
        break;
    }

    this.ren.appendChild(linkBtn, text);
    this._buttons.push(linkBtn);
    return linkBtn;
  }

  private initPageRange(): void {
    const middleIndex = (this._rangeStart + this._rangeEnd) / 2;
    this._rangeStart = this.calcRangeStart(middleIndex);
    this._rangeEnd = this.calcRangeEnd(middleIndex);
    this.buildPageNumbers();
  }

  private calcRangeStart(middleIndex: number): number {
    switch (true) {
      case this._curPageObj.pageIndex === 0 && this._rangeStart !== 0:
        return 0;
      case this._curPageObj.pageIndex > this._rangeEnd:
        return this._curPageObj.pageIndex + this.inc > this.lastPageIndex
          ? this.lastPageIndex - this.inc * 2
          : this._curPageObj.pageIndex - this.inc;
      case this._curPageObj.pageIndex > this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex > middleIndex &&
        this._rangeEnd < this.lastPageIndex:
        return this._rangeStart + 1;
      case this._curPageObj.pageIndex < this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex < middleIndex &&
        this._rangeStart > 0:
        return this._rangeStart - 1;
      default:
        return this._rangeStart;
    }
  }

  private calcRangeEnd(middleIndex: number): number {
    switch (true) {
      case this._curPageObj.pageIndex === 0 &&
        this._rangeEnd !== this._showTotalPages:
        return this._showTotalPages - 1;
      case this._curPageObj.pageIndex > this._rangeEnd:
        return this._curPageObj.pageIndex + this.inc > this.lastPageIndex
          ? this.lastPageIndex
          : this._curPageObj.pageIndex + 1;
      case this._curPageObj.pageIndex > this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex > middleIndex &&
        this._rangeEnd < this.lastPageIndex:
        return this._rangeEnd + 1;
      case this._curPageObj.pageIndex < this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex < middleIndex &&
        this._rangeStart >= 0 &&
        this._rangeEnd > this._showTotalPages - 1:
        return this._rangeEnd - 1;
      default:
        return this._rangeEnd;
    }
  }

  private switchPage(i: number): void {
    const previousPageIndex = this.matPag.pageIndex;
    this.matPag.pageIndex = i;
    this.matPag["_emitPageEvent"](previousPageIndex);
    this.initPageRange();
  }

  ngAfterViewInit() {
    this._rangeStart = 0;
    this._rangeEnd = this._showTotalPages - 1;
    this.initPageRange();
  }
}
