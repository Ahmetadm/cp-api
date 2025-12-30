import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, SignupVerifyDto } from './dto/signup.dto';
import { SigninDto, SigninVerifyDto } from './dto/signin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== SIGNUP ====================

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request signup OTP for new user' })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent successfully. Please verify to complete registration.' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.phone, dto.fullName);
  }

  @Post('signup/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and create new account' })
  @ApiResponse({
    status: 200,
    description: 'Account created successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            phone: { type: 'string' },
            fullName: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async signupVerify(@Body() dto: SignupVerifyDto) {
    return this.authService.signupVerify(dto.phone, dto.code);
  }

  // ==================== SIGNIN ====================

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request signin OTP for existing user' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  @ApiResponse({ status: 404, description: 'No account found with this phone number' })
  async signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto.phone);
  }

  @Post('signin/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and sign in' })
  @ApiResponse({
    status: 200,
    description: 'Signed in successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            phone: { type: 'string' },
            fullName: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async signinVerify(@Body() dto: SigninVerifyDto) {
    return this.authService.signinVerify(dto.phone, dto.code);
  }

  // ==================== CURRENT USER ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        phone: { type: 'string' },
        fullName: { type: 'string', nullable: true },
        isVerified: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: { id: number }) {
    return this.authService.getUserById(user.id);
  }
}
