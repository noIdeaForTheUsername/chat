import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  Renderer2,
  signal,
  ViewChild
} from '@angular/core';
import { MediaViewerService } from '../../services/loading-and-displaying/media-viewer.service';
import { IonIcon } from '@ionic/angular/standalone';
import Panzoom from '@panzoom/panzoom';
import { LoadingIndicator } from "@src/app/loading/loading-indicator-component/loading-indicator.component";

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  templateUrl: './media-viewer.component.html',
  styleUrl: './media-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon, LoadingIndicator]
})
export class MediaViewerComponent implements OnDestroy {

  protected readonly viewer = inject(MediaViewerService);
  protected currentFile = this.viewer.currentFile;
  private active = this.viewer.active;
  private host = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  private mediaElementRef: ElementRef<HTMLImageElement | HTMLVideoElement> | undefined;
  private zoomWithWheelHandler: any = null;
  private handlePanDisablingHandler: any = null;

  constructor() {
    effect(() => {
      const active = this.active();
      if (active) {
        this.renderer.removeStyle(this.host.nativeElement, 'display');
      } else {
        this.renderer.setStyle(this.host.nativeElement, 'display', 'none');
      }
    });
  }


  private panzoom?: ReturnType<typeof Panzoom>;

  @ViewChild('mediaElement')
  set mediaElement(element: ElementRef<HTMLImageElement | HTMLVideoElement> | undefined) {
    if (!element) {
      return;
    }
    this.destroyPanzoom();
    this.mediaElementRef = element;
    this.initPanzoom();
  }

  private initPanzoom() {
    const element = this.mediaElementRef;
    if (!element)
      return;
    // Fix "Panzoom should be called on elements that have been attached to the DOM"
    if (!element.nativeElement.isConnected)
      return;

    this.panzoom = Panzoom(element.nativeElement, {
      maxScale: 5,
      minScale: 1,
      step: 0.7
    });

    this.handlePanDisabling();

    this.zoomWithWheelHandler = this.panzoom.zoomWithWheel;
    this.handlePanDisablingHandler = this.handlePanDisabling.bind(this);

    element.nativeElement.parentElement?.addEventListener('wheel', this.zoomWithWheelHandler);
    element.nativeElement.addEventListener('touchend', this.handlePanDisablingHandler);
    element.nativeElement.addEventListener('wheel', this.handlePanDisablingHandler);
  }

  private destroyPanzoom() {
    this.removeEventHandlers();
    this.panzoom?.destroy();
    this.panzoom = undefined;
  }
  private removeEventHandlers() {
    const element = this.mediaElementRef;
    if (!element)
      return;
    element.nativeElement.parentElement?.removeEventListener('wheel', this.zoomWithWheelHandler);
    element.nativeElement.removeEventListener('touchend', this.handlePanDisablingHandler);
    element.nativeElement.removeEventListener('wheel', this.handlePanDisablingHandler);
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

  ngOnDestroy() {
    this.destroyPanzoom()
  }
}