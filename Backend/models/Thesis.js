import mongoose from 'mongoose';

const ThesisSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  aiAnalysis: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const Thesis = mongoose.model('Thesis', ThesisSchema);

export default Thesis;