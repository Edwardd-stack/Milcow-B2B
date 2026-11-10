import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MemberModule } from '../member/member.module';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleProvider } from './social/providers/google.provider';
import { KakaoProvider } from './social/providers/kakao.provider';
import { SocialAuthController } from './social/social-auth.controller';
import { SocialAuthService } from './social/social-auth.service';

@Module({
  imports: [
    MemberModule,
    JwtModule.registerAsync({
      global: true, // JwtService available to the global AuthGuard
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN_SEC') },
      }),
    }),
  ],
  controllers: [AuthController, SocialAuthController],
  providers: [
    AuthService,
    AuthCookieService,
    SocialAuthService,
    KakaoProvider,
    GoogleProvider,
    // Global guards, run in this order on every route: 1) token  2) role
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
