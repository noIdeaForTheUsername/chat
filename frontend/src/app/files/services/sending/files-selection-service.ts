import { HostListener, inject, Injectable, signal } from "@angular/core";
import { FilesValidatorService } from "./file-validator";

@Injectable()
export class FilesSelectionService {

  private filesValidator = inject(FilesValidatorService);

  private _selectedFiles = signal<File[]>([]);
  public readonly selectedFiles = this._selectedFiles.asReadonly();
  
  private fileInput: HTMLInputElement;
  private fileInputChangeListener: ((this: HTMLInputElement, ev: Event) => any) | null = null;


  constructor() {
    // Init file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.multiple = true;
    this.fileInput.style.display = 'none';
    this.fileInputChangeListener = (e) => this.onFileInputChange(e);
    this.fileInput.addEventListener('change', this.fileInputChangeListener);
    document.body.appendChild(this.fileInput);
  }

  public reset() {
    this._selectedFiles.set([]);
  }

  public openSelectionPrompt() {
    this.fileInput.value = '';  // Clear previous selection to avoid problems
    this.fileInput.click();
  }

  public handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    console.log("pasted items: ", items);

    if (!items)
      return;

    const files: File[] = [];

    for (const item of Array.from(items)) {
      if (item.kind !== 'file')
        continue;

      const file = item.getAsFile();
      if (file)
        files.push(file);
    }

    if (files.length)
      this.addFiles(files);
  }

  public handleDrop(event: DragEvent) {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (!files.length)
      return;
    this.addFiles(files);
  }

  private onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length == 0)
      return;

    let files = Array.from(input.files);
    this.addFiles(files);
  }

  private addFiles(files: File[]): void {
    const currentFiles = this._selectedFiles();
    const uniqueNewFiles = files.filter(file => !currentFiles.some(file2 => this.isSameFile(file, file2)));
    const validNewFiles = this.filesValidator.validateAndFilterSingleMessageFiles(uniqueNewFiles);
    this._selectedFiles.set([...currentFiles, ...validNewFiles]);
  }

  private isSameFile(file1: File, file2: File): boolean {
    return file1.name === file2.name && file1.size === file2.size;
  }
}