const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/weatherapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Define MongoDB Schema and Model (WeatherData)
const weatherDataSchema = new mongoose.Schema({
  location: String,
  temperature: Number,
  humidity: String,
});

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

// Define a route for the root URL
app.get('/', (req, res) => {
    res.render('index');
  });
  

// Handle form submission
app.post('/weather', async (req, res) => {
    const location = req.body.location;
    const apiKey = 'jWxJbh6a3rRicgoHSDAejpqN1U7XTh07'; // Get an API key from OpenWeatherMap
    const encodedLoc = "new%20york"
    // Read location and encode

    try {
        const options = {method: 'GET', headers: {accept: 'application/json'}}
        const response = await fetch(
        `https://api.tomorrow.io/v4/weather/forecast?location=${encodedLoc}&timesteps=1d&apikey=${apiKey}`, options)
        const json = await response.json()
  
        const weatherData = new WeatherData({
            location: json.location.name,
            temperature: json.timelines.daily[0].values.temperatureAvg,
            humidity: json.timelines.daily[0].values.humidityAvg,
        });
        console.log(weatherData)
        await weatherData.save();
        let { location, temperature, humidity } = weatherData
        res.render('weather', { location, humidity, description });
    } catch (error) {
      console.error(error);
      res.send('Error fetching weather data.');
    }
  });
  

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});