import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateAllHistoryComponent } from './translate-all-history.component';

describe('TranslateAllHistoryComponent', () => {
  let component: TranslateAllHistoryComponent;
  let fixture: ComponentFixture<TranslateAllHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslateAllHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslateAllHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
