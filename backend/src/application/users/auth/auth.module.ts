import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { jwtExpiration, jwtSecret } from "./jwt-constants";
import { AccountsDomainModule } from "src/domain/accounts/accounts.module";
import { ProfilesDomainModule } from "src/domain/profiles/profiles.module";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    AccountsDomainModule,
    ProfilesDomainModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<any>('jwt.expiration') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {
  constructor(private config: ConfigService) {}
}