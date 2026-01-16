import { Module } from "@nestjs/common";
import { PushService } from "./push.service";
import { PushController } from "./push.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeviceSessionEntity } from "src/domain/session/entity/device-session.entity";

@Module({
  imports: [TypeOrmModule.forFeature([DeviceSessionEntity])],
  providers: [PushService],
  controllers: [PushController],
  exports: [PushService]
})
export class PushModule {}