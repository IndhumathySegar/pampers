import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateTableComponent } from './translate-table.component';

describe('TranslateTableComponent', () => {
  let component: TranslateTableComponent;
  let fixture: ComponentFixture<TranslateTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslateTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslateTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
