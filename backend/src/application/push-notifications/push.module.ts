import { Module } from "@nestjs/common";
import { PushService } from "./services/push.service";
import { PushController } from "./push.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionEntity } from "src/domain/session/entity/session.entity";
import { WebPushService } from "./services/web-push.service";
import { FcmService } from "./services/fcm.service";

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [PushService, WebPushService, FcmService],
  controllers: [PushController],
  exports: [PushService]
})
export class PushModule {}