import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmRollbackDialogComponent } from './confirm-rollback.dialog.component';

describe('ConfirmMigration.DialogComponent', () => {
  let component: ConfirmRollbackDialogComponent;
  let fixture: ComponentFixture<ConfirmRollbackDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmRollbackDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmRollbackDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
