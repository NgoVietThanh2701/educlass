import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthValidationService } from './auth-validation.service';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { OtpModule } from '@modules/otp/otp.module';
import { UsersModule } from '@modules/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: Number(configService.getOrThrow('JWT_EXPIRES_IN')) },
      }),
    }),
    OtpModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthValidationService, JwtStrategy, RefreshTokenStrategy],
  exports: [AuthValidationService, JwtModule],
})
export class AuthModule {}
