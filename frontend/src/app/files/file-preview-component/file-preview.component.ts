import { Component, input, OnInit } from '@angular/core';
import { FileInfo } from '../file-types';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss'],
})
export class FilePreviewComponent implements OnInit {

  file = input<FileInfo>();

  constructor() { }

  ngOnInit() {}


}
