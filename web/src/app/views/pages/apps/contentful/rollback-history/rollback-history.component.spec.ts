import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RollbackHistoryComponent } from './rollback-history.component';

describe('RollbackHistoryComponent', () => {
  let component: RollbackHistoryComponent;
  let fixture: ComponentFixture<RollbackHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RollbackHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RollbackHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
