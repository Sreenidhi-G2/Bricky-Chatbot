const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();


const app = express();
const chatbotRoutes = require('./routes/chatbot');

app.use(cors({
  origin: '*', // for now allow all; later restrict to frontend URL
  methods: ['GET', 'POST']
}))
app.use(express.json());
app.use('/api', chatbotRoutes);


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB atlas  connected"))
  .catch(err => console.error("MongoDB error:", err));
  

  
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
