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

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Mark all previous pending signups for a phone as cancelled
   */
  private async invalidatePreviousPendingSignups(phone: string): Promise<void> {
    await this.prisma.otpToken.updateMany({
      where: { phone, used: false, type: 'signup' },
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

    // Invalidate previous pending signups
    await this.invalidatePreviousPendingSignups(phone);

    // Store signup intent with fullName (we need this after verification)
    await this.prisma.otpToken.create({
      data: {
        phone,
        code: 'VERIFY_API', // Placeholder - Twilio handles the actual code
        type: 'signup',
        fullName,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send verification via Twilio Verify API
    await this.smsService.sendVerification(phone);

    this.logger.log(`Signup verification sent to ${phone}`);

    return { message: 'OTP sent successfully. Please verify to complete registration.' };
  }

  /**
   * Signup Verify: Verify OTP and create new user
   */
  async signupVerify(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; user: object }> {
    // Check verification with Twilio Verify API
    const verificationResult = await this.smsService.checkVerification(phone, code);

    if (verificationResult.status !== 'approved' || !verificationResult.valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find the signup intent to get fullName
    const signupIntent = await this.prisma.otpToken.findFirst({
      where: {
        phone,
        type: 'signup',
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!signupIntent) {
      throw new UnauthorizedException('Signup session expired. Please sign up again.');
    }

    // Check user doesn't already exist (race condition protection)
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException('Account already exists. Please sign in.');
    }

    // Mark signup intent as used
    await this.prisma.otpToken.update({
      where: { id: signupIntent.id },
      data: { used: true },
    });

    // Create new user with fullName from signup intent
    const user = await this.prisma.user.create({
      data: {
        phone,
        fullName: signupIntent.fullName,
        isVerified: true,
      },
    });

    this.logger.log(`New user created: ${phone} (${signupIntent.fullName})`);

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

    // Send verification via Twilio Verify API
    await this.smsService.sendVerification(phone);

    this.logger.log(`Signin verification sent to ${phone}`);

    return { message: 'OTP sent successfully' };
  }

  /**
   * Signin Verify: Verify OTP and return JWT for existing user
   */
  async signinVerify(
    phone: string,
    code: string,
  ): Promise<{ accessToken: string; user: object }> {
    // Check verification with Twilio Verify API
    const verificationResult = await this.smsService.checkVerification(phone, code);

    if (verificationResult.status !== 'approved' || !verificationResult.valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find existing user
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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
