import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LoadingIndicator } from "@app/loading/loading-indicator-component/loading-indicator.component";

@Component({
  selector: 'app-message-loading-indicator',
  templateUrl: './message-loading-indicator.component.html',
  styleUrls: ['./message-loading-indicator.component.scss'],
  imports: [LoadingIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageLoadingIndicatorComponent {
  showLoadingAnim = input(false);
}
