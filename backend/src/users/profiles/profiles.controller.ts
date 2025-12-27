import { BadRequestException, Body, Controller, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UserId } from '../../shared/auth/user-id.decorator';
import { PatchProfileDto } from './dto/patch-profile.dto';


@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async getUserKnownProfiles(@UserId() userId: number) {
    return await this.profilesService.getUserKnownProfiles(userId);
  }

  @Get('me')
  async getMyProfile(@UserId() userId: number) {
    return await this.profilesService.getRawProfile(userId, true);
  }

  @Patch("me")
  async updateMyProfile(@UserId() userId: number, @Body() dto: PatchProfileDto) {
    return await this.profilesService.updateProfile(userId, dto);
  }

  @Get("search")
  async searchProfiles(@Query("search") search: string) {
    if (typeof search !== "string" || search.length === 0)
      throw new BadRequestException("search must be a non-empty string");
    return await this.profilesService.searchProfiles(search);
  }

  @Patch(":id/blocked")
  async setContactBlockedStatus(
    @UserId() callerId: number,
    @Param("id", ParseIntPipe) blockedId: number,
    @Body("blocked", ParseBoolPipe) blockedValue: boolean,
  ) {
    return await this.profilesService.setProfileBlockedStatus(callerId, blockedId, blockedValue);
  }

  @Patch(":id/nick")
  async setContactNick(
    @UserId() callerId: number,
    @Param("id", ParseIntPipe) userId: number,
    @Body("nick") nick: string,
  ) {
    return await this.profilesService.setContactNick(callerId, userId, nick);
  }

  @Get(":id")
  async getProfileById(@Param("id") id: number) {
    return await this.profilesService.getFullPublicProfile(id, true);
  }
}
