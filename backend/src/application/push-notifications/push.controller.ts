import { BadRequestException, Body, Controller, Patch, Put, Session } from "@nestjs/common";
import { AllowInactiveAccount } from "src/shared/auth/decorators/allow-inactive-account";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";

@Controller("notifications")
@AllowInactiveAccount(true)
export class PushController {

  @Put("subscription")
  public async putSubscription(@Session() session: Record<string, any>, @Body() body: PushSubscriptionDto) {
    if (body.subscription) {
      session.pushSubscription = body.subscription;
      // different-platform subscription shouldn't have been here before but it's better to be safe
      session.fcmToken = null;  
    }
    else if (body.fcmToken) {
      session.fcmToken = body.fcmToken;
      session.pushSubscription = null;
    }
    else {
      // the endpoint also allows to disable the notifications with an empty body
      session.fcmToken = null;
      session.pushSubscription = null;
    }
    
    session.language = body.language ?? session.language ?? "en";
  }
}