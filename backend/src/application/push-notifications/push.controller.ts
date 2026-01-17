import { Body, Controller, Post, Session } from "@nestjs/common";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";

@Controller("notifications")
export class PushController {

  @Post("subscribe")
  public async postSubscription(@Session() session: Record<string, any>, @Body() body: PushSubscription) {
    session.pushSubscription = body;
  }
}