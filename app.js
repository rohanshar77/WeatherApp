const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
// const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const uri = process.env.MONGO_CONNECTION_STRING;

try {
  // Connect to MongoDB
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to WeatherApp!");
} catch (e) {
  console.log(e);
}

const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Define MongoDB Schema and Model (WeatherData)
const weatherDataSchema = new mongoose.Schema({
  location: String,
  temperature: Number,
  humidity: String,
});

const locationSchema = new mongoose.Schema({
  location: String,
});

const Location = mongoose.model("favorites", locationSchema);
const WeatherData = mongoose.model("WeatherData", weatherDataSchema);

// Define a route for the root URL
app.get("/", (req, res) => {
  res.render("index");
});

// Handle form submission
app.post("/weather", async (req, res) => {
  const location = req.body.location;
  const apiKey = "jWxJbh6a3rRicgoHSDAejpqN1U7XTh07"; // Get an API key from OpenWeatherMap
  const encodedLoc = encodeURIComponent(req.body.location);
  // Read location and encode

  try {
    const options = { method: "GET", headers: { accept: "application/json" } };
    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/forecast?location=${encodedLoc}&timesteps=1d&apikey=${apiKey}`,
      options
    );
    const json = await response.json();

    const weatherData = new WeatherData({
      location: json.location.name,
      temperature: json.timelines.daily[0].values.temperatureAvg,
      humidity: json.timelines.daily[0].values.humidityAvg,
    });
    console.log(weatherData);
    await weatherData.save();
    let { location, temperature, humidity } = weatherData;
    res.render("weather", { location, temperature, humidity });
  } catch (error) {
    console.error(error);
    res.send("Error fetching weather data.");
  }
});

app.get("/favorites", async (req, res) => {
  const favorites = await Location.find().sort({ _id: -1 }).limit(3);

  // Log for debugging
  console.log(`Retrieved favorites: ${favorites.map(f => f.location).join(', ')}`);

  // Initialize default messages
  let location1 = "Save a location as a favorite";
  let location2 = "Save a location as a favorite";
  let location3 = "Save a location as a favorite";

  // Update locations based on the number of favorites found
  if (favorites.length > 0) {
    location1 = favorites[0].location;
    if (favorites.length > 1) {
      location2 = favorites[1].location;
      if (favorites.length > 2) {
        location3 = favorites[2].location;
      }
    }
  }

  res.render("favorites", { location1, location2, location3 });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function favorite(location) {
  // Check the count of favorite locations
  const count = await Location.countDocuments();
  if (count >= 3) {
    // Find the oldest entry and remove it
    const oldest = await Location.findOne().sort({ _id: 1 });
    if (oldest) {
      await Location.deleteOne({ _id: oldest._id });
    }
  }

  // Add new favorite location
  const fav = new Location({ location: location });
  await fav.save();
  
  // Log for debugging
  console.log(`Saved favorite: ${location}`);
}

app.post("/favorite", async (req, res) => {
  console.log(req.body); // Log the entire body to check the received data
  const location = req.body.location;
  if (!location) {
    return res.status(400).send("No location provided.");
  }
  await favorite(location);
  res.send("Location saved as favorite.");
});


