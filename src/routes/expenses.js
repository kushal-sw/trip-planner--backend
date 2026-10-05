const express = require('express');
const { body, param } = require('express-validator');
const {
  createExpense,
  getAllExpenses,
  getExpensesByTrip,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All expense routes are protected
router.use(protect);

// Validations
const createExpenseValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('category')
    .isIn(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isNumeric().withMessage('Amount must be a numeric value'),
];

const updateExpenseValidation = [
  param('id').isMongoId().withMessage('Invalid expense ID'),
  body('category')
    .optional()
    .isIn(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'])
    .withMessage('Invalid expense category'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isNumeric().withMessage('Amount must be a numeric value'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid expense ID'),
];

const tripIdValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
];

// Routes
router.post('/', validate(createExpenseValidation), createExpense);
router.get('/', getAllExpenses);
router.get('/trip/:id', validate(tripIdValidation), getExpensesByTrip);
router.get('/:id', validate(idValidation), getExpenseById);
router.put('/:id', validate(updateExpenseValidation), updateExpense);
router.delete('/:id', validate(idValidation), deleteExpense);

module.exports = router;
