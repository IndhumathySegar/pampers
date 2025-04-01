import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CRMContentfulMigrationComponent } from './crm-contentful-migration.component';

describe('CRMContentfulMigrationComponent', () => {
  let component: CRMContentfulMigrationComponent;
  let fixture: ComponentFixture<CRMContentfulMigrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CRMContentfulMigrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CRMContentfulMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
