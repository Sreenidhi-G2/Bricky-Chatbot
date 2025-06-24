const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const axios = require('axios');
require('dotenv').config();

router.post('/ask-question', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: "Query is required and must be a string." });
  }

  try {
    console.log("Incoming query:", query);
    const keywordsFromQuery = query.toLowerCase().split(/\s+/); // split using any whitespace
    console.log("Extracted keywords:", keywordsFromQuery);

    const result = await KnowledgeBase.findOne({
      $or: [
        { question: { $regex: query, $options: 'i' } },
        { keywords: { $in: keywordsFromQuery } }
      ]
    });

    if (result) {
      console.log("Matched Entry from DB:", result);
      return res.json({ answer: result.answer, source: "kb" });
    }

    console.log("No match found in DB. Falling back to OpenAI...");

    const openaiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant in the construction industry.",
          },
          { role: "user", content: query }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://yourdomain.com", // use localhost during development
          "Content-Type": "application/json"
        }
      }
    );

    const gptAnswer = openaiRes.data.choices[0].message.content.trim();
    return res.json({ answer: gptAnswer, source: "openai" });

  } catch (error) {
    console.error("Error fetching from knowledge base or OpenAI:", error.message);
    return res.status(500).json({ answer: "Server error. Please try again later." });
  }
});

module.exports = router;
