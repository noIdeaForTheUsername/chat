import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Renderer2
} from '@angular/core';
import { MediaViewerService } from '../../services/media-viewer.service';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-media-viewer',
  standalone: true,
  templateUrl: './media-viewer.component.html',
  styleUrl: './media-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon]
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


  // AI-generated swipe code below:

  private touchStartX = 0;
  private touchStartY = 0;
  private touchActive = false;

  protected touchStart(event: TouchEvent): void {

    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchActive = true;
  }

  protected touchEnd(event: TouchEvent): void {

    if (!this.touchActive) {
      return;
    }

    this.touchActive = false;

    if (event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (Math.abs(deltaX) < 60) {
      return;
    }

    if (deltaX > 0) {
      this.viewer.previous();
    } else {
      this.viewer.next();
    }
  }

  protected touchCancel(): void {
    this.touchActive = false;
  }
}