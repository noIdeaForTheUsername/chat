import { Module } from '@nestjs/common';
import { StringsService } from './strings.service';
import { LoggingModule } from 'src/shared/logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [StringsService],
  exports: [StringsService],
})
export class StringsModule {}
