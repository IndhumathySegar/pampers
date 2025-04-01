import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditTrailHistoryComponent } from './audit-trail-history.component';

describe('AuditTrailHistoryComponent', () => {
  let component: AuditTrailHistoryComponent;
  let fixture: ComponentFixture<AuditTrailHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuditTrailHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditTrailHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
