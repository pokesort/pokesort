import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema(
  {
    locale: {
      type: String,
      enum: ['pt', 'en'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: [String],
      required: true,
    },
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema({
  translations: {
    type: [translationSchema],
    required: true,
    validate: {
      validator: (arr) =>
        arr.some((t) => t.lang === 'pt') && arr.some((t) => t.lang === 'en'),
      message: 'Translations for all supported languages are required',
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

export const getNoticeModel = (conn) => {
  return conn.models.Notice || conn.model('Notice', noticeSchema);
};