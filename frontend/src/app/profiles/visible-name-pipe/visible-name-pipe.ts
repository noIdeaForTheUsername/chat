import { Pipe, PipeTransform } from '@angular/core';
import { Profile } from '@app/profiles/profile.interface';
import { getVisibleName } from '../profile-utils';
// import { ProfileService } from '@app/profiles/profile-service/profile.service';

@Pipe({
  name: 'visibleName'
})
export class VisibleNamePipe implements PipeTransform {

  transform(value: Profile | undefined, alwaysIncludeUserLogin: boolean = false): string {
    return getVisibleName(value, alwaysIncludeUserLogin);
  }
}
