import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentfulMigrationComponent } from './contentful-migration.component';

describe('ContentfulMigrationComponent', () => {
  let component: ContentfulMigrationComponent;
  let fixture: ComponentFixture<ContentfulMigrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentfulMigrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentfulMigrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
