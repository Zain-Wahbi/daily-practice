// 1. Check HTTP responses and convert them to JSON
function checkResponse(response) {
  if (!response.ok) {
    throw new Error("HTTP error: " + response.status);
  }

  return response.json();
}

// 2. Fetch city coordinates, then fetch its weather
function getWeather(cityName) {
  const geoUrl =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5`;

  return fetch(geoUrl)
    .then(checkResponse)
    .then(function (data) {
      if (!data.results || data.results.length === 0) {
        throw new Error("No results found for this city");
      }

      const city = data.results[0];

      const forecastUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,wind_speed_10m`;

      return fetch(forecastUrl)
        .then(checkResponse)
        .then(function (weatherData) {
          return {
            city: city.name,
            country: city.country,
            temperature: weatherData.current.temperature_2m,
            wind: weatherData.current.wind_speed_10m,
            units: weatherData.current_units
          };
        });
    });
}

// 3. Get HTML elements
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const button = document.getElementById("search-btn");
const status = document.getElementById("status");
const result = document.getElementById("result");

// 4. Handle form submission
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = input.value.trim();

  if (!name) {
    status.textContent = "Please enter a city name.";
    result.replaceChildren();
    return;
  }

  status.textContent = "Loading...";
  button.disabled = true;
  result.replaceChildren();

  getWeather(name)
    .then(showWeather)
    .catch(showError)
    .finally(function () {
      button.disabled = false;
    });
});

// 5. Display weather data
function showWeather(weather) {
  status.textContent = "";

  const card = document.createElement("article");
  const title = document.createElement("h2");
  const temperature = document.createElement("p");
  const wind = document.createElement("p");

  title.textContent = `${weather.city}, ${weather.country}`;

  temperature.textContent =
    `Temperature: ${weather.temperature} ${weather.units.temperature_2m}`;

  wind.textContent =
    `Wind: ${weather.wind} ${weather.units.wind_speed_10m}`;

  card.append(title, temperature, wind);
  result.replaceChildren(card);
}

// 6. Display friendly error messages
function showError(error) {
  console.error(error);

  if (error.message === "No results found for this city") {
    status.textContent =
      "City not found. Please try another name.";
  } else if (error instanceof TypeError) {
    status.textContent =
      "Network error. Check your internet connection.";
  } else {
    status.textContent =
      "Something went wrong. Please try again.";
  }
}
