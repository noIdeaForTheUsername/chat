import { inject, Injectable } from "@angular/core";
import { Camera, MediaResult, MediaType, MediaTypeSelection } from "@capacitor/camera";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "@src/app/alerts/alert-service/alert.service";
import { AlertType } from "@src/app/alerts/alert-type.enum";

@Injectable({
  providedIn: 'root'
})
export class GalleryMediaPickerService {

  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  
  public async prompt(limit: number): Promise<File[]> {
    const { results: galleryResults } = await Camera.chooseFromGallery({
      mediaType: MediaTypeSelection.All,
      allowMultipleSelection: true,
      limit: limit,
      includeMetadata: true,
    });
    let files: File[] = [];
    if (galleryResults.length)
      files = await this.galleryResultsToFiles(galleryResults);
    return files;
  }

  private async galleryResultsToFiles(results: MediaResult[]): Promise<File[]> {
    let promises = results.map((mediaItem, index) => this.galleryMediaToFile(mediaItem, index));
    const promiseResults = await Promise.allSettled(promises);
    let successfulFiles: File[] = [];
    for (const result of promiseResults) {
      if (result.status === 'fulfilled')
        successfulFiles.push(result.value)
      else
        console.error('Error converting media to file: ' + result.reason);
    }
    if (successfulFiles.length < promiseResults.length) {
      this.alertService.displayMessageAlert(
        AlertType.ERROR,
        this.translate.instant("error.gallery-conversion-failed", { count: promiseResults.length - successfulFiles.length })
      );
    }
    return successfulFiles;
  }

  private async galleryMediaToFile(media: MediaResult, index?: number): Promise<File> {
    if (!media.webPath)
      throw new Error('No media.webPath');

    const response = await fetch(media.webPath);
    const blob = await response.blob();

    const extension = media.metadata?.format ?? blob.type.split('/')[1] ?? 'bin';
    const fileName =
      `${media.type === MediaType.Photo ? 'image' : 'video'}-${Date.now()}-${index ?? ''}.${extension}`;
    const creationDate = new Date(media.metadata?.creationDate ?? Date.now()).getTime();

    return new File(
      [blob],
      fileName,
      {
        type: blob.type,
        lastModified: creationDate
      }
    );
  }
}