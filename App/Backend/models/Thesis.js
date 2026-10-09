const mongoose = require('mongoose');

const ThesisSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  aiAnalysis: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thesis', ThesisSchema);