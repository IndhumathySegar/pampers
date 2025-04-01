import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigUpdateComponent } from './config-update.component';

describe('ConfigUpdateComponent', () => {
  let component: ConfigUpdateComponent;
  let fixture: ComponentFixture<ConfigUpdateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigUpdateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
