import { Module } from '@nestjs/common';
import { ContactsDomainService } from './contacts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  providers: [ContactsDomainService],
  exports: [ContactsDomainService]
})
export class ContactsDomainModule {}
