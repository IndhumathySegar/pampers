import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MigrationHistoryComponent } from './migration-history.component';

describe('MigrationHistoryComponent', () => {
  let component: MigrationHistoryComponent;
  let fixture: ComponentFixture<MigrationHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MigrationHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MigrationHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
