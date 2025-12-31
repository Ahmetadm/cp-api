import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SmsService } from '../sms';

// Mock PrismaService entirely to avoid ESM import issues
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  otpToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

// Mock SmsService with Twilio Verify API methods
const mockSmsService = {
  sendVerification: jest.fn().mockResolvedValue({ status: 'pending', sid: 'test-sid' }),
  checkVerification: jest.fn().mockResolvedValue({ status: 'approved', valid: true }),
};

// Mock the prisma module
jest.mock('../prisma', () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrismaService),
  PrismaModule: {},
}));

// Mock the SMS module
jest.mock('../sms', () => ({
  SmsService: jest.fn().mockImplementation(() => mockSmsService),
  SmsModule: {},
}));

import { PrismaService } from '../prisma';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset default mock behaviors
    mockSmsService.sendVerification.mockResolvedValue({ status: 'pending', sid: 'test-sid' });
    mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
  });

  describe('signup', () => {
    const phone = '+38970123456';
    const fullName = 'Test User';

    it('should send verification for new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.otpToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpToken.create.mockResolvedValue({ id: 1 });

      const result = await service.signup(phone, fullName);

      expect(result.message).toContain('OTP sent successfully');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { phone } });
      expect(mockSmsService.sendVerification).toHaveBeenCalledWith(phone);
      expect(mockPrismaService.otpToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone,
          code: 'VERIFY_API',
          type: 'signup',
          fullName,
        }),
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, phone });

      await expect(service.signup(phone, fullName)).rejects.toThrow(ConflictException);
      expect(mockSmsService.sendVerification).not.toHaveBeenCalled();
    });
  });

  describe('signupVerify', () => {
    const phone = '+38970123456';
    const code = '123456';
    const fullName = 'Test User';

    it('should create user and return JWT on valid verification', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
      mockPrismaService.otpToken.findFirst.mockResolvedValue({
        id: 1,
        phone,
        type: 'signup',
        fullName,
        used: false,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.otpToken.update.mockResolvedValue({ id: 1, used: true });
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        phone,
        fullName,
        isVerified: true,
      });

      const result = await service.signupVerify(phone, code);

      expect(mockSmsService.checkVerification).toHaveBeenCalledWith(phone, code);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toMatchObject({
        id: 1,
        phone,
        fullName,
        isVerified: true,
      });
    });

    it('should throw UnauthorizedException on invalid verification', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'pending', valid: false });

      await expect(service.signupVerify(phone, code)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if signup intent not found', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
      mockPrismaService.otpToken.findFirst.mockResolvedValue(null);

      await expect(service.signupVerify(phone, code)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
      mockPrismaService.otpToken.findFirst.mockResolvedValue({
        id: 1,
        phone,
        type: 'signup',
        fullName,
        used: false,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, phone });

      await expect(service.signupVerify(phone, code)).rejects.toThrow(ConflictException);
    });
  });

  describe('signin', () => {
    const phone = '+38970123456';

    it('should send verification for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, phone });

      const result = await service.signin(phone);

      expect(result.message).toBe('OTP sent successfully');
      expect(mockSmsService.sendVerification).toHaveBeenCalledWith(phone);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signin(phone)).rejects.toThrow(NotFoundException);
      expect(mockSmsService.sendVerification).not.toHaveBeenCalled();
    });
  });

  describe('signinVerify', () => {
    const phone = '+38970123456';
    const code = '123456';

    it('should return JWT for valid verification and existing user', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        phone,
        fullName: 'Test User',
        isVerified: true,
      });

      const result = await service.signinVerify(phone, code);

      expect(mockSmsService.checkVerification).toHaveBeenCalledWith(phone, code);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toMatchObject({
        id: 1,
        phone,
        fullName: 'Test User',
        isVerified: true,
      });
    });

    it('should throw UnauthorizedException on invalid verification', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'pending', valid: false });

      await expect(service.signinVerify(phone, code)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockSmsService.checkVerification.mockResolvedValue({ status: 'approved', valid: true });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.signinVerify(phone, code)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserById', () => {
    it('should return user data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        phone: '+38970123456',
        fullName: 'Test User',
        isVerified: true,
        createdAt: new Date(),
      });

      const result = await service.getUserById(1);

      expect(result).toMatchObject({
        id: 1,
        phone: '+38970123456',
        fullName: 'Test User',
        isVerified: true,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});
