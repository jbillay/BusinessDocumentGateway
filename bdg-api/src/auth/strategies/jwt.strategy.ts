import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: User): Partial<User> {
    console.log('JWT payload received:', payload);
    return {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: payload.id,
      lastLogin: payload.lastLogin,
      isActive: payload.isActive,
    };
  }
}
