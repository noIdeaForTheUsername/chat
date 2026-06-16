import { Component, HostListener, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '@src/app/alerts/alert-service/alert.service';
import { AlertType } from '@src/app/alerts/alert-type.enum';
import { MessageService } from '@src/app/messages/message-service/message.service';

@Component({
  selector: 'app-closing-prevention',
  template: ""
})
export class ClosingPreventionComponent {

  private readonly messageService = inject(MessageService);
  private alertService = inject(AlertService);
  private translate = inject(TranslateService);
  private fileUploadInProgress = false;
  

  ngOnInit() {
    this.messageService.uploadProgress.subscribe(progress => {
      this.fileUploadInProgress = progress > 0 && progress < 100;
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
  if (this.fileUploadInProgress) {
    event.preventDefault();
    this.alertService.displayMessageAlert(
      AlertType.ERROR,
      this.translate.instant('error.file-upload-in-progress.description'), undefined,
      this.translate.instant('error.file-upload-in-progress.header')
    );
    event.returnValue = '';
  }
}

}
