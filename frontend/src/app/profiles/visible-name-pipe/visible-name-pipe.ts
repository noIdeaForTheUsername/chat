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

  // private getVisibleNameOfProfile(value: Profile, alwaysIncludeUserLogin: boolean) {
  //   if (value.type == 'user') {
  //     let toReturn = "";
  //     if (value.userNick) toReturn = value.userNick;
  //     else if (value.name) toReturn = value.name;

  //     if (toReturn.length > 0) {
  //       if (alwaysIncludeUserLogin) toReturn += ` (@${value.login})`;
  //       return toReturn;
  //     }
  //     else return '@' + value.login;
  //   }
  //   else {
  //     if (value.userNick) return value.userNick;
  //     else return value.name;
  //   }
  // }

  // constructor(private profileService: ProfileService) {}
}
