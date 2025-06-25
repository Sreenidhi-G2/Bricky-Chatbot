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
    const keywordsFromQuery = query.toLowerCase().split(/\s+/);
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

    console.log("No match found in DB. Falling back to Claude via OpenRouter...");

    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set");
      return res.status(500).json({ 
        answer: "Configuration error. Please contact support.",
        error: "API key missing" 
      });
    }

    const openaiRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // Choose one of these Claude models:
        model: "anthropic/claude-3-haiku", // Fast and cost-effective
        // model: "anthropic/claude-3-sonnet", // More powerful but costs more
        // model: "anthropic/claude-3-opus", // Most powerful but most expensive
        
        messages: [
          {
            role: "system",
            content: "You are Bricky, a knowledgeable and friendly construction assistant. You specialize in helping with construction projects, building materials, safety regulations, building codes, project planning, and construction best practices. Provide practical, accurate, and helpful advice. Keep responses clear and actionable."
          },
          { 
            role: "user", 
            content: query 
          }
        ],
        temperature: 0.7,
        max_tokens: 1500, // Claude can handle longer responses well
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NODE_ENV === 'production' 
            ? "https://bricky-chatbot.onrender.com" 
            : "http://localhost:5000",
          "X-Title": "Bricky Construction Assistant",
          "Content-Type": "application/json"
        },
        timeout: 45000 // 45 seconds - Claude can take a bit longer
      }
    );

    console.log("Claude response received successfully");
    
    // Validate response structure
    if (!openaiRes.data.choices || !openaiRes.data.choices[0] || !openaiRes.data.choices[0].message) {
      console.error("Invalid response structure from Claude:", openaiRes.data);
      return res.status(500).json({ 
        answer: "I'm having trouble processing your request. Please try again.",
        error: "Invalid API response structure" 
      });
    }

    const claudeAnswer = openaiRes.data.choices[0].message.content.trim();
    return res.json({ 
      answer: claudeAnswer, 
      source: "claude" // Updated source identifier
    });

  } catch (error) {
    console.error("=== DETAILED ERROR INFO ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      // Handle specific error responses
      if (error.response.status === 401) {
        return res.status(500).json({ 
          answer: "Authentication error. Please contact support.",
          error: "Invalid API credentials" 
        });
      } else if (error.response.status === 429) {
        return res.status(500).json({ 
          answer: "I'm currently experiencing high demand. Please try again in a moment.",
          error: "Rate limit exceeded" 
        });
      } else if (error.response.status === 400) {
        return res.status(500).json({ 
          answer: "There was an issue with your request. Please try rephrasing your question.",
          error: "Bad request format" 
        });
      } else if (error.response.status === 404) {
        return res.status(500).json({ 
          answer: "The Claude model is currently unavailable. Please try again later.",
          error: "Model not found" 
        });
      }
    } else if (error.request) {
      console.error("No response received - network error");
      return res.status(500).json({ 
        answer: "Unable to connect to AI services. Please check your connection and try again.",
        error: "Network error" 
      });
    }
    
    console.error("Stack trace:", error.stack);
    console.error("=== END ERROR INFO ===");
    
    return res.status(500).json({ 
      answer: "I'm experiencing technical difficulties. Please try again later.",
      error: "Internal server error" 
    });
  }
});

module.exports = router;