import { LikeTargetType } from '../enums';

// Authenticated user liked the target?
// userId: ObjectId or null, targetRefId: pipeline field ref (e.g. '$_id'), targetType: enum string
export const lookupAuthUserLiked = (
  userId: any,
  targetRefId: string,
  targetType: LikeTargetType,
) => ({
  $lookup: {
    from: 'likes',
    let: { ltargetId: targetRefId, luserId: userId },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$targetId', '$$ltargetId'] },
              { $eq: ['$user', '$$luserId'] },
              { $eq: ['$targetType', targetType] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: 1,
          targetId: 1,
          myFavorite: { $literal: true },
        },
      },
    ],
    as: 'meLiked',
  },
});

// Authenticated user follows the agency?
// userId: ObjectId or null, agencyRefId: pipeline field ref (e.g. '$_id')
export const lookupAuthUserFollowed = (userId: any, agencyRefId: string) => ({
  $lookup: {
    from: 'follows',
    let: { lagencyId: agencyRefId, luserId: userId },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$agency', '$$lagencyId'] },
              { $eq: ['$user', '$$luserId'] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          user: 1,
          agency: 1,
          myFollowing: { $literal: true },
        },
      },
    ],
    as: 'meFollowed',
  },
});

// Join agency data into a document that has an 'agency' field (ObjectId)
export const lookupAgencyData = {
  $lookup: {
    from: 'agencies',
    localField: 'agency',
    foreignField: '_id',
    as: 'agencyData',
  },
};

// Join user data into a document that has a 'user' field (ObjectId)
export const lookupUserData = {
  $lookup: {
    from: 'users',
    localField: 'user',
    foreignField: '_id',
    as: 'userData',
  },
};

// Join service data into a document that has a 'service' field (ObjectId)
export const lookupServiceData = {
  $lookup: {
    from: 'services',
    localField: 'service',
    foreignField: '_id',
    as: 'serviceData',
  },
};
