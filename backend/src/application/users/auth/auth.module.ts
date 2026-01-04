import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { jwtExpiration, jwtSecret } from "./jwt-constants";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";

@Module({
  imports: [
    AccountsDomainModule,
    ProfilesDomainModule,
    JwtModule.register({
      global: true,
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpiration },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {

}