import { BadRequestException, Body, Controller, Put, Session } from "@nestjs/common";
import { AllowInactiveAccount } from "src/shared/auth/decorators/allow-inactive-account";
import { PushSubscriptionDto } from "./dto/push-subscription.dto";

@Controller("notifications")
@AllowInactiveAccount(true)
export class PushController {

  @Put("subscription")
  public async putSubscription(@Session() session: Record<string, any>, @Body() body: PushSubscriptionDto) {
    if (body.subscription) {
      session.pushSubscription = body.subscription;
      session.fcmToken = undefined; // idk what users copy cookies between platforms but let's just be safe
    }
    else if (body.fcmToken) {
      session.fcmToken = body.fcmToken;
      session.pushSubscription = undefined;
    }
    else {
      throw new BadRequestException("Either subscription or fcmToken must be provided");
    }
    
    session.language = body.language;
  }
}