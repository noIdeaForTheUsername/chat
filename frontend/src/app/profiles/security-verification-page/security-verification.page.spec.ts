import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecurityVerificationPage } from './security-verification.page';

describe('PublicKeysPage', () => {
  let component: SecurityVerificationPage;
  let fixture: ComponentFixture<SecurityVerificationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityVerificationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
