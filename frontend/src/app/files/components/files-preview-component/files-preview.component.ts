import { Component, inject, input, OnInit } from '@angular/core';
import { FileInfo } from '../../file-types';
import { FilePreviewComponent } from '../file-preview-component/file-preview.component';
import { MediaViewerService } from '../../services/media-viewer.service';

@Component({
  selector: 'app-files-preview',
  templateUrl: './files-preview.component.html',
  styleUrls: ['./files-preview.component.scss'],
  imports: [FilePreviewComponent]
})
export class FilesPreviewComponent {

  files = input<FileInfo[]>();
  private fileViewerService = inject(MediaViewerService);

  onFileClick(clickedFile: FileInfo) {
    const files = this.files();
    if (!files)
      return;

    if (clickedFile.type === 'image' || clickedFile.type === 'video') 
      this.fileViewerService.open(files, clickedFile.uuid);
  }

}
