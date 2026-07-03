import { Injectable, computed, inject, signal } from '@angular/core';

import { FileInfo } from '../file-types';
import { FileDownloaderService } from './file-downloader';
@Injectable({
  providedIn: 'root'
})
export class MediaViewerService {

  private fileDownloader = inject(FileDownloaderService);

  private readonly _files = signal<FileInfo[] | null>(null);
  private readonly _index = signal(0);

  readonly files = this._files.asReadonly();
  readonly index = this._index.asReadonly();

  readonly active = computed(() => this._files() !== null);

  private _showDownloadButton = signal(true);
  public readonly showDownloadButton = this._showDownloadButton.asReadonly();

  readonly currentFile = computed(() => {
    const files = this._files();
    if (!files)
      return null;
    return files[this._index()];
  });

  open(files: FileInfo[], startUuid?: string, downloadButton: boolean = true): void {
    this._showDownloadButton.set(downloadButton);

    const media = files.filter(f =>
      f.type === 'image' || f.type === 'video'
    );

    if (!media.length) {
      return;
    }

    let startIndex = 0;
    if (startUuid) {
      startIndex = media.findIndex(f => f.uuid === startUuid);
      if (startIndex === -1) {
        console.warn(`MediaViewerService: startUuid ${startUuid} not found in the media files`);
        startIndex = 0;
      }
    }

    this._files.set(media);
    this._index.set(startIndex);
  }

  close(): void {
    this._files.set(null);
    this._index.set(0);
  }

  next(): void {
    const files = this._files();
    if (!files) return;

    let newIndex = this._index() + 1;
    if (newIndex >= files.length) {
      newIndex = 0;
    }
    this._index.set(newIndex);
  }

  previous(): void {
    const files = this._files();
    if (!files) return;

    let newIndex = this._index() - 1;
    if (newIndex < 0) {
      newIndex = files.length - 1;
    }
    this._index.set(newIndex);
  }

  download() {
    const file = this.currentFile();
    if (file)
      this.fileDownloader.downloadFile(file);
  }
} 