import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Profile } from 'passport-google-oauth20';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('google-auth.clientID') || '',
      clientSecret: configService.get('google-auth.clientSecret') || '',
      callbackURL: configService.get('google-auth.callbackURL') || '',
      scope: ['email', 'profile'],
    });
  }
  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    return {
      googleSub: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      givenName: profile.name?.givenName ?? '',
      familyName: profile.name?.familyName ?? '',
      profileUrl: profile.photos?.[0]?.value ?? undefined,
    };
  }
}
