import { Injectable, signal } from "@angular/core";
import { BaseFileInfo, FileInfo } from "../../file-types";

@Injectable({
  providedIn: "root" 
})
export class MediaDimensionsCalculator {

  private readonly MAX_MEDIA_PX_HEIGHT = 400;
  private readonly MAX_MEDIA_VH_HEIGHT = 0.4;
  private readonly MAX_MEDIA_VH_WIDTH = 0.7;

  private _maxMediaWidth: number = 0;
  public readonly maxMediaWidth = signal<number>(0);
  private _maxMediaHeight: number = 0;
  public readonly maxMediaHeight = signal<number>(0);

  constructor() {
    this.computeMaxMediaHeight();
    this.computeMaxMediaWidth();
    window.addEventListener('resize', this.computeMaxMediaWidth.bind(this));
    window.addEventListener('resize', this.computeMaxMediaHeight.bind(this));
  }

  private computeMaxMediaHeight() {
    this._maxMediaHeight = Math.round(Math.min(
      this.MAX_MEDIA_PX_HEIGHT, 
      this.MAX_MEDIA_VH_HEIGHT * window.innerHeight
    ));
    this.maxMediaHeight.set(this._maxMediaHeight);
  }

  private computeMaxMediaWidth() {
    this._maxMediaWidth = Math.round(this.MAX_MEDIA_VH_WIDTH * window.innerWidth);
    this.maxMediaWidth.set(this._maxMediaWidth);
  }

  public getFilePreviewDimensions(file: BaseFileInfo | FileInfo): { width: number, height: number } {
    if (!file.mediaWidth || !file.mediaHeight) {
      throw new Error("Missing file dimensions for file with UUID: " + file.uuid);
    }
    const ratio = file.mediaWidth / file.mediaHeight;
    let dimensions = { width: file.mediaWidth, height: file.mediaHeight };

    if (dimensions.width > this._maxMediaWidth) {
      dimensions = {
        width: this._maxMediaWidth,
        height: Math.round(this._maxMediaWidth / ratio)
      };
    }
    if (dimensions.height > this._maxMediaHeight) {
      dimensions = {
        width: Math.round(this._maxMediaHeight * ratio),
        height: this._maxMediaHeight
      };
    }
    return dimensions;
  }
}
