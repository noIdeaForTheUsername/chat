import { Body, Controller, Post, Put, Session } from "@nestjs/common";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";
import { AllowInactiveAccount } from "src/shared/auth/decorators/allow-inactive-account";

@Controller("notifications")
@AllowInactiveAccount(true)
export class PushController {

  @Put("subscription")
  public async putSubscription(@Session() session: Record<string, any>, @Body() body: PushSubscriptionDto) {
    session.pushSubscription = body.subscription;
    session.language = body.language;
  }
}