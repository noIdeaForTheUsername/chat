import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chat-note',
  templateUrl: './chat-note.component.html',
  styleUrls: ['./chat-note.component.scss'],
})
export class ChatNoteComponent {

  text = input("");
  line = input(false);

}
