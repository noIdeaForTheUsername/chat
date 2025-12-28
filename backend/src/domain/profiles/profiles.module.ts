import { Module } from '@nestjs/common';
import { ProfilesDomainService } from './profiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserContact } from './entities/user-contact.entity';
import { Profile } from './entities/profile.entity';
import { FullProfile } from './entities/full-profile.entity';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserContact, Profile, FullProfile, Contact])],
  providers: [ProfilesDomainService],
  exports: [ProfilesDomainService],
})
export class ProfilesDomainModule {}
