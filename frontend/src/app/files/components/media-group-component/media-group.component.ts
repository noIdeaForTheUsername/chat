import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, OnInit, ViewChild } from '@angular/core';
import { FileInfo } from '../../file-types';
import { MediaDimensionsCalculator } from '../../services/loading-and-displaying/media-dimensions-calculator';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-media-group',
  templateUrl: './media-group.component.html',
  styleUrls: ['./media-group.component.scss'],
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGroupComponent implements AfterViewInit {

  private mediaDimensionsCalculator = inject(MediaDimensionsCalculator);
  private readonly previewsNumber = 3;

  media = input.required<FileInfo[]>();

  protected previews = computed(() => {
    const filtered = this.media().filter(this.isMedia);
    if (filtered.length < this.previewsNumber)
      throw new Error(`media group must contain at least ${this.previewsNumber} media items`);
    const sliced = filtered.slice(0, this.previewsNumber);
    return sliced;
  });
  protected mediaNumber = computed(() => this.media().filter(this.isMedia).length);
  protected size = computed(() => 
    Math.min(
      this.mediaDimensionsCalculator.maxMediaWidth(), 
      this.mediaDimensionsCalculator.maxMediaHeight()
    )
  );
  @ViewChild("container") container?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const _ = this.size();
      this.updateContainerDimensions();
    })
  }

  ngAfterViewInit() {
    this.updateContainerDimensions();
  }

  private updateContainerDimensions() {
    if (!this.container)
        return;
    this.container.nativeElement.style.width = `${this.size()}px`;
    this.container.nativeElement.style.height = `${this.size()}px`;
  }

  private isMedia(file: FileInfo) {
    return file.type === 'image' || file.type === 'video';
  }
}
