import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkMigrationsComponent } from './bulk-migrations.component';

describe('BulkMigrationsComponent', () => {
  let component: BulkMigrationsComponent;
  let fixture: ComponentFixture<BulkMigrationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BulkMigrationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BulkMigrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
