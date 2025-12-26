import { BadRequestException, Body, Controller, Get, Param, ParseBoolPipe, Patch } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UserId } from 'src/accounts/verification/user-id.decorator';
import { PatchProfileDto } from './dto/patch-profile.dto';


@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async getUserKnownProfiles(@UserId() userId: number) {
    return await this.profilesService.getUserKnownProfiles(userId);
  }

  @Get(":id")
  async getProfileById(@Param("id") id: number) {
    return await this.profilesService.getProfile(id, true);
  }

  @Get('me')
  async getMyProfile(@UserId() userId: number) {
    return await this.profilesService.getProfile(userId, true);
  }

  @Patch("me")
  async updateMyProfile(@UserId() userId: number, @Body() dto: PatchProfileDto) {
    return await this.profilesService.updateProfile(userId, dto);
  }

  @Get("search")
  async searchProfiles(@Body("search") search: string) {
    if (typeof search !== "string" || search.length === 0)
      throw new BadRequestException("search must be a non-empty string");
    return await this.profilesService.searchProfiles(search);
  }

  @Patch(":id/blocked")
  async setContactBlockedStatus(
    @UserId() callerId: number,
    @Param("id") blockedId: number,
    @Body("blocked", ParseBoolPipe) blockedValue: boolean,
  ) {
    return await this.profilesService.setProfileBlockedStatus(callerId, blockedId, blockedValue);
  }

  @Patch(":id/nick")
  async setContactNick(
    @UserId() callerId: number,
    @Param("id") userId: number,
    @Body("nick") nick: string,
  ) {
    return await this.profilesService.setContactNick(callerId, userId, nick);
  }
}
