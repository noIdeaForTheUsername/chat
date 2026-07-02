import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Renderer2
} from '@angular/core';
import { MediaViewerService } from '../../services/media-viewer.service';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  templateUrl: './media-viewer.component.html',
  styleUrl: './media-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewerOverlayComponent {

  protected readonly viewer = inject(MediaViewerService);
  protected currentFile = this.viewer.currentFile;
  private active = this.viewer.active;
  private host = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const active = this.active();
      if (active) {
        this.renderer.removeStyle(this.host.nativeElement, 'display');
      } else {
        this.renderer.setStyle(this.host.nativeElement, 'display', 'none');
      }
    })
  }
}