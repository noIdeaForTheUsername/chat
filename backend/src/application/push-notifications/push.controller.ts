import { Body, Controller, Post, Session } from "@nestjs/common";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";

@Controller("notifications")
export class PushController {

  @Post("subscription")
  public async postSubscription(@Session() session: Record<string, any>, @Body() body: PushSubscriptionDto) {
    session.pushSubscription = body;
  }
}