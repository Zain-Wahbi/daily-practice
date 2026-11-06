// ---------- Config ----------
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const DEBOUNCE_MS = 400;
const MIN_CHARS = 2;

// ---------- Elements ----------
const input = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const suggestionsEl = document.getElementById("suggestions");
const resultEl = document.getElementById("result");

// ---------- State ----------
let debounceTimer;
let currentCities = [];
let latestSearchId = 0;
let latestWeatherId = 0;

// ---------- Custom error ----------
class NetworkError extends Error {}

// ---------- Data layer (never touches the DOM) ----------
async function fetchJson(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    // fetch itself failed: no internet, DNS problem, blocked...
    throw new NetworkError("Network request failed");
  }

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

async function searchCities(query) {
  const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=5`;
  const data = await fetchJson(url);
  return data.results ?? [];
}

async function getWeather(city) {
  const url =
    `${FORECAST_URL}?latitude=${city.latitude}&longitude=${city.longitude}` +
    `&current=temperature_2m,wind_speed_10m`;
  const data = await fetchJson(url);

  return {
    city: city.name,
    country: city.country,
    temperature: data.current.temperature_2m,
    wind: data.current.wind_speed_10m,
    units: data.current_units,
  };
}

// ---------- UI layer ----------
function clearSuggestions() {
  currentCities = [];
  suggestionsEl.replaceChildren();
}

function showSuggestions(cities) {
  currentCities = cities;

  const items = cities.map(function (city, index) {
    const li = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.dataset.index = index;
    button.textContent = [city.name, city.admin1, city.country]
      .filter(Boolean)
      .join(", ");

    li.append(button);
    return li;
  });

  suggestionsEl.replaceChildren(...items);
}

function showWeather(weather) {
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
  resultEl.replaceChildren(card);
}

function showError(error) {
  console.error(error);

  if (error instanceof NetworkError) {
    statusEl.textContent = "Network error. Check your internet connection.";
  } else {
    statusEl.textContent = "Something went wrong. Please try again.";
  }
}

// ---------- Handlers ----------
async function handleSearch(query) {
  const searchId = ++latestSearchId;
  statusEl.textContent = "Searching...";

  try {
    const cities = await searchCities(query);

    if (searchId !== latestSearchId) return; // a newer search exists: ignore this one

    if (cities.length === 0) {
      clearSuggestions();
      statusEl.textContent = "No cities found. Try another name.";
      return;
    }

    statusEl.textContent = "";
    showSuggestions(cities);
  } catch (error) {
    if (searchId !== latestSearchId) return;
    clearSuggestions();
    showError(error);
  }
}

async function handleCitySelect(city) {
  const weatherId = ++latestWeatherId;
  statusEl.textContent = "Loading weather...";
  resultEl.replaceChildren();

  try {
    const weather = await getWeather(city);

    if (weatherId !== latestWeatherId) return;

    statusEl.textContent = "";
    showWeather(weather);
  } catch (error) {
    if (weatherId !== latestWeatherId) return;
    showError(error);
  }
}

// ---------- Events ----------
input.addEventListener("input", function () {
  clearTimeout(debounceTimer);

  const query = input.value.trim();

  if (query.length < MIN_CHARS) {
    latestSearchId++; // invalidate any search still in flight
    clearSuggestions();
    statusEl.textContent = "";
    return;
  }

  debounceTimer = setTimeout(function () {
    handleSearch(query);
  }, DEBOUNCE_MS);
});

// One listener on the <ul> (event delegation, same idea as Day 1)
suggestionsEl.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;

  const city = currentCities[Number(button.dataset.index)];
  if (!city) return;

  latestSearchId++; // ignore any search that is still loading
  input.value = city.name;
  clearSuggestions();
  handleCitySelect(city);
});     