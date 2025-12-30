// Mock Prisma before any other imports to avoid ESM issues
jest.mock('./../src/prisma', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({})),
  PrismaModule: { module: class {} },
}));

jest.mock('./../src/sms', () => ({
  SmsService: jest.fn().mockImplementation(() => ({
    sendOtp: jest.fn().mockResolvedValue(undefined),
  })),
  SmsModule: { module: class {} },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './../src/auth/auth.controller';
import { AuthService } from './../src/auth/auth.service';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './../src/prisma';
import { SmsService } from './../src/sms';

// Mock dependencies
const mockAuthService = {
  signup: jest.fn(),
  signupVerify: jest.fn(),
  signin: jest.fn(),
  signinVerify: jest.fn(),
  getUserById: jest.fn(),
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  const testPhone = '+38970555555';
  const testFullName = 'E2E Test User';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: {} },
        { provide: SmsService, useValue: { sendOtp: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { id: 1 }; // Mock authenticated user
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/signup (POST)', () => {
    it('should send OTP for new user', async () => {
      mockAuthService.signup.mockResolvedValue({
        message: 'OTP sent successfully. Please verify to complete registration.',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone: testPhone, fullName: testFullName })
        .expect(201);

      expect(response.body.message).toContain('OTP sent successfully');
      expect(mockAuthService.signup).toHaveBeenCalledWith(testPhone, testFullName);
    });

    it('should reject invalid phone format', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone: 'invalid', fullName: testFullName })
        .expect(400);
    });

    it('should require fullName', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone: testPhone })
        .expect(400);
    });
  });

  describe('/auth/signup/verify (POST)', () => {
    it('should create user on valid OTP', async () => {
      mockAuthService.signupVerify.mockResolvedValue({
        accessToken: 'mock-token',
        user: { id: 1, phone: testPhone, fullName: testFullName, isVerified: true },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signup/verify')
        .send({ phone: testPhone, code: '123456' })
        .expect(200);

      expect(response.body.accessToken).toBe('mock-token');
      expect(response.body.user.fullName).toBe(testFullName);
      expect(mockAuthService.signupVerify).toHaveBeenCalledWith(testPhone, '123456');
    });

    it('should reject invalid OTP format', () => {
      return request(app.getHttpServer())
        .post('/auth/signup/verify')
        .send({ phone: testPhone, code: 'abc' })
        .expect(400);
    });
  });

  describe('/auth/signin (POST)', () => {
    it('should send OTP for existing user', async () => {
      mockAuthService.signin.mockResolvedValue({
        message: 'OTP sent successfully',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ phone: testPhone })
        .expect(200);

      expect(response.body.message).toBe('OTP sent successfully');
      expect(mockAuthService.signin).toHaveBeenCalledWith(testPhone);
    });

    it('should reject invalid phone format', () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({ phone: 'not-a-phone' })
        .expect(400);
    });
  });

  describe('/auth/signin/verify (POST)', () => {
    it('should return JWT on valid signin OTP', async () => {
      mockAuthService.signinVerify.mockResolvedValue({
        accessToken: 'mock-signin-token',
        user: { id: 1, phone: testPhone, fullName: testFullName, isVerified: true },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signin/verify')
        .send({ phone: testPhone, code: '123456' })
        .expect(200);

      expect(response.body.accessToken).toBe('mock-signin-token');
      expect(mockAuthService.signinVerify).toHaveBeenCalledWith(testPhone, '123456');
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user data with valid token', async () => {
      mockAuthService.getUserById.mockResolvedValue({
        id: 1,
        phone: testPhone,
        fullName: testFullName,
        isVerified: true,
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.phone).toBe(testPhone);
      expect(response.body.fullName).toBe(testFullName);
    });
  });
});
