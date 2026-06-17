import { Component, computed, inject, input, OnDestroy, OnInit, Signal } from '@angular/core';
import { FileInfo } from '../file-types';
import { IonIcon } from '@ionic/angular/standalone';
import { FileSizePipe } from '../file-size-pipe';
import { MediaHeightCalculator } from '../max-media-height-calculator';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  imports: [IonIcon, FileSizePipe],
})
export class FilePreviewComponent {

  file = input<FileInfo>();
  private readonly mediaHeightCalculator = inject(MediaHeightCalculator);
  private isFirefox = navigator.userAgent.includes('Firefox');

  protected dimensions: Signal<{ width: number, height: number }> | undefined;

  ngOnInit() {
    const file = this.file();
    if (!file)
      return;

    if ((file.type == "image" || file.type == "video") && file?.mediaWidth && file?.mediaHeight) {
      this.dimensions = computed(() => {
        const _ = this.mediaHeightCalculator.maxMediaHeight();
        return this.mediaHeightCalculator.getFilePreviewDimensions(file);
      });
    }
  }

  downloadFile(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const file = this.file();
    if (!file) {
      alert("Error. Couldn't load file");
      return;
    }

    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.originalName;
    if (this.isFirefox) {
      // firefox for some reason reloads the app without this
      a.target = "_blank";
    }
    a.click();
  }

}
