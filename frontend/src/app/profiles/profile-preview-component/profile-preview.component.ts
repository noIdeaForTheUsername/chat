import { ChangeDetectionStrategy, Component, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '@app/profiles/profile-service/profile.service';
import { IonAvatar, IonButton, IonModal } from "@ionic/angular/standalone";
import { TranslatePipe } from "@ngx-translate/core";
import { VisibleNamePipe } from '@app/profiles/visible-name-pipe/visible-name-pipe';
import { AnyProfile } from '../profile.interface';


@Component({
  selector: 'app-profile-preview',
  templateUrl: './profile-preview.component.html',
  styleUrls: ['./profile-preview.component.scss'],
  imports: [IonAvatar, IonButton, TranslatePipe, VisibleNamePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class ProfilePreviewComponent {

  profile = input.required<AnyProfile | undefined>();
  viewProfileButton = input(false);
}
