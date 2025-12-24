import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MessageLoadingIndicatorComponent } from './message-loading-indicator.component';

describe('MessageLoadingIndicatorComponent', () => {
  let component: MessageLoadingIndicatorComponent;
  let fixture: ComponentFixture<MessageLoadingIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageLoadingIndicatorComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageLoadingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
