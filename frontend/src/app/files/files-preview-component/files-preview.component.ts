import { Component, input, OnInit } from '@angular/core';
import { FileInfo } from '../file-types';
import { FilePreviewComponent } from '../file-preview-component/file-preview.component';

@Component({
  selector: 'app-files-preview',
  templateUrl: './files-preview.component.html',
  styleUrls: ['./files-preview.component.scss'],
  imports: [FilePreviewComponent]
})
export class FilesPreviewComponent implements OnInit {

  files = input<FileInfo[]>();

  constructor() { }

  ngOnInit() {}


}
