import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsDomainService {
  constructor(
    @InjectRepository(Contact)
    private contacts: Repository<Contact>,
  ) {}

  async createContact(ownerId: number, participantId: number): Promise<Contact> {
    const contact = this.contacts.create({ ownerId, participantId });
    return await this.contacts.save(contact);
  }
  
  async updateContact(ownerId: number, participantId: number, newValues: Partial<Contact>): Promise<void> {
    const result = await this.contacts.update(
      { ownerId, participantId },
      newValues,
    );
    if (result.affected === 0) throw new NotFoundException('Contact not found');
  }
}
