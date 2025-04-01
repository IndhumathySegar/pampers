import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GenAiTcDialogComponent } from './gen-ai-tc.dialog.component';

describe('GenAiTcDialogComponent', () => {
  let component: GenAiTcDialogComponent;
  let fixture: ComponentFixture<GenAiTcDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GenAiTcDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenAiTcDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
