import { Injectable, signal } from "@angular/core";
import { BaseFileInfo, FileInfo } from "./file-types";

@Injectable({
  providedIn: "root"
})
export class MediaHeightCalculator {

  private readonly MAX_MEDIA_PX_HEIGHT = 400;
  private readonly MAX_MEDIA_VH_HEIGHT = 0.4;
  private windowResizeListener = this.computeMaxMediaHeight.bind(this);

  private _maxMediaHeight: number = 0;
  public readonly maxMediaHeight = signal<number>(0);

  constructor() {
    this.computeMaxMediaHeight();
    window.addEventListener('resize', this.windowResizeListener);
  }

  private computeMaxMediaHeight() {
    this._maxMediaHeight = Math.min(this.MAX_MEDIA_PX_HEIGHT, this.MAX_MEDIA_VH_HEIGHT * window.innerHeight);
    this.maxMediaHeight.set(this._maxMediaHeight);
  }

  public getFilePreviewDimensions(file: BaseFileInfo | FileInfo): { width: number, height: number } {
    if (!file.mediaWidth || !file.mediaHeight) {
      throw new Error("Missing file dimensions for file with UUID: " + file.uuid);
    }

    const ratio = file.mediaWidth / file.mediaHeight;
    const computedHeight = Math.min(file.mediaHeight, this._maxMediaHeight);
    const computedWidth = computedHeight * ratio;

    return { width: computedWidth, height: computedHeight };
  }
}
