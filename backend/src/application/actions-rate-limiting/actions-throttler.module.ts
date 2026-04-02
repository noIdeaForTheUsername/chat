import { Module } from "@nestjs/common";
import { ActionsThrottlerService } from "./actions-throttler.service";

@Module({
  providers: [ActionsThrottlerService],
  exports: [ActionsThrottlerService],
})
export class ActionsThrottlerModule {}