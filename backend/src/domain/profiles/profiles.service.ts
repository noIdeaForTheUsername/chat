import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserContact } from './entities/user-contact.entity';
import { Like, Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { PatchProfileDto } from '../../application/users/profiles/dto/patch-profile.dto';
import { FullProfile } from './entities/full-profile.entity';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ProfilesDomainService {
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

  async findUserKnownProfiles(userId: number) {
    return await this.userKnownProfiles.findBy({ contactOwnerId: userId });
  }

  async findFullPublicProfiles(id: number, exceptionOnNotFound = false) {
    const profile = await this.fullProfiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('Profile not found');
    return profile;
  }

  async findRawProfiles(id: number, exceptionOnNotFound = false) {
    const profile = await this.profiles.findOneBy( { id } );
    if (!profile && exceptionOnNotFound)
      throw new NotFoundException('Profile not found');
    return profile;
  }

  async findSearchedProfiles(search: string) {
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

  // CREATING DATA

  async createProfile(accountId: number, phoneNumberPublic: boolean, emailPublic: boolean,
    name?: string, bio?: string
  ) {
    const profile = this.profiles.create({
      id: accountId,
      phoneNumberPublic,
      emailPublic,
      name,
      bio
    });
    return await this.profiles.save(profile);
  }

  // UPDATING DATA

  async updateProfile(id: number, updatedFieldsObject: PatchProfileDto) {
    const result = await this.profiles.update({ id }, updatedFieldsObject);
    if (result.affected === 0) throw new NotFoundException('Profile not found');
    console.log('genMaps: ', result.generatedMaps);
    console.log('raw: ', result.raw);
    return result;
  }

  async setContactBlockedStatus(callerId: number, blockedId: number, blockedValue: boolean) {
    const result = await this.contacts.update(
      { ownerId: callerId, participantId: blockedId },
      { blocked: blockedValue }
    );
    if (result.affected === 0) throw new NotFoundException('Profile not found');
  }

  async setContactNick(callerId: number, profileId: number, nick: string) {
    const result = await this.contacts.update(
      { ownerId: callerId, participantId: profileId },
      { nick: nick }
    );
    if (result.affected === 0) throw new NotFoundException('Profile not found');
  }
}
