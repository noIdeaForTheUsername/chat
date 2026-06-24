import { Component, computed, inject, input, OnDestroy, OnInit, signal, Signal } from '@angular/core';
import { FileInfo } from '../file-types';
import { IonIcon } from '@ionic/angular/standalone';
import { FileSizePipe } from '../file-size-pipe';
import { MediaDimensionsCalculator } from '../max-media-height-calculator';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  imports: [IonIcon, FileSizePipe],
})
export class FilePreviewComponent {

  file = input<FileInfo>();
  private readonly mediaDimensionsCalculator = inject(MediaDimensionsCalculator);
  private isFirefox = navigator.userAgent.includes('Firefox');

  protected dimensions: Signal<{ width: number, height: number }> = signal({ width: 0, height: 0 });

  ngOnInit() {
    const file = this.file();
    if (!file)
      return;

    if ((file.type == "image" || file.type == "video") && file?.mediaWidth && file?.mediaHeight) {
      this.dimensions = computed(() => {
        const _width = this.mediaDimensionsCalculator.maxMediaWidth();
        const _height = this.mediaDimensionsCalculator.maxMediaHeight();
        return this.mediaDimensionsCalculator.getFilePreviewDimensions(file);
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
