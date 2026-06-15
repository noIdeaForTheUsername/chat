import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ProfilesDomainService } from 'src/domain/profiles/profiles.service';
import { UserId } from 'src/shared/auth/decorators/user-id.decorator';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { ContactsDomainService } from 'src/domain/contacts/contacts.service';
import { Throttle } from '@nestjs/throttler';
import { SENSITIVE_RATE_LIMIT } from 'src/shared/global-rate-limiting/rate-limiting-settings';
import { ActionsThrottlerService } from 'src/application/shared/actions-rate-limiting/actions-throttler.service';
import { RateLimitedAction } from 'src/application/shared/actions-rate-limiting/rate-limited-action.interface';

// This controller doesn't have a helper service and calls the domain services directly

@Controller('profiles')
export class ProfilesController {

  constructor(
    private readonly profilesService: ProfilesDomainService,
    private readonly contactsService: ContactsDomainService,
    private readonly actionsThrottler: ActionsThrottlerService
  ) {}

  // Many profiles

  @Get()
  async getUserKnownProfiles(@UserId() userId: number) {
    return await this.profilesService.findUserKnownProfiles(userId);
  }

  @Get('search')
  @Throttle(SENSITIVE_RATE_LIMIT)  // sensitive endpoint because it can be used to "brute-force" existing users
  async searchProfiles(@Query('q') search: string, @UserId() callerId: number) {

    // extra per-userId rate limiting
    this.actionsThrottler.incrementAndThrow(USER_DISCOVERY_LIMIT, callerId.toString());
    
    // basic search query validation
    if (typeof search !== 'string')
      throw new BadRequestException('search-empty');
    if (search.length > 100)
      throw new BadRequestException('search-too-long');
    
    search = search.trim();
    if (!search || search.length === 0) {
      throw new BadRequestException('search-empty');
    }

    return await this.profilesService.findSearchedProfiles(search);
  }

  // My profile

  @Get('me')
  async getMyProfile(@UserId() userId: number) {
    return await this.profilesService.findFullProfile(userId, true);
  }

  @Patch('me')
  async updateMyProfile(@UserId() userId: number, @Body() dto: PatchProfileDto) {
    await this.profilesService.updateProfile(userId, dto);
    return await this.profilesService.findFullProfile(userId, true);
  }

  // By ID (contact, or contact + profile)

  @Get(':id')
  async getProfileById(@UserId() callerId: number, @Param('id', ParseIntPipe) id: number) {
    if (callerId === id) {  // when user asks for their own profile using this endpoint instead of "me"
      return await this.profilesService.findFullProfile(id, true);
    }
    return await this.profilesService.findUserKnownProfile(callerId, id, true);
  }

  @Patch(':id/nick')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setContactNick(
    @UserId() callerId: number,
    @Param('id', ParseIntPipe) userId: number,
    @Body('nick') nick: string,
  ) {
    if (typeof nick !== 'string') throw new BadRequestException('nick must be a string');
    if (nick.length > 60) throw new BadRequestException('nick too long');
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

const USER_DISCOVERY_LIMIT: RateLimitedAction = {  
  name: 'USER_DISCOVERY',
  limit: 50,
  ttl: 24 * 3600 * 1000,
  logExceeded: true,
}
