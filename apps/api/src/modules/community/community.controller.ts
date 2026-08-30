import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CommunityService } from './community.service';
import {
  AddNewsCommentDto,
  RegisterEventDto,
  SetNewsReactionDto,
} from './dto/community.dto';

@Controller()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Get('community/feed')
  getFeed(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 30);
    return this.communityService.getCommunityFeed(
      Number.isFinite(parsedLimit) ? parsedLimit : 30,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('events/:id/register')
  registerToEvent(
    @Param('id') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterEventDto,
  ) {
    return this.communityService.registerToEvent(eventId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('events/:id/register')
  cancelRegistration(
    @Param('id') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communityService.cancelEventRegistration(eventId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('notifications')
  getMyNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.communityService.getMyNotifications(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('notifications/:id/read')
  markNotificationRead(
    @Param('id') notificationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.communityService.markNotificationRead(notificationId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('news/:id/comments')
  listNewsComments(@Param('id') newsId: string) {
    return this.communityService.listNewsComments(newsId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('news/:id/comments')
  addNewsComment(
    @Param('id') newsId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddNewsCommentDto,
  ) {
    return this.communityService.addNewsComment(newsId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('news/:id/reactions')
  setNewsReaction(
    @Param('id') newsId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetNewsReactionDto,
  ) {
    return this.communityService.setNewsReaction(newsId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('news/:id/reactions')
  newsReactions(@Param('id') newsId: string) {
    return this.communityService.getNewsReactionsSummary(newsId);
  }

  @Get('hall-of-fame')
  getHallOfFame() {
    return this.communityService.getHallOfFame();
  }
}
