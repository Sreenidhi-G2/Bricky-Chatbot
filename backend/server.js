const express = require('express');
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



  

  
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
