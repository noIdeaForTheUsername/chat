import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Renderer2,
  ViewChild
} from '@angular/core';
import { MediaViewerService } from '../../services/media-viewer.service';
import { IonIcon } from '@ionic/angular/standalone';
import { ViewportService } from '@src/app/shared/viewport/viewport.service';
import Panzoom from '@panzoom/panzoom';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  templateUrl: './media-viewer.component.html',
  styleUrl: './media-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon]
})
export class MediaViewerComponent {

  protected readonly viewer = inject(MediaViewerService);
  protected currentFile = this.viewer.currentFile;
  private active = this.viewer.active;
  private host = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private viewportService = inject(ViewportService);

  constructor() {
    effect(() => {
      const active = this.active();
      if (active) {
        this.renderer.removeStyle(this.host.nativeElement, 'display');
        this.viewportService.enableZoom();
      } else {
        this.renderer.setStyle(this.host.nativeElement, 'display', 'none');
        this.viewportService.disableZoom();
      }
    });

    effect(() => {
      const file = this.currentFile();
      this.panzoom?.reset();
    });
  }


  private panzoom?: ReturnType<typeof Panzoom>;

  @ViewChild('mediaElement')
  set mediaElement(element: ElementRef<HTMLImageElement | HTMLVideoElement> | undefined) {
    if (!element) {
      return;
    }

    this.panzoom?.destroy();

    this.panzoom = Panzoom(element.nativeElement, {
      maxScale: 5,
      minScale: 1,
      step: 1
    });

    this.handlePanDisabling();

    element.nativeElement.parentElement!
      .addEventListener('wheel', this.panzoom.zoomWithWheel);

    element.nativeElement.addEventListener('touchend', () => {
      this.handlePanDisabling();
    });

    element.nativeElement.addEventListener('wheel', () => {
      this.handlePanDisabling();
    });
  }

  private handlePanDisabling(): void {
    const scale = this.panzoom?.getScale() ?? 1;

    if (scale <= 1) {
      this.panzoom?.reset();
      this.panzoom?.setOptions({
        disablePan: true
      });
    } else {
      this.panzoom?.setOptions({
        disablePan: false
      });
    }
  }
}