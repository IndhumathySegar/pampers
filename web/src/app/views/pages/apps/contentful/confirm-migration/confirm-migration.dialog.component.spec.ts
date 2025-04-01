import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmMigrationDialogComponent } from './confirm-migration.dialog.component';

describe('ConfirmMigrationDialogComponent', () => {
  let component: ConfirmMigrationDialogComponent;
  let fixture: ComponentFixture<ConfirmMigrationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmMigrationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmMigrationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
