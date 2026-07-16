import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApplicationDocumentService } from './application-document.service';
import { ApplicationDocumentType } from '../../libs/dto/application-document/application-document.type';
import {
  RequestApplicationDocumentInput,
  ReviewApplicationDocumentInput,
} from '../../libs/dto/application-document/application-document.input';

@Resolver(() => ApplicationDocumentType)
export class ApplicationDocumentResolver {
  constructor(private readonly documentService: ApplicationDocumentService) {}

  @Query(() => [ApplicationDocumentType], { name: 'applicationDocuments' })
  applicationDocuments(
    @Args('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentService.list(applicationId, user) as any;
  }

  @Mutation(() => ApplicationDocumentType, {
    name: 'requestApplicationDocument',
  })
  requestApplicationDocument(
    @Args('input') input: RequestApplicationDocumentInput,
    @CurrentUser() user: any,
  ) {
    return this.documentService.request(input, user) as any;
  }

  @Mutation(() => ApplicationDocumentType, {
    name: 'reviewApplicationDocument',
  })
  reviewApplicationDocument(
    @Args('input') input: ReviewApplicationDocumentInput,
    @CurrentUser() user: any,
  ) {
    return this.documentService.review(input, user) as any;
  }
}
