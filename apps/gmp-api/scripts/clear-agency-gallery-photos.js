const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const apply = process.argv.includes('--apply');
const uploadsDir = path.resolve(__dirname, '../uploads');

function uploadedFilePath(value) {
  if (!value || typeof value !== 'string') return null;

  const relative = value
    .replace(/^https?:\/\/[^/]+\/uploads\//i, '')
    .replace(/^\/uploads\//, '')
    .replace(/^uploads\//, '')
    .replace(/^[/\\]+/, '');
  const resolved = path.resolve(uploadsDir, relative);
  return resolved.startsWith(`${uploadsDir}${path.sep}`) ? resolved : null;
}

async function main() {
  const useConfiguredUri = process.argv.includes('--configured-uri');
  const uri = useConfiguredUri
    ? process.env.MONGODB_URI
    : process.env.MONGO_DEV || process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB connection URI is missing');

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const photos = await db.collection('photos').find({}).toArray();
  const photoIds = photos.map((photo) => photo._id);
  const comments = photoIds.length
    ? await db.collection('photocomments').find({ photo: { $in: photoIds } }).toArray()
    : [];
  const commentIds = comments.map((comment) => comment._id);

  const photoLikes = photoIds.length
    ? await db.collection('likes').countDocuments({
        targetId: { $in: photoIds },
        targetType: 'Photo',
      })
    : 0;
  const commentLikes = commentIds.length
    ? await db.collection('likes').countDocuments({
        targetId: { $in: commentIds },
        targetType: 'PhotoComment',
      })
    : 0;
  const views = photoIds.length
    ? await db.collection('views').countDocuments({
        targetId: { $in: photoIds },
        targetType: 'Photo',
      })
    : 0;

  console.log(`Agency gallery photos: ${photos.length}`);
  console.log(`Photo comments: ${comments.length}`);
  console.log(`Related likes: ${photoLikes + commentLikes}`);
  console.log(`Related views: ${views}`);

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to delete these records and files.');
    return;
  }

  if (commentIds.length) {
    await db.collection('likes').deleteMany({
      targetId: { $in: commentIds },
      targetType: 'PhotoComment',
    });
  }
  if (photoIds.length) {
    await Promise.all([
      db.collection('likes').deleteMany({
        targetId: { $in: photoIds },
        targetType: 'Photo',
      }),
      db.collection('views').deleteMany({
        targetId: { $in: photoIds },
        targetType: 'Photo',
      }),
      db.collection('photocomments').deleteMany({ photo: { $in: photoIds } }),
    ]);
    await db.collection('photos').deleteMany({ _id: { $in: photoIds } });
  }

  const fileValues = [
    ...photos.map((photo) => photo.image),
    ...comments.flatMap((comment) =>
      Array.isArray(comment.attachments)
        ? comment.attachments.map((attachment) => attachment?.url)
        : [],
    ),
  ];
  let deletedFiles = 0;
  for (const value of new Set(fileValues)) {
    const filePath = uploadedFilePath(value);
    if (!filePath || !fs.existsSync(filePath)) continue;
    fs.unlinkSync(filePath);
    deletedFiles += 1;
  }

  console.log(`Deleted database photos: ${photos.length}`);
  console.log(`Deleted uploaded files: ${deletedFiles}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
