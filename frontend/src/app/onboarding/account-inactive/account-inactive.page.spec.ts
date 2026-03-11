import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountInactivePage } from './account-inactive.page';

describe('AccountInactivePage', () => {
  let component: AccountInactivePage;
  let fixture: ComponentFixture<AccountInactivePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountInactivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
