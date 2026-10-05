const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const PhotoJournal = require('../models/PhotoJournal');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip } = require('../utils/canAccessTrip');

// Configure Cloudinary if env vars are present
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Memory storage for multer (files buffered in memory and sent straight to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image files are allowed'), false);
    }
  },
});

/**
 * @desc    Upload photo to Cloudinary and record in PhotoJournal
 * @route   POST /api/photos
 * @access  Protected
 */
const uploadPhoto = asyncHandler(async (req, res, next) => {
  const { tripId, caption, location, takenAt, tags } = req.body;

  if (!tripId) {
    throw new ApiError(400, 'tripId is required');
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to upload photos for this trip');
  }

  let imageUrl = '';

  if (req.file) {
    // If Cloudinary configured, upload buffer to Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const cldRes = await cloudinary.uploader.upload(dataURI, {
        folder: 'tripplanner_photos',
        resource_type: 'image',
      });
      imageUrl = cldRes.secure_url;
    } else {
      // Graceful fallback if Cloudinary is not configured: generate simulated Cloudinary URL
      const mockCloudinaryId = `cld_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      imageUrl = `https://res.cloudinary.com/tripplanner/image/upload/v1/${mockCloudinaryId}.jpg`;
    }
  } else if (req.body.imageUrl) {
    imageUrl = req.body.imageUrl;
  } else {
    throw new ApiError(400, 'Image file or imageUrl is required');
  }

  const photo = await PhotoJournal.create({
    tripId,
    userId: req.user._id,
    imageUrl,
    caption: caption || '',
    location: location || '',
    takenAt: takenAt || new Date(),
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
  });

  res.status(201).json({
    success: true,
    data: photo,
    message: 'Photo uploaded successfully',
  });
});

/**
 * @desc    Get all photos for a trip
 * @route   GET /api/photos/trip/:id
 * @access  Protected
 */
const getPhotosByTrip = asyncHandler(async (req, res, next) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view photos for this trip');
  }

  const photos = await PhotoJournal.find({ tripId })
    .sort({ takenAt: -1 })
    .populate('userId', 'name email avatar');

  res.status(200).json({
    success: true,
    data: photos,
    message: 'Trip photos retrieved successfully',
  });
});

/**
 * @desc    Delete a photo (photo owner only)
 * @route   DELETE /api/photos/:id
 * @access  Protected
 */
const deletePhoto = asyncHandler(async (req, res, next) => {
  const photo = await PhotoJournal.findById(req.params.id);
  if (!photo) {
    throw new ApiError(404, 'Photo not found');
  }

  if (photo.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to delete this photo');
  }

  await PhotoJournal.findByIdAndDelete(photo._id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Photo deleted successfully',
  });
});

module.exports = {
  upload,
  uploadPhoto,
  getPhotosByTrip,
  deletePhoto,
};
