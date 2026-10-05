const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip, canEditTrip } = require('../utils/canAccessTrip');

/**
 * @desc    Manually create an expense entry
 * @route   POST /api/expenses
 * @access  Protected
 */
const createExpense = asyncHandler(async (req, res, next) => {
  const { tripId, category, description, amount, currency, date, receipt } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasEdit = await canEditTrip(req.user._id, tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to add expenses to this trip');
  }

  const expense = await Expense.create({
    tripId,
    userId: req.user._id,
    category,
    description,
    amount,
    currency: currency || 'INR',
    date: date || new Date(),
    receipt: receipt || null,
  });

  res.status(201).json({
    success: true,
    data: expense,
    message: 'Expense added successfully',
  });
});

/**
 * @desc    Get all expenses logged by the user
 * @route   GET /api/expenses
 * @access  Protected
 */
const getAllExpenses = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Expense.countDocuments({ userId: req.user._id });
  const expenses = await Expense.find({ userId: req.user._id })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('tripId', 'title destination');

  res.status(200).json({
    success: true,
    data: {
      expenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    message: 'Expenses retrieved successfully',
  });
});

/**
 * @desc    Get expenses for a trip + aggregated totalSpent
 * @route   GET /api/expenses/trip/:id
 * @access  Protected
 */
const getExpensesByTrip = asyncHandler(async (req, res, next) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view expenses for this trip');
  }

  const expenses = await Expense.find({ tripId }).sort({ date: -1 });

  // Aggregate total spent and category breakdown
  const aggregation = await Expense.aggregate([
    { $match: { tripId: trip._id } },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        byCategory: {
          $push: { category: '$category', amount: '$amount' },
        },
      },
    },
  ]);

  const totalSpent = aggregation.length > 0 ? aggregation[0].totalSpent : 0;

  // Breakdown by category
  const categoryTotals = {};
  if (aggregation.length > 0) {
    aggregation[0].byCategory.forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      expenses,
      totalSpent,
      categoryBreakdown: categoryTotals,
      budget: trip.budget,
      remainingBudget: trip.budget ? trip.budget - totalSpent : null,
    },
    message: 'Trip expenses and summary retrieved successfully',
  });
});

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Protected
 */
const getExpenseById = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, expense.tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view this expense');
  }

  res.status(200).json({
    success: true,
    data: expense,
    message: 'Expense retrieved successfully',
  });
});

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Protected
 */
const updateExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const hasEdit = await canEditTrip(req.user._id, expense.tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to edit this expense');
  }

  delete req.body.tripId;
  delete req.body.userId;
  delete req.body.bookingRef; // Keep booking references immutable

  const updatedExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedExpense,
    message: 'Expense updated successfully',
  });
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Protected
 */
const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const hasEdit = await canEditTrip(req.user._id, expense.tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to delete this expense');
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Expense deleted successfully',
  });
});

module.exports = {
  createExpense,
  getAllExpenses,
  getExpensesByTrip,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
