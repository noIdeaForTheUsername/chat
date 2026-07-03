import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { StandardHeaderComponent } from "@src/app/shared/headers/standard-header-component/standard-header.component";
import { LanguageButtonComponent } from "@src/app/i18n/language-button/language-button.component";
import { TranslatePipe } from '@ngx-translate/core';
import { isIOS, isAndroid } from '@src/app/shared/platform-detection/platformUtils';
import { RouterLink } from '@angular/router';
import { MediaViewerComponent } from "@src/app/files/components/media-viewer-component/media-viewer.component";
import { MediaViewerService } from '@src/app/files/services/loading-and-displaying/media-viewer.service';
import { FileInfo } from '@src/app/files/file-types';

@Component({
  selector: 'app-guide',
  templateUrl: './pwa-guide.page.html',
  styleUrls: ['./pwa-guide.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, StandardHeaderComponent, LanguageButtonComponent, IonButtons, TranslatePipe, IonIcon, RouterLink, MediaViewerComponent]
})
export class GuidePage implements OnInit {

  protected isIos = signal(false);
  protected isAndroid = signal(false);
  private mediaViewer = inject(MediaViewerService);

  ngOnInit() {
    this.isIos.set(isIOS());
    this.isAndroid.set(isAndroid());
  }

  private readonly guideImage: FileInfo = {
    uuid: "guide",
    messageId: 0,
    uploadedAt: new Date(),
    originalName: "installation-guide.webp",
    type: "image",
    sizeInBytes: 10000,
    mediaWidth: null,
    mediaHeight: null,
    url: isIOS() ? "assets/ios-installation-guide.webp" : "assets/installation-guide.webp"
  };

  openGuideViewer() {
    this.mediaViewer.open([this.guideImage], undefined, false);
  }

}
