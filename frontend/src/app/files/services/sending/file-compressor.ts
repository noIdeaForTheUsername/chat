import { Injectable, signal } from "@angular/core";
import imageCompression, { Options } from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class FileCompressorService {

  private readonly compressionOptions: Options = {
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  };

  public enableCompression = signal(true);

  public async compressFilesIfPossible(files: File[]) {
    if (!this.enableCompression())
      return files;

    let filesToCompress: File[] = [];
    let output: File[] = [];
    for (const file of files) {
      if (this.getFileTypeEligibleForCompression(file))
        filesToCompress.push(file);
      else
        output.push(file);
    }

    let compressionPromises = filesToCompress.map(file => this.compressImage(file));
    output.push(...(await Promise.all(compressionPromises)));
    return output; 
  }

  private getFileTypeEligibleForCompression(file: File): boolean {
    return file.type.startsWith("image/") && !file.type.includes("gif") && !file.type.includes("svg");
  }

  private async compressImage(file: File) {
    if (!file.type.startsWith("image/"))
      throw new Error("File to compress is not an image.");
    
    let fileName = this.getExtensionlessFileName(file);
    const compressedBlob = await imageCompression(file, this.compressionOptions);
    return new File([compressedBlob], fileName + ".webp",  // name preservation
      { type: compressedBlob.type, lastModified: file.lastModified });
  }

  private getExtensionlessFileName(file: File): string {
    let fileName = file.name;
    let lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      fileName = fileName.substring(0, lastDotIndex);
    }
    return fileName;
  }
}