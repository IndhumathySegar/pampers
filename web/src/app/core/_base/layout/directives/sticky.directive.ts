import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { animationFrameScheduler } from "rxjs/internal/scheduler/animationFrame";
import {
  filter,
  map,
  share,
  startWith,
  takeUntil,
  throttleTime,
} from "rxjs/operators";

/**
 * Extended version of "Sticky Directive for Angular 2+"
 * https://github.com/w11k/angular-sticky-things
 */

export interface StickyPositions {
  offsetY: number;
  bottomBoundary: number | null;
}

export interface StickyStatus {
  isSticky: boolean;
  reachedLowerEdge: boolean;
  marginTop: number;
  marginBottom: number;
}

@Directive({
  selector: "[ktSticky]",
})
export class StickyDirective implements OnInit, AfterViewInit, OnDestroy {
  filterGate = false;
  marginTop$ = new BehaviorSubject(0);
  marginBottom$ = new BehaviorSubject(0);
  enable$ = new BehaviorSubject(true);

  @Input() scrollContainer: string | HTMLElement;
  @Input("spacerElement") spacerElement: HTMLElement | undefined;
  @Input("boundaryElement") boundaryElement: HTMLElement | undefined;
  @HostBinding("class.is-sticky") sticky = false;
  @HostBinding("class.boundary-reached") boundaryReached = false;
  /**
   * The field represents some position values in normal (not sticky) mode.
   * If the browser size or the content of the page changes, this value must be recalculated.
   */
  private scroll$ = new Subject<number>();
  private scrollThrottled$: Observable<number>;
  private resize$ = new Subject<void>();
  private resizeThrottled$: Observable<void>;
  private extraordinaryChange$ = new BehaviorSubject<void>(undefined);
  private status$: Observable<StickyStatus>;
  private componentDestroyed = new Subject<void>();

  constructor(
    private stickyElement: ElementRef,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    /** Throttle the scroll to animation frame (around 16.67ms) */
    this.scrollThrottled$ = this.scroll$.pipe(
      throttleTime(0, animationFrameScheduler),
      share()
    );

    const nullValue = null;

    /** Throttle the resize to animation frame (around 16.67ms) */
    this.resizeThrottled$ = this.resize$.pipe(
      throttleTime(0, animationFrameScheduler),
      // emit once since we are currently using combineLatest
      startWith(nullValue),
      share()
    );

    this.status$ = combineLatest([
      this.enable$,
      this.scrollThrottled$,
      this.marginTop$,
      this.marginBottom$,
      this.extraordinaryChange$,
      this.resizeThrottled$,
    ]).pipe(
      filter(([enabled]) => this.checkEnabled(enabled)),
      map(([enabled, pageYOffset, marginTop, marginBottom]) =>
        this.determineStatus(
          this.determineElementOffsets(),
          pageYOffset,
          marginTop,
          marginBottom,
          enabled
        )
      ),
      share()
    );
  }

  @Input() set marginTop(value: number) {
    this.marginTop$.next(value);
  }

  @Input() set marginBottom(value: number) {
    this.marginBottom$.next(value);
  }

  @Input() set enable(value: boolean) {
    this.enable$.next(value);
  }

  ngAfterViewInit(): void {
    this.status$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe((status) => this.setSticky(status));
  }

  public recalculate(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Make sure to be in the next tick by using timeout
      setTimeout(() => {
        this.extraordinaryChange$.next(undefined);
      }, 0);
    }
  }

  /**
   * This is nasty code that should be refactored at some point.
   *
   * The Problem is, we filter for enabled. So that the code doesn't run
   * if @Input enabled = false. But if the user disables, we need exactly 1
   * emit in order to reset and call removeSticky. So this method basically
   * turns the filter in "filter, but let the first pass".
   */
  checkEnabled(enabled: boolean): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (enabled) {
      // reset the gate
      this.filterGate = false;
      return true;
    } else {
      if (this.filterGate) {
        // gate closed, first emit has happened
        return false;
      } else {
        // this is the first emit for enabled = false,
        // let it pass, and activate the gate
        // so the next wont pass.
        this.filterGate = true;
        return true;
      }
    }
  }

  @HostListener("window:resize", [])
  onWindowResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.resize$.next();
    }
  }

  setupListener(): void {
    if (isPlatformBrowser(this.platformId)) {
      const target = this.getScrollTarget();
      target.addEventListener("scroll", this.listener);
    }
  }

  removeListener() {
    if (isPlatformBrowser(this.platformId)) {
      const target = this.getScrollTarget();
      target.removeEventListener("scroll", this.listener);
    }
  }

  listener = (e: Event) => {
    const upperScreenEdgeAt =
      (e.target as HTMLElement).scrollTop || window.scrollY;
    this.scroll$.next(upperScreenEdgeAt);
  };

  ngOnInit(): void {
    this.setupListener();
  }

  ngOnDestroy(): void {
    this.componentDestroyed.next();
    this.removeListener();
  }

  getComputedStyle(el: HTMLElement) {
    return el.getBoundingClientRect();
  }

  private getScrollTarget(): Element | Window {
    let target: Element | Window;

    if (this.scrollContainer && typeof this.scrollContainer === "string") {
      target = document.querySelector(this.scrollContainer);
    } else if (
      this.scrollContainer &&
      this.scrollContainer instanceof HTMLElement
    ) {
      target = this.scrollContainer;
    } else {
      target = window;
    }
    return target;
  }

  private determineStatus(
    originalVals: StickyPositions,
    pageYOffset: number,
    marginTop: number,
    marginBottom: number,
    enabled: boolean
  ): StickyStatus {
    const stickyElementHeight = this.getComputedStyle(
      this.stickyElement.nativeElement
    ).height;
    const reachedLowerEdge =
      this.boundaryElement &&
      window.scrollY + stickyElementHeight + marginBottom >=
        originalVals.bottomBoundary - marginTop;
    return {
      isSticky: enabled && pageYOffset > originalVals.offsetY,
      reachedLowerEdge,
      marginBottom,
      marginTop,
    };
  }

  /**
   * Gets the offset for element. If the element
   * currently is sticky, it will get removed
   * to access the original position. Other
   * wise this would just be 0 for fixed elements.
   */
  private determineElementOffsets(): StickyPositions {
    if (this.sticky) {
      this.removeSticky();
    }

    let bottomBoundary: number | null = null;

    if (this.boundaryElement) {
      const boundaryElementHeight = this.getComputedStyle(
        this.boundaryElement
      ).height;
      const boundaryElementOffset = getPosition(this.boundaryElement).y;
      bottomBoundary = boundaryElementHeight + boundaryElementOffset;
    }

    return {
      offsetY:
        getPosition(this.stickyElement.nativeElement).y - this.marginTop$.value,
      bottomBoundary,
    };
  }

  private makeSticky(
    marginTop: number,
    marginBottom: number,
    boundaryReached: boolean = false
  ): void {
    this.boundaryReached = boundaryReached;

    // do this before setting it to pos:fixed
    const { width, height } = this.getComputedStyle(
      this.stickyElement.nativeElement
    );

    this.sticky = true;
    this.stickyElement.nativeElement.style.position = "sticky";
    this.stickyElement.nativeElement.style.backgroundColor = "#fff";
    this.stickyElement.nativeElement.style.top = this.marginTop$.value + "px";
    this.stickyElement.nativeElement.style.width = `${width}px`;
    this.stickyElement.nativeElement.style.zIndex = `2`;
    if (this.spacerElement) {
      const spacerHeight = marginBottom + height + marginTop;
      this.spacerElement.style.height = `${spacerHeight}px`;
    }
  }

  private setSticky(status: StickyStatus): void {
    if (status.isSticky) {
      this.makeSticky(
        status.marginTop,
        status.marginBottom,
        status.reachedLowerEdge
      );
    } else {
      this.removeSticky();
    }
  }

  private removeSticky(): void {
    this.boundaryReached = false;
    this.sticky = false;

    this.stickyElement.nativeElement.style.position = "";
    this.stickyElement.nativeElement.style.width = "auto";
    this.stickyElement.nativeElement.style.left = "auto";
    this.stickyElement.nativeElement.style.top = "auto";
    if (this.spacerElement) {
      this.spacerElement.style.height = "0";
    }
  }
}

// Thanks to https://stanko.github.io/javascript-get-element-offset/
function getPosition(el) {
  let top = 0;
  let left = 0;
  let element = el;

  // Loop through the DOM tree
  // and add it's parent's offset to get page offset
  do {
    top += element.offsetTop || 0;
    left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while (element);

  return {
    y: top,
    x: left,
  };
}
