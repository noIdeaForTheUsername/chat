import { Injectable, computed, inject, signal } from '@angular/core';

import { MediaViewerFileInfo, FileInfo } from '../../file-types';
import { FileDownloaderService } from './file-downloader';
@Injectable({
  providedIn: 'root'
})
export class MediaViewerService {

  // Settings
  private readonly NEARBY_FILES_AUTOLOADED = 4;

  // Dependencies
  private fileDownloader = inject(FileDownloaderService);

  // Private state
  private readonly _files = signal<MediaViewerFileInfo[] | null>(null);
  private readonly _index = signal(0);
  private _showDownloadButton = signal(true);

  // Public state
  readonly active = computed(() => this._files() !== null);  // "active" means the media viewer is open
  readonly files = this._files.asReadonly();
  readonly currentIndex = this._index.asReadonly();
  public readonly showDownloadButton = this._showDownloadButton.asReadonly();
  readonly filesToLoad = computed(() => {
    const files = this._files();
    const currentIndex = this._index();
    if (!files) return [];
    return files.slice(Math.max(0, currentIndex - this.NEARBY_FILES_AUTOLOADED),
      Math.min(files.length, currentIndex + this.NEARBY_FILES_AUTOLOADED + 1));
  });
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

    const mappedMedia: MediaViewerFileInfo[] = media.map(f => ({
      ...f,
      loaded: false
    }));

    this._files.set(mappedMedia);
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
    const currentFile = this.currentFile();
    if (currentFile)
      this.fileDownloader.downloadFile(currentFile);
  }

  setFileLoaded(uuid: string): void {
    this._files.update(files => {
      if (!files) return files;

      return files.map(file =>
        file.uuid === uuid
          ? { ...file, loaded: true }
          : file
      );
    });
  }
}
