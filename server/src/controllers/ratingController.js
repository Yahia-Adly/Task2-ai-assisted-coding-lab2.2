import Joi from 'joi';
import { Rating } from '../models/Rating.js';

const ratingSchema = Joi.object({
  movieCode: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  note: Joi.string().optional(),
  ratedBy: Joi.string().hex().length(24).optional(),
});

export async function createRating(req, res, next) {
  try {
    const { value, error } = ratingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const rating = await Rating.create(value);
    res.status(201).json({ rating });
  } catch (err) {
    next(err);
  }
}

export async function getAllRatings(req, res, next) {
  try {
    const ratings = await Rating.find().lean();
    res.status(200).json({ ratings });
  } catch (err) {
    next(err);
  }
}

export async function getRating(req, res, next) {
  try {
    const rating = await Rating.findById(req.params.id).lean();
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    res.status(200).json({ rating });
  } catch (err) {
    next(err);
  }
}

export async function getRatingSummary(req, res, next) {
  try {
    const { movieCode } = req.query;

    if (!movieCode) {
      return res.status(400).json({ message: 'movieCode is required' });
    }

    const summary = await Rating.aggregate([
      { $match: { movieCode } },
      {
        $group: {
          _id: '$movieCode',
          averageRating: { $avg: '$rating' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (summary.length === 0) {
      return res.status(200).json({
        movieCode,
        averageRating: 0,
        ratingCount: 0,
      });
    }

    const result = summary[0];
    res.status(200).json({
      movieCode: result._id,
      averageRating: result.averageRating,
      ratingCount: result.ratingCount,
    });
  } catch (err) {
    next(err);
  }
}
