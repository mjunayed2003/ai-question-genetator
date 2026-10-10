import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SyncUserDto } from './dto/sync-user.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upserts a Firebase user into the PostgreSQL database.
   */
  async syncUser(dto: SyncUserDto) {
    const user = await this.prisma.user.upsert({
      where: { id: dto.uid },
      update: {
        email: dto.email,
        name: dto.name || undefined,
        avatar: dto.avatar || undefined,
      },
      create: {
        id: dto.uid,
        email: dto.email,
        name: dto.name || null,
        avatar: dto.avatar || null,
      },
      include: {
        _count: {
          select: {
            documents: true,
            questionSets: true,
          },
        },
      },
    });

    this.logger.log(`Synced user "${user.email}" (${user.id}) in database.`);
    return user;
  }

  /**
   * Retrieves user profile and statistics.
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            documents: true,
            questionSets: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }

    return user;
  }
}
