import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Twilio } from 'twilio';

export interface VerificationResult {
  status: string;
  valid?: boolean;
  sid?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private verifyServiceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

    if (!accountSid || !authToken) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Twilio credentials not found, SMS will be mocked');
        return;
      }
      throw new Error('Twilio credentials are not configured');
    }

    if (!this.verifyServiceSid && process.env.NODE_ENV !== 'development') {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is not configured');
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  /**
   * Send a verification code to the given phone number using Twilio Verify API
   */
  async sendVerification(phone: string): Promise<VerificationResult> {
    if (process.env.NODE_ENV === 'development' && process.env.SEND_REAL_SMS !== 'true') {
      this.logger.log(`[DEV MODE] Verification requested for ${phone}`);
      return { status: 'pending', sid: 'dev-mode-sid' };
    }

    try {
      if (!this.twilioClient) {
        throw new InternalServerErrorException('Twilio client not initialized');
      }

      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({
          channel: 'sms',
          to: phone,
        });

      this.logger.log(`Verification sent to ${phone}, SID: ${verification.sid}, status: ${verification.status}`);

      return {
        status: verification.status,
        sid: verification.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send verification to ${phone}:`, error);

      if (error.code === 21211) {
        throw new BadRequestException('Invalid phone number format');
      }

      if (error.code === 60200) {
        throw new BadRequestException('Invalid phone number');
      }

      if (error.code === 60203) {
        throw new BadRequestException('Max send attempts reached. Please wait before trying again.');
      }

      throw new InternalServerErrorException('Failed to send verification SMS');
    }
  }

  /**
   * Check a verification code using Twilio Verify API
   */
  async checkVerification(phone: string, code: string): Promise<VerificationResult> {
    if (process.env.NODE_ENV === 'development' && process.env.SEND_REAL_SMS !== 'true') {
      // In dev mode, accept any 6-digit code for testing
      const isValid = /^\d{6}$/.test(code);
      this.logger.log(`[DEV MODE] Verification check for ${phone}: ${isValid ? 'approved' : 'pending'}`);
      return {
        status: isValid ? 'approved' : 'pending',
        valid: isValid,
      };
    }

    try {
      if (!this.twilioClient) {
        throw new InternalServerErrorException('Twilio client not initialized');
      }

      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({
          to: phone,
          code: code,
        });

      this.logger.log(`Verification check for ${phone}: status=${verificationCheck.status}, valid=${verificationCheck.valid}`);

      return {
        status: verificationCheck.status,
        valid: verificationCheck.valid,
      };
    } catch (error) {
      this.logger.error(`Failed to check verification for ${phone}:`, error);

      if (error.code === 20404) {
        // Verification not found or expired
        throw new BadRequestException('Verification expired or not found. Please request a new code.');
      }

      if (error.code === 60202) {
        throw new BadRequestException('Max check attempts reached. Please request a new code.');
      }

      throw new InternalServerErrorException('Failed to verify code');
    }
  }

  /**
   * @deprecated Use sendVerification instead. This is kept for backwards compatibility.
   */
  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn('sendOtp is deprecated, use sendVerification instead');
    await this.sendVerification(phone);
  }
}
