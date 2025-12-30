import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: `Your verification code is: ${code}. It expires in 5 minutes.`,
        from: fromNumber,
        to: phone,
      });

      this.logger.log(`SMS sent successfully to ${phone}, SID: ${message.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}:`, error);
      throw new Error('Failed to send SMS');
    }
  }
}
