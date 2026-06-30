import { Module } from "@nestjs/common";
import { PushService } from "./services/push.service";
import { PushController } from "./push.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { WebPushService } from "./services/web-push.service";
import { FcmService } from "./services/fcm.service";
import { SessionsModule } from "src/domain/session/sessions.module";
import { LoggingModule } from "src/shared/logging/logging.module";
import { StringsModule } from "../shared/strings/strings.module";

@Module({
  imports: [SessionsModule, LoggingModule, StringsModule],
  providers: [PushService, WebPushService, FcmService],
  controllers: [PushController],
  exports: [PushService]
})
export class PushModule {}