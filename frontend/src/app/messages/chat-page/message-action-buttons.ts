import { TranslateService } from "@ngx-translate/core";

export class MessageActionButtons {

  constructor(private translate: TranslateService) {}

  public notOwnMessage = [ // APPLIES ALSO TO OWN MESSAGE; Displayed after holding other user's message
    {
      text: this.translate.instant("page.chat.message-action.reply"),
      icon: "arrow-redo",
      data: "reply"
    },
    {
      text: this.translate.instant("common.copy-text"),
      icon: "copy",
      data: "copy"
    },
    {
      text: this.translate.instant("common.enter-selection"),
      icon: "checkbox-outline",
      data: "selection-mode"
    },
    {
      text: this.translate.instant("common.cancel"),
      // icon: "close-circle",
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];
  public ownMessage = [  // Displayed after holding own message
    {
      text: this.translate.instant("common.delete"),
      icon: "trash",
      role: "destructive",
      cssClass: "danger-text",
      data: "delete"
    },
    ...this.notOwnMessage
  ];
  public multiselect = [  // Displayed after selecting multiple messages and clicking actions
    {
      text: this.translate.instant("page.chat.message-action.delete-all"),
      icon: "trash",
      role: "destructive",
      cssClass: "danger-text",
      data: "delete"
    },
    {
      text: this.translate.instant("page.chat.message-action.download-all"),
      icon: "download",
      data: "download"
    },
    {
      text: this.translate.instant("common.exit-selection"),
      icon: "checkbox-outline",
      data: "selection-mode"
    },
    {
      text: this.translate.instant("common.cancel"),
      // icon: "close-circle",
      role: 'cancel',
      cssClass: "bold-text"
    },
  ];
}

