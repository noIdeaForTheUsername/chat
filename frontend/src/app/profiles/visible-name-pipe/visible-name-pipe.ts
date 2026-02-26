import { Pipe, PipeTransform } from '@angular/core';
import { OwnProfile, Profile } from '@app/profiles/profile.interface';
import { getVisibleName } from '../profile-utils';
// import { ProfileService } from '@app/profiles/profile-service/profile.service';

@Pipe({
  name: 'visibleName'
})
export class VisibleNamePipe implements PipeTransform {

  transform(value: Profile | OwnProfile | undefined, alwaysIncludeUserLogin: boolean = false): string {
    return getVisibleName(value, alwaysIncludeUserLogin);
  }
}
