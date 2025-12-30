import { Module } from '@nestjs/common';
import { ProfilesDomainService } from './profiles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserKnownProfile } from './entities/user-known-profile.entity';
import { Profile } from './entities/profile.entity';
import { FullProfile } from './entities/full-profile.entity';


@Module({
  imports: [TypeOrmModule.forFeature([UserKnownProfile, Profile, FullProfile])],
  providers: [ProfilesDomainService],
  exports: [ProfilesDomainService],
})
export class ProfilesDomainModule {}
