import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConversationSettingsPage } from './conversation-settings.page';

describe('ConversationSettingsPage', () => {
  let component: ConversationSettingsPage;
  let fixture: ComponentFixture<ConversationSettingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
