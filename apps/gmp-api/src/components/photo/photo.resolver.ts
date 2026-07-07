import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PhotoService } from './photo.service';
import { PhotoType, PhotosInquiryResult, PhotoCommentType } from '../../libs/dto/photo/photo.type';
import { CreatePhotoInput, CreatePhotoCommentInput, PhotosInquiryInput } from '../../libs/dto/photo/photo.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { WithoutAuth } from '../auth/guards/without.guard';

@Resolver(() => PhotoType)
export class PhotoResolver {
  constructor(private readonly photoService: PhotoService) {}

  @WithoutAuth()
  @Query(() => PhotosInquiryResult, { name: 'getPhotos' })
  async getPhotos(
    @Args('input') input: PhotosInquiryInput,
    @CurrentUser() user: any,
  ): Promise<PhotosInquiryResult> {
    console.log('Query: getPhotos');
    return this.photoService.getPhotos(input, user?._id?.toString());
  }

  @Public()
  @Query(() => [PhotoCommentType], { name: 'getPhotoComments' })
  async getPhotoComments(@Args('photoId') photoId: string): Promise<PhotoCommentType[]> {
    console.log('Query: getPhotoComments');
    return this.photoService.getComments(photoId);
  }

  @Mutation(() => PhotoType, { name: 'createPhoto' })
  async createPhoto(
    @Args('input') input: CreatePhotoInput,
    @CurrentUser() user: any,
  ): Promise<PhotoType> {
    console.log('Mutation: createPhoto');
    return this.photoService.createPhoto(input, user._id.toString());
  }

  @Mutation(() => Boolean, { name: 'deletePhoto' })
  async deletePhoto(
    @Args('photoId') photoId: string,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    console.log('Mutation: deletePhoto');
    return this.photoService.deletePhoto(photoId, user._id.toString());
  }

  @Mutation(() => PhotoCommentType, { name: 'createPhotoComment' })
  async createPhotoComment(
    @Args('input') input: CreatePhotoCommentInput,
    @CurrentUser() user: any,
  ): Promise<PhotoCommentType> {
    console.log('Mutation: createPhotoComment');
    return this.photoService.createComment(input, user._id.toString());
  }
}
