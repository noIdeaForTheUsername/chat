import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserContact } from './entities/user-contact.entity';
import { Profile } from './entities/profile.entity';
import { FullProfile } from './entities/full-profile.entity';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserContact, Profile, FullProfile, Contact])],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
