import mongoose from 'mongoose';

const thesisSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Thesis =
  mongoose.models.Thesis ||
  mongoose.model('Thesis', thesisSchema);

export default Thesis;
