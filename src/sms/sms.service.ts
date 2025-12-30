import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Twilio credentials not found, SMS will be mocked');
        return;
      }
      throw new Error('Twilio credentials are not configured');
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === 'development' && process.env.SEND_REAL_SMS !== 'true') {
      this.logger.log(`[DEV MODE] SMS to ${phone}: Your verification code is: ${code}`);
      return;
    }

    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new InternalServerErrorException('TWILIO_PHONE_NUMBER is not configured');
    }

    try {
      if (!this.twilioClient) {
        throw new InternalServerErrorException('Twilio client not initialized');
      }

      const message = await this.twilioClient.messages.create({
        body: `Your verification code is: ${code}. It expires in 5 minutes.`,
        from: fromNumber,
        to: phone,
      });

      this.logger.log(`SMS sent successfully to ${phone}, SID: ${message.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error);

      if (error.code === 21211) {
        throw new BadRequestException('Invalid phone number format');
      }

      throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}

