import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ProfilesDomainService } from 'src/domain/profiles/profiles.service';
import { UserId } from 'src/shared/auth/user-id.decorator';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { ContactsDomainService } from 'src/domain/contacts/contacts.service';

// This controller doesn't have a helper service and calls the domain service directly

@Controller('profiles')
export class ProfilesController {

  constructor(
    private readonly profilesService: ProfilesDomainService,
    private readonly contactsService: ContactsDomainService,
  ) {}

  // Many profiles

  @Get()
  async getUserKnownProfiles(@UserId() userId: number) {
    return await this.profilesService.findUserKnownProfiles(userId);
  }

  @Get('search')
  async searchProfiles(@Query('q') search: string) {
    if (typeof search !== 'string' || search.length === 0)
      throw new BadRequestException('search-empty');
    return await this.profilesService.findSearchedProfiles(search);
  }

  // My profile

  @Get('me')
  async getMyProfile(@UserId() userId: number) {
    return await this.profilesService.findRawProfile(userId, true);
  }

  @Patch('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateMyProfile(@UserId() userId: number, @Body() dto: Partial<PatchProfileDto>) {
    return await this.profilesService.updateProfile(userId, dto);
  }

  // By ID (contact, or contact + profile)

  @Get(':id')
  async getProfileById(@Param('id', ParseIntPipe) id: number) {
    return await this.profilesService.findFullPublicProfile(id, true);
  }

  @Patch(':id/nick')
  async setContactNick(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body('nick') nick: string,
  ) {
    if (typeof nick !== 'string') throw new BadRequestException('nick must be a string');
    return await this.contactsService.updateContact(callerId, userId, { nick });
  }

  @Post(':id/block')
  async blockContact(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) blockedId: number,
  ) {
    return await this.contactsService.updateContact(callerId, blockedId, { blocked: true });
  }

  @Post(':id/unblock')
  async unblockContact(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) blockedId: number,
  ) {
    return await this.contactsService.updateContact(callerId, blockedId, { blocked: false });
  }
}
