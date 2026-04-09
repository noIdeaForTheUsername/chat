import { Module } from "@nestjs/common";
import { ActionsThrottlerService } from "./actions-throttler.service";
import { LoggingModule } from "src/shared/logging/logging.module";

@Module({
  imports: [LoggingModule],
  providers: [ActionsThrottlerService],
  exports: [ActionsThrottlerService],
})
export class ActionsThrottlerModule {}