import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SyncUserDto } from './dto/sync-user.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync Firebase authenticated user to database',
    description: 'Saves or updates user metadata from Firebase Google login into PostgreSQL.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'User synced successfully.' })
  async syncUser(@Body() dto: SyncUserDto) {
    return this.authService.syncUser(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User profile retrieved successfully.' })
  async getProfile(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }
    return this.authService.getUserProfile(userId);
  }
}
