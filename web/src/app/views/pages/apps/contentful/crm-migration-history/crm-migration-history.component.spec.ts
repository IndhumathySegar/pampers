import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CRMMigrationHistoryComponent } from './crm-migration-history.component';

describe('CRMMigrationHistoryComponent', () => {
  let component: CRMMigrationHistoryComponent;
  let fixture: ComponentFixture<CRMMigrationHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CRMMigrationHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CRMMigrationHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
