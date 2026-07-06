import { inject, Injectable, signal } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import { FilesValidatorService } from "./file-validator";
import { GalleryMediaPickerService } from "./gallery-media-picker";
import { ActionSheetController } from "@ionic/angular/standalone";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: 'root',
})
export class FilesSelectionService {

  private filesValidator = inject(FilesValidatorService);
  private translate = inject(TranslateService);
  private galleryMediaPicker = inject(GalleryMediaPickerService);

  private _selectedFiles = signal<File[]>([]);
  public readonly selectedFiles = this._selectedFiles.asReadonly();
  
  private fileInput: HTMLInputElement;
  private fileInputChangeListener: ((this: HTMLInputElement, ev: Event) => any) | null = null;


  constructor(private actionSheetCtrl: ActionSheetController) {
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
  public removeFiles(filesToRemove: File[]) {
    const currentFiles = this._selectedFiles();
    const remainingFiles = currentFiles.filter(file => !filesToRemove.some(file2 => this.isSameFile(file, file2)));
    this._selectedFiles.set(remainingFiles);
  }
  
  public replaceAllFilesWithoutValidation(newFiles: File[]) {
    this._selectedFiles.set(newFiles);
  }

  public handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
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

  public async openSelectionPrompt() {
    if (Capacitor.getPlatform() == "android") {
      await this.promptForAndroidFileSourceSelection();
    }
    else
      this.openBrowserFileInput();
  }

  

  private openBrowserFileInput() {
    this.fileInput.value = '';  // Clear previous selection to avoid problems
    this.fileInput.click();
  }

  private async openAndroidGalleryPicker() {
    const files = await this.galleryMediaPicker.prompt(
      FilesValidatorService.MAX_FILES_PER_MESSAGE - this._selectedFiles().length);
    if (files.length) {
      this.addFiles(files);
    }
  }

  private async promptForAndroidFileSourceSelection() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant("page.chat.select-file-source.header"),
      buttons: [
        {
          text: this.translate.instant("page.chat.select-file-source.gallery"),
          icon: 'images',
          handler: () => this.openAndroidGalleryPicker()
        },
        {
          text: this.translate.instant("page.chat.select-file-source.all-files"),
          icon: 'folder-open',
          handler: () => this.openBrowserFileInput()
        },
        {
          text: this.translate.instant("common.cancel"),
          icon: 'close',
          role: 'cancel',
          cssClass: "bold-text"
        }
      ]
    });
    await actionSheet.present();
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
    const validNewFiles = this.filesValidator.validateSelectedMessageFiles(uniqueNewFiles);
    this._selectedFiles.set([...currentFiles, ...validNewFiles]);
  }

  private isSameFile(file1: File, file2: File): boolean {
    return file1.name === file2.name && file1.size === file2.size;
  }
}