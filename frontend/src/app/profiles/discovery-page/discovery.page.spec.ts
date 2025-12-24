import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscoveryPage } from './discovery.page';

describe('DiscoveryPage', () => {
  let component: DiscoveryPage;
  let fixture: ComponentFixture<DiscoveryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscoveryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
