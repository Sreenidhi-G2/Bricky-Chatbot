  const mongoose = require('mongoose');

  const KnowledgeBaseSchema = new mongoose.Schema({
    question: {
      type: String,
      required: true,
    },
    keywords: [String],
    answer: {
      type: String,
      required: true,
    }
  },{ collection: 'Knowledgebase' });

  // Enable full-text search
  KnowledgeBaseSchema.index({ question: "text", keywords: "text" });

  module.exports = mongoose.model('Knowledgebase', KnowledgeBaseSchema);
