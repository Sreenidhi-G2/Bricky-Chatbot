const express = require("express");
const router = express.Router();
const KnowledgeBase = require("../models/KnowledgeBase");
const axios = require("axios");
require("dotenv").config();

/**
 * Utility: Check if the query is construction-related
 */
const isConstructionRelated = (query) => {
  const keywords = [
    "construction", "building", "cement", "brick", "concrete",
    "masonry", "architecture", "civil engineering", "foundation",
    "plaster", "painting", "rebar", "steel", "contractor",
    "site", "scaffolding", "safety", "construction law", "construction material",
    "building code", "electrical", "plumbing", "roofing", "tiles", "surveying",
    "blueprint", "interior design", "flooring", "estimate", "labor", "site plan",
    "contract", "mortar", "aggregate", "beam", "column", "slab"
  ];

  return keywords.some(word => query.toLowerCase().includes(word));
};

router.post("/ask-question", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required and must be a string." });
  }

  try {
    console.log("Incoming query:", query);

    // ✅ 1. Hard filter before calling Claude
    if (!isConstructionRelated(query)) {
      console.log("❌ Query rejected (not construction-related)");
      return res.json({
        answer:
          "I'm designed to answer only construction-related questions. Please ask me something about building, materials, or project work.",
        source: "filter",
      });
    }

    // ✅ 2. Search local KnowledgeBase first
    const keywordsFromQuery = query.toLowerCase().split(/\s+/);
    const result = await KnowledgeBase.findOne({
      $or: [
        { question: { $regex: query, $options: "i" } },
        { keywords: { $in: keywordsFromQuery } },
      ],
    });

    if (result) {
      console.log("Matched Entry from DB:", result);
      return res.json({ answer: result.answer, source: "kb" });
    }

    console.log("No match found in DB. Falling back to Claude...");

    // ✅ 3. Claude fallback (reinforced prompt)
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set");
      return res.status(500).json({
        answer: "Configuration error. Please contact support.",
        error: "API key missing",
      });
    }

    const openaiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-haiku",
        messages: [
          {
            role: "system",
            content: `You are Bricky, a professional construction assistant.

IMPORTANT:
You are allowed to talk ONLY about topics directly related to construction, civil engineering, architecture, or building materials.

If the user asks about anything else (e.g., celebrities, sports, technology, general knowledge, etc.), you MUST respond exactly with this:
"I'm designed to answer only construction-related questions. Please ask me something about building, materials, or project work."

Never provide information outside the construction domain.`
          },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 800,
        top_p: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            process.env.NODE_ENV === "production"
              ? "https://bricky-chatbot.onrender.com"
              : "http://localhost:5000",
          "X-Title": "Bricky Construction Assistant",
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );

    console.log("Claude response received successfully");

    const claudeAnswer = openaiRes?.data?.choices?.[0]?.message?.content?.trim();

    if (!claudeAnswer) {
      console.error("Invalid response from Claude:", openaiRes.data);
      return res.status(500).json({
        answer: "I'm having trouble processing your request. Please try again.",
        error: "Invalid API response structure",
      });
    }

    return res.json({ answer: claudeAnswer, source: "claude" });
  } catch (error) {
    console.error("=== ERROR ===");
    console.error(error.message);
    if (error.response) {
      console.error("Response:", error.response.status, error.response.data);
    }

    return res.status(500).json({
      answer: "I'm experiencing technical difficulties. Please try again later.",
      error: "Internal server error",
    });
  }
});

module.exports = router;
