const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());


app.get('/api/classify', async (req, res) => {
  try {
    const name = req.query.name;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name parameter'
      });
    }
    
    if (typeof name !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'name is not a string'
      });
    }
    
    const response = await axios.get(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
    const data = response.data;
    
    if (data.gender === null || data.count === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No prediction available for the provided name'
      });
    }
    
    const isConfident = (data.probability >= 0.7 && data.count >= 100);
    
    const result = {
      status: 'success',
      data: {
        name: name,
        gender: data.gender,
        probability: data.probability,
        sample_size: data.count,  
        is_confident: isConfident,
        processed_at: new Date().toISOString()  
      }
    };
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.response) {
      res.status(502).json({
        status: 'error',
        message: 'Upstream API failure'
      });
    } else if (error.request) {
      res.status(500).json({
        status: 'error',
        message: 'Server failure'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});