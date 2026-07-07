import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { Photo, PhotoDocument } from '../../schemas/Photo.model';
import { PhotoComment, PhotoCommentDocument } from '../../schemas/PhotoComment.model';
import { Agency, AgencyDocument } from '../../schemas/Agency.model';
import { Like, LikeDocument } from '../../schemas/Like.model';
import { CreatePhotoInput, CreatePhotoCommentInput, PhotosInquiryInput } from '../../libs/dto/photo/photo.input';
import { PhotosInquiryResult, PhotoType, PhotoCommentType } from '../../libs/dto/photo/photo.type';
import { LikeTargetType } from '../../libs/enums';
import { lookupAuthUserLiked, lookupUserData } from '../../libs/config/aggregation';

@Injectable()
export class PhotoService {
  constructor(
    @InjectModel(Photo.name) private readonly photoModel: Model<PhotoDocument>,
    @InjectModel(PhotoComment.name) private readonly photoCommentModel: Model<PhotoCommentDocument>,
    @InjectModel(Agency.name) private readonly agencyModel: Model<AgencyDocument>,
    @InjectModel(Like.name) private readonly likeModel: Model<LikeDocument>,
  ) {}

  // Eng ko'p like bosilganlar birinchi — board sahifalari shu tartibda ko'rsatadi
  async getPhotos(input: PhotosInquiryInput, userId?: string): Promise<PhotosInquiryResult> {
    const match: Record<string, any> = {};
    if (input.serviceType) match.serviceType = input.serviceType;
    if (input.agencyId) match.agency = new Types.ObjectId(input.agencyId);

    const viewerId = userId ? new Types.ObjectId(userId) : null;

    const [result] = await this.photoModel
      .aggregate([
        { $match: match },
        { $sort: { likeCount: -1, createdAt: -1 } },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupAuthUserLiked(viewerId, '$_id', LikeTargetType.PHOTO),
              {
                $lookup: {
                  from: 'agencies',
                  localField: 'agency',
                  foreignField: '_id',
                  as: 'agencyData',
                },
              },
              { $unwind: { path: '$agencyData', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  agencyName: '$agencyData.name',
                  agencyLogo: '$agencyData.logo',
                },
              },
              { $project: { agencyData: 0 } },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    return {
      list: result?.list ?? [],
      metaCounter: result?.metaCounter?.length ? result.metaCounter : [{ total: 0 }],
    };
  }

  async createPhoto(input: CreatePhotoInput, userId: string): Promise<PhotoType> {
    const agency = await this.requireOwnAgency(userId);

    const created = await this.photoModel.create({
      agency: agency._id,
      image: input.image,
      serviceType: input.serviceType,
    });

    return created.toObject() as unknown as PhotoType;
  }

  async deletePhoto(photoId: string, userId: string): Promise<boolean> {
    const photo = await this.photoModel.findById(photoId).exec();
    if (!photo) throw new NotFoundException('Photo not found');

    const agency = await this.requireOwnAgency(userId);
    if (photo.agency.toString() !== agency._id.toString()) {
      throw new ForbiddenException('You can delete only your own photos');
    }

    await photo.deleteOne();
    // Bog'liq izoh va like'larni ham tozalaymiz
    await this.photoCommentModel.deleteMany({ photo: photo._id }).exec();
    await this.likeModel
      .deleteMany({ targetId: photo._id, targetType: LikeTargetType.PHOTO })
      .exec();

    // Diskdagi faylni ham o'chiramiz (uploads/photos/<board>/...)
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filepath = path.resolve(uploadsDir, photo.image);
      if (filepath.startsWith(uploadsDir) && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch {
      // fayl o'chmasa ham amaliyot muvaffaqiyatli hisoblanadi
    }

    return true;
  }

  async createComment(input: CreatePhotoCommentInput, userId: string): Promise<PhotoCommentType> {
    const photo = await this.photoModel.findById(input.photoId).exec();
    if (!photo) throw new NotFoundException('Photo not found');

    const created = await this.photoCommentModel.create({
      photo: photo._id,
      user: new Types.ObjectId(userId),
      text: input.text,
    });

    await this.photoModel.findByIdAndUpdate(photo._id, { $inc: { commentCount: 1 } }).exec();

    const [comment] = await this.commentsPipeline({ _id: created._id });
    return comment;
  }

  async getComments(photoId: string): Promise<PhotoCommentType[]> {
    return this.commentsPipeline({ photo: new Types.ObjectId(photoId) });
  }

  private async commentsPipeline(match: Record<string, any>): Promise<PhotoCommentType[]> {
    return this.photoCommentModel
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $limit: 100 },
        lookupUserData,
        { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$userData.firstName', ''] },
                    ' ',
                    { $ifNull: ['$userData.lastName', ''] },
                  ],
                },
              },
            },
            userAvatar: '$userData.avatar',
          },
        },
        { $project: { userData: 0 } },
      ])
      .exec() as unknown as Promise<PhotoCommentType[]>;
  }

  private async requireOwnAgency(userId: string): Promise<AgencyDocument> {
    const agency = await this.agencyModel.findOne({ owner: new Types.ObjectId(userId) }).exec();
    if (!agency) throw new ForbiddenException('Only agency owners can manage photos');
    return agency;
  }
}
