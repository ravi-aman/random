import { Request } from 'express'

import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common'
import { RequestHelper } from '@server/helpers/request'
import { EventService } from '@server/libraries/event'
import { GroupMemberDomainFacade } from '@server/modules/groupMember/domain'
import { AuthenticationDomainFacade } from '@server/modules/authentication/domain'
import { GroupMemberApplicationEvent } from './groupMember.application.event'
import { GroupMemberCreateDto } from './groupMember.dto'

import { UserDomainFacade } from '../../user/domain'

@Controller('/v1/users')
export class GroupMemberByUserController {
  constructor(
    private userDomainFacade: UserDomainFacade,

    private groupMemberDomainFacade: GroupMemberDomainFacade,
    private eventService: EventService,
    private authenticationDomainFacade: AuthenticationDomainFacade,
  ) {}

  @Get('/user/:userId/groupMembers')
  async findManyUserId(
    @Param('userId') userId: string,
    @Req() request: Request,
  ) {
    const queryOptions = RequestHelper.getQueryOptions(request)

    const parent = await this.userDomainFacade.findOneByIdOrFail(userId)

    const items = await this.groupMemberDomainFacade.findManyByUser(
      parent,
      queryOptions,
    )

    return items
  }

  @Post('/user/:userId/groupMembers')
  async createByUserId(
    @Param('userId') userId: string,
    @Body() body: GroupMemberCreateDto,
    @Req() request: Request,
  ) {
    const { user } = this.authenticationDomainFacade.getRequestPayload(request)

    const valuesUpdated = { ...body, userId }

    const item = await this.groupMemberDomainFacade.create(valuesUpdated)

    await this.eventService.emit<GroupMemberApplicationEvent.GroupMemberCreated.Payload>(
      GroupMemberApplicationEvent.GroupMemberCreated.key,
      {
        id: item.id,
        userId: user.id,
      },
    )

    return item
  }
}
