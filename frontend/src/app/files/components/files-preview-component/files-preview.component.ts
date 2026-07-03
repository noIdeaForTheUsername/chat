import { Component, computed, inject, input, OnInit } from '@angular/core';
import { FileInfo } from '../../file-types';
import { FilePreviewComponent } from '../file-preview-component/file-preview.component';
import { MediaViewerService } from '../../services/loading-and-displaying/media-viewer.service';
import { MediaGroupComponent } from "../media-group-component/media-group.component";

@Component({
  selector: 'app-files-preview',
  templateUrl: './files-preview.component.html',
  styleUrls: ['./files-preview.component.scss'],
  imports: [FilePreviewComponent, MediaGroupComponent]
})
export class FilesPreviewComponent {

  files = input.required<FileInfo[]>();
  private mediaViewer = inject(MediaViewerService);
  protected groupMedia = computed(() =>
    this.files().filter((f) => f.type === 'image' || f.type === 'video').length >= 4
  );

  onFileClick(clickedFile: FileInfo) {
    if (clickedFile.type === 'image' || clickedFile.type === 'video') 
      this.mediaViewer.open(this.files(), clickedFile.uuid);
  }

  onMediaGroupClick() {
    this.mediaViewer.open(this.files());
  }
}
