import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';
import { SmsService } from '../sms';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpiryMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
  ) {
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
  }

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Mark all previous unused OTPs for a phone as used
   */
  private async invalidatePreviousOtps(phone: string): Promise<void> {
    await this.prisma.otpToken.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });
  }

  /**
   * Signup: Request OTP for new user
   */
  async signup(
    phone: string,
    fullName: string,
  ): Promise<{ message: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this phone number already exists. Please sign in instead.',
      );
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    // Invalidate previous OTPs
    await this.invalidatePreviousOtps(phone);

    // Create signup OTP token with fullName
    await this.prisma.otpToken.create({
      data: {
        phone,
        code,
        type: 'signup',
        fullName,
        expiresAt,
      },
    });

    // Send OTP via SMS
    await this.smsService.sendOtp(phone, code);

    this.logger.log(`Signup OTP sent to ${phone}`);

    return { message: 'OTP sent successfully. Please verify to complete registration.' };
  }

  /**
   * Signup Verify: Verify OTP and create new user
   */
  async signupVerify(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; user: object }> {
    // Find valid signup OTP token
    console.log(`Verifying Signup OTP: phone=${phone}, code=${code}`);
    const otpToken = await this.prisma.otpToken.findFirst({
      where: {
        phone,
        code,
        type: 'signup',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Debug log
    if (!otpToken) {
      console.log('OTP Verification Failed: Token not found or expired');
      // Check if it exists but expired or used
      const debugToken = await this.prisma.otpToken.findFirst({
        where: { phone, code, type: 'signup' },
        orderBy: { createdAt: 'desc' },
      });
      console.log('Debug Token State:', debugToken);
      console.log('Current Server Time:', new Date());
    } else {
      console.log('OTP Verification Successful:', otpToken);
    }

    if (!otpToken) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check user doesn't already exist (race condition protection)
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('Account already exists. Please sign in.');
    }

    // Mark OTP as used
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { used: true },
    });

    // Create new user with fullName from OTP token
    const user = await this.prisma.user.create({
      data: {
        phone,
        fullName: otpToken.fullName,
        isVerified: true,
      },
    });

    this.logger.log(`New user created: ${phone} (${otpToken.fullName})`);

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone, type: 'user' };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
    };
  }

  /**
   * Signin: Request OTP for existing user
   */
  async signin(phone: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new NotFoundException(
        'No account found with this phone number. Please sign up first.',
      );
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

    // Invalidate previous OTPs
    await this.invalidatePreviousOtps(phone);

    // Create signin OTP token
    await this.prisma.otpToken.create({
      data: {
        phone,
        code,
        type: 'signin',
        expiresAt,
      },
    });

    // Send OTP via SMS
    await this.smsService.sendOtp(phone, code);

    this.logger.log(`Signin OTP sent to ${phone}`);

    return { message: 'OTP sent successfully' };
  }

  /**
   * Signin Verify: Verify OTP and return JWT for existing user
   */
  async signinVerify(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; user: object }> {
    // Find valid signin OTP token
    console.log(`Verifying Signin OTP: phone=${phone}, code=${code}`);
    const otpToken = await this.prisma.otpToken.findFirst({
      where: {
        phone,
        code,
        type: 'signin',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Debug log
    if (!otpToken) {
      console.log('Signin OTP Verification Failed: Token not found or expired');
      // Check if it exists but expired or used
      const debugToken = await this.prisma.otpToken.findFirst({
        where: { phone, code, type: 'signin' },
        orderBy: { createdAt: 'desc' },
      });
      console.log('Debug Token State:', debugToken);
      console.log('Current Server Time:', new Date());
    } else {
      console.log('Signin OTP Verification Successful:', otpToken);
    }

    if (!otpToken) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find existing user
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Mark OTP as used
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { used: true },
    });

    // Update isVerified if not already
    if (!user.isVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    this.logger.log(`User signed in: ${phone}`);

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone, type: 'user' };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        isVerified: true,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }
}
