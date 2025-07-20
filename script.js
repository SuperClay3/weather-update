let timezone = null;
let clockInterval = null;
let useFahrenheit = false;

window.addEventListener('load', () => {
  initializeGlobe(0x4a90e2, 0x111111);

  setTimeout(() => {
    document.getElementById("preloader").style.display = "none";
    document.body.style.overflow = "auto";
  }, 1500);
});

/**
 * Initialize VANTA Globe effect
 */
function initializeGlobe(color, backgroundColor) {
  VANTA.GLOBE({
    el: "#globe-background",
    mouseControls: true,
    touchControls: true,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.0,
    scaleMobile: 1.0,
    color: color,
    backgroundColor: backgroundColor
  });
}

/**
 * Toggle dark mode theme
 */
function toggleTheme() {
  document.body.classList.toggle("dark");
}

/**
 * Toggle between Celsius and Fahrenheit
 */
function toggleUnits() {
  useFahrenheit = document.getElementById("unitToggle").checked;
  getWeather(); // refresh weather with new unit
}

/**
 * Get timezone by city name (basic mapping for PH)
 */
function getTimeZoneByCity(city) {
  const map = {
    'manila': 'Asia/Manila', 'bacoor': 'Asia/Manila', 'cavite': 'Asia/Manila',
    'laguna': 'Asia/Manila', 'quezon city': 'Asia/Manila', 'cebu': 'Asia/Manila',
    'davao': 'Asia/Manila'
  };
  return map[city.toLowerCase()] || null;
}

/**
 * Start the real-time clock for given timezone
 */
function startClock(timezone) {
  const el = document.getElementById("localDateTime");
  if (clockInterval) clearInterval(clockInterval);

  clockInterval = setInterval(() => {
    const now = new Date();
    const optionsDate = { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    el.textContent = `${new Intl.DateTimeFormat('en-US', optionsDate).format(now)}, ${new Intl.DateTimeFormat('en-US', optionsTime).format(now)}`;
  }, 1000);
}

/**
 * Fetch weather and forecast data from OpenWeatherMap API
 */
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  const apiKey = 'c849722e98dec50e73aae9f6e2547cd8'; // replace with your valid API key
  const loader = document.getElementById('loader');
  const resultBox = document.getElementById('weatherResult');
  const forecastBox = document.getElementById('forecastResult');
  const dateTimeEl = document.getElementById('localDateTime');
  const quoteBox = document.getElementById('quoteBox');

  if (!city) {
    resultBox.innerHTML = '<p>⚠️ Please enter a city name.</p>';
    forecastBox.innerHTML = '';
    dateTimeEl.textContent = '';
    return;
  }

  loader.classList.remove('hidden');
  resultBox.innerHTML = '';
  forecastBox.innerHTML = '';
  dateTimeEl.textContent = '';

  const units = useFahrenheit ? 'imperial' : 'metric';

  try {
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;

    const [currentRes, forecastRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
    const data = await currentRes.json();
    const forecastData = await forecastRes.json();

    loader.classList.add('hidden');

    if (data.cod === 200 && forecastData.cod === "200") {
      timezone = getTimeZoneByCity(city);
      timezone ? startClock(timezone) : (dateTimeEl.textContent = new Date(Date.now() + data.timezone * 1000).toUTCString());

      const tempUnit = useFahrenheit ? '°F' : '°C';

      resultBox.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p><strong>${data.weather[0].main}</strong> - ${data.weather[0].description}</p>
        <p>🌡️ Temperature: ${data.main.temp}${tempUnit}</p>
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>💨 Wind: ${data.wind.speed} ${useFahrenheit ? 'mph' : 'm/s'}</p>
      `;

      const forecastList = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5);
      forecastBox.innerHTML = forecastList.map(day => {
        const date = new Date(day.dt_txt);
        const label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        return `
          <div class="forecast-item">
            <strong>${label}</strong><br/>
            ${day.weather[0].main} - ${day.weather[0].description}<br/>
            🌡️ ${day.main.temp}${tempUnit}, 💧 ${day.main.humidity}%<br/>
            💨 ${day.wind.speed} ${useFahrenheit ? 'mph' : 'm/s'}
          </div>
        `;
      }).join('');

      const quotes = [
        "Rainy days are perfect for a cozy cup of coffee ☕",
        "Don't forget your umbrella ☔",
        "Sunshine is the best medicine ☀️",
        "Windy days mean kite flying fun! 🎏"
      ];
      quoteBox.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    } else {
      resultBox.innerHTML = `<p>❌ City not found. Please try again.</p>`;
      forecastBox.innerHTML = '';
      dateTimeEl.textContent = '';
    }
  } catch (err) {
    loader.classList.add('hidden');
    resultBox.innerHTML = `<p>⚠️ Error fetching data. Try again later.</p>`;
    forecastBox.innerHTML = '';
    console.error(err);
  }
}
