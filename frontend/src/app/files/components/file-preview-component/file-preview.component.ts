import { Component, computed, inject, input, OnDestroy, OnInit, output, signal, Signal } from '@angular/core';
import { FileInfo } from '../../file-types';
import { IonIcon } from '@ionic/angular/standalone';
import { FileSizePipe } from '../../file-size-pipe';
import { MediaDimensionsCalculator } from '../../services/media-dimensions-calculator';
import { NgOptimizedImage } from '@angular/common';
import { FileDownloaderService } from '../../services/file-downloader';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
  imports: [IonIcon, FileSizePipe, NgOptimizedImage],
})
export class FilePreviewComponent {

  file = input<FileInfo>();
  mediaClick = output<MouseEvent>();
  private mediaDimensionsCalculator = inject(MediaDimensionsCalculator);
  private fileDownloader = inject(FileDownloaderService);
  

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

    this.fileDownloader.downloadFile(file);
  }

}
