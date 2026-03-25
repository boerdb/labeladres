import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LijstPage } from './lijst.page';

describe('LijstPage', () => {
  let component: LijstPage;
  let fixture: ComponentFixture<LijstPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LijstPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
