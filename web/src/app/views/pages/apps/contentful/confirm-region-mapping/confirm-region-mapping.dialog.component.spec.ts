import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmRegionMappingDialogComponent } from './confirm-region-mapping.dialog.component';

describe('ConfirmMigrationDialogComponent', () => {
  let component: ConfirmRegionMappingDialogComponent;
  let fixture: ComponentFixture<ConfirmRegionMappingDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmRegionMappingDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmRegionMappingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
