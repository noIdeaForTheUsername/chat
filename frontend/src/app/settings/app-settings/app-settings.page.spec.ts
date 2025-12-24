import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppSettingsPage } from './app-settings.page';

describe('UserSettingsPage', () => {
  let component: AppSettingsPage;
  let fixture: ComponentFixture<AppSettingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
