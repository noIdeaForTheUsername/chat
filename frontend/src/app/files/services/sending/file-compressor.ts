import { inject, Injectable, signal } from "@angular/core";import { isIOS } from "@src/app/shared/platform-detection/platformUtils";
import imageCompression, { Options } from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class FileCompressorService {

  private readonly compressedExtension = "webp";
  private readonly compressionOptions: Options = {
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: `image/${this.compressedExtension}`,
    initialQuality: 0.85,
  };

  public enableCompression = signal(true);

  public async compressEligibleFiles(files: File[]) {
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
    
    output.push(...(await this.tryCompressFiles(filesToCompress)));
    return output; 
  }

  private async tryCompressFiles(compressableFiles: File[]): Promise<File[]> {
    let output: File[] = [];
    // IOS compression:
    if (isIOS() && compressableFiles.length > 0) {  // on IOS (even in chrome) compression often doesn't work at all
      try {
        let firstCompression = this.compressImage(compressableFiles[0]);
        output.push(await firstCompression);
        compressableFiles.shift();
      }
      catch (err) {
        console.error(err);
        return compressableFiles;  // if the first compression fails on IOS, don't try anymore and return original files
      }
    }
    // Standard path:
    let compressionPromises = compressableFiles.map(file => this.tryCompressImage(file));
    output.push(...(await Promise.all(compressionPromises)));
    return output;
  }

  public getFileTypeEligibleForCompression(file: File): boolean {
    return file.type.startsWith("image/") && !file.type.includes("gif") && !file.type.includes("svg");
  }

  private async tryCompressImage(file: File): Promise<File> {
    try {
      return await this.compressImage(file);
    }
    catch (error) {
      console.error(error);
      return file;
    }
  }

  private async compressImage(file: File) {
    if (!file.type.startsWith("image/"))
      throw new Error("File to compress is not an image.");
    
    let fileName = this.getExtensionlessFileName(file);
    let compressedFile = await imageCompression(file, this.compressionOptions);
    return new File([compressedFile], `${fileName}.${this.compressedExtension}`,  // name preservation
      { type: compressedFile.type, lastModified: file.lastModified });
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