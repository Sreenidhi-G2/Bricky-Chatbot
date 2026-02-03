const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();

router.post("/ask-question", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required and must be a string." });
  }

  try {
    console.log("Incoming query:", query);

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
            content: `You are Bricky, a friendly and knowledgeable construction assistant. Your primary expertise is in construction, civil engineering, architecture, and building materials.

You should:
- Strictly Answer only construction-related questions thoroughly and accurately.
- Handle normal conversational interactions naturally (greetings, small talk, thank yous, etc.).
- If a user asks something completely unrelated to construction DO NOT ANSWER, WE CANNOT AFFORD TO answer the questions apart from Construction, STRICTLY DO NOT ANSWER politely let them know your main focus is construction.

Keep your tone helpful, approachable, and professional.`,
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