const express = require('express');
const { param } = require('express-validator');
const {
  upload,
  uploadPhoto,
  getPhotosByTrip,
  deletePhoto,
} = require('../controllers/photoJournal.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All photo routes are protected
router.use(protect);

const idValidation = [
  param('id').isMongoId().withMessage('Invalid ID'),
];

// Routes
router.post('/', upload.single('image'), uploadPhoto);
router.get('/trip/:id', validate(idValidation), getPhotosByTrip);
router.delete('/:id', validate(idValidation), deletePhoto);

module.exports = router;
