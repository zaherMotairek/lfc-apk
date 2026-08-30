import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { requireSecret } from '../../common/utils/environment';

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(
        configService.get<string>('JWT_ACCESS_SECRET'),
        'JWT_ACCESS_SECRET',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.usersService.getAuthenticatedUser(payload.sub);
  }
}
