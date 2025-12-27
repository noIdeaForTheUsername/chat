import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserContact } from './entities/user-contact.entity';
import { Like, Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { FullProfile } from './entities/full-profile.entity';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Contact)
    private contacts: Repository<Contact>,
    @InjectRepository(UserContact)
    private userKnownProfiles: Repository<UserContact>,
    @InjectRepository(Profile)
    private profiles: Repository<Profile>,
    @InjectRepository(FullProfile)
    private fullProfiles: Repository<FullProfile>
  ) {}

  // GETTING DATA

  async getUserKnownProfiles(userId: number) {
    return await this.userKnownProfiles.findBy({ contactOwnerId: userId });
  }

  async getFullPublicProfile(id: number, exceptionOnNotFound = false) {
    const profile = await this.fullProfiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException(`Profile not found`);
    return profile;
  }

  async getRawProfile(id: number, exceptionOnNotFound = false) {
    const profile = await this.profiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException(`Profile not found`);
    return profile;
  }

  async searchProfiles(search: string) {
    const likeExp = Like(`%${search}%`);
    return await this.fullProfiles.find({
      where: [
        { login: likeExp },
        { name: likeExp },
        { email: likeExp },
        { phoneNumber: likeExp },
      ]
    });
  }

  // UPDATING DATA

  // TODO: TESTING
  async updateProfile(id: number, updatedFieldsObject: PatchProfileDto) {
    const result = await this.profiles.update({ id }, updatedFieldsObject);
    console.log("genMaps: ", result.generatedMaps);
    console.log("raw: ", result.raw);
    return result;
  }

  async setProfileBlockedStatus(callerId: number, blockedId: number, blockedValue: boolean) {
    await this.contacts.update(
      { ownerId: callerId, participantId: blockedId },
      { blocked: blockedValue }
    );
  }

  async setContactNick(callerId: number, userId: number, nick: string) {
    await this.contacts.update(
      { ownerId: callerId, participantId: userId },
      { nick: nick }
    );
  }
}
