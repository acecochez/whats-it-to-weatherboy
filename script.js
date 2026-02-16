const unitsMenu = document.querySelector ('.units-toggle');
const unitsDropdown = document.querySelector ('.dropdown');

const tempToggle = document.getElementById ('temp-toggle');
const windToggle = document.getElementById ('wind-toggle');
const precipitationToggle = document.getElementById ('precipitation-toggle');

const tempLabel = document.getElementById ('temp-label');
const windLabel = document.getElementById ('wind-label');
const precipitationLabel = document.getElementById ('precipitation-label');

const searchInput = document.getElementById ('search-input');
const searchButton = document.getElementById ('search-button');
const suggestionsContainer = document.getElementById ('suggestions');

const currentFeelsLike = document.getElementById ('current-feels-like');
const currentHumidity = document.getElementById ('current-humidity');
const currentWind = document.getElementById ('current-wind');
const currentPrecipitation = document.getElementById ('current-precipitation');
const todayTemp = document.getElementById ('today-temp');
const todayIcon = document.getElementById ('today-icon');
const todayDescription = document.getElementById ('today-description');
const todayRange = document.getElementById ('today-range');
document.getElementById ('today-forecast-content');
const searchCheckIcon = document.getElementById ('search-check-icon');
const errorModal = document.getElementById ('error-modal');
const weatherboyModal = document.getElementById ('weatherboy-modal');
const logoContent = document.querySelector ('.logo-content');
const retryButton = document.getElementById ('retry-button');
const exampleLocationButtons = document.querySelectorAll ('.example-location');

const hourlyForecastContainer = document.getElementById ('hourly-forecast');
const scrollLeftBtn = document.getElementById ('hourly-scroll-left');
const scrollRightBtn = document.getElementById ('hourly-scroll-right');

const weatherIcons = {
	0: 'sunny',
	1: 'partly-cloudy',
	2: 'partly-cloudy',
	3: 'partly-cloudy',
	45: 'fog',
	48: 'fog',
	51: 'drizzle',
	53: 'drizzle',
	55: 'drizzle',
	61: 'rain',
	63: 'rain',
	65: 'rain',
	71: 'snow',
	73: 'snow',
	75: 'snow',
	80: 'rain',
	81: 'rain',
	82: 'rain',
	95: 'storm',
	default: 'overcast'
};

function getWeatherIcon (code) {
	const name = weatherIcons[code] || weatherIcons.default;
	return `assets/images/weather/icon-${name}.webp`;
}

let currentCoords = null;

function showEmptyState () {
	hourlyForecastContainer.innerHTML = `
		<div class="column is-full has-text-centered">
			<p class="subtitle is-5 has-text-white has-text-weight-normal">Nothing yet!</p>
		</div>
	`;
	hourlyForecastContainer.classList.add ('m-0');
	hourlyForecastContainer.classList.remove ('is-variable', 'is-1');
	hourlyForecastContainer.style.paddingBottom = '';
	currentFeelsLike.textContent = 'Nothing yet!';
	currentHumidity.textContent = 'Dry!';
	currentWind.textContent = 'Icy cold!';
	currentPrecipitation.textContent = 'Don\'t care!';
	scrollLeftBtn.classList.add ('is-hidden');
	scrollRightBtn.classList.add ('is-hidden');
}

// Initialise empty state
showEmptyState ();

async function searchCity (city) {
	try {
		const response = await fetch (`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent (city)}&count=1&language=en&format=json`);
		const data = await response.json ();
		if (data.results && data.results.length > 0) {
			const {latitude, longitude, name, country} = data.results[0];
			currentCoords = {latitude, longitude, name, country};
			console.log (`Found: ${name}, ${country} (${latitude}, ${longitude})`);
			searchCheckIcon.classList.add ('is-active');
			await fetchWeather ();
		} else {
			showError ();
		}
	} catch (error) {
		console.error ('Error searching city:', error);
		showError ();
	}
}

function showError () {
	searchCheckIcon.classList.remove ('is-active');
	errorModal.classList.add ('is-active');
}

function hideError () {
	errorModal.classList.remove ('is-active');
}

retryButton.addEventListener ('click', () => {
	hideError ();
	searchInput.value = '';
	searchInput.focus ();
});

exampleLocationButtons.forEach (btn => {
	btn.addEventListener ('click', () => {
		hideError ();
		searchInput.value = btn.textContent;
		searchCity (btn.textContent).then (_r => {
		});
	});
});

// Logo click to open weatherboy modal
logoContent.addEventListener ('click', () => {
	weatherboyModal.classList.add ('is-active');
});

// Close weatherboy modal
weatherboyModal.querySelector ('.modal-background').addEventListener ('click', () => {
	weatherboyModal.classList.remove ('is-active');
});
weatherboyModal.querySelector ('.modal-close').addEventListener ('click', () => {
	weatherboyModal.classList.remove ('is-active');
});

async function fetchWeather () {
	if (!currentCoords) return;

	const {latitude, longitude} = currentCoords;
	const tempUnit = tempToggle.checked ? 'fahrenheit' : 'celsius';
	const windUnit = windToggle.checked ? 'mph' : 'kmh';
	const precipitationUnit = precipitationToggle.checked ? 'inch' : 'mm';

	const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&precipitation_unit=${precipitationUnit}`;

	try {
		const response = await fetch (url);
		const data = await response.json ();
		displayWeather (data);
	} catch (error) {
		console.error ('Error fetching weather:', error);
	}
}

function displayWeather (data) {
	const current = data.current;
	const currentUnits = data.current_units;

	currentFeelsLike.textContent = `${current.apparent_temperature}${currentUnits.apparent_temperature}`;
	currentHumidity.textContent = `${current.relative_humidity_2m}${currentUnits.relative_humidity_2m}`;
	currentWind.textContent = `${current.wind_speed_10m} ${currentUnits.wind_speed_10m}`;
	currentPrecipitation.textContent = `${current.precipitation} ${currentUnits.precipitation}`;

	// Today's forecast (big)
	const weatherCode = current.weather_code;
	const temp = current.temperature_2m;
	const unit = currentUnits.temperature_2m;

	todayTemp.textContent = `${temp}${unit}`;
	todayIcon.src = getWeatherIcon (weatherCode);
	todayDescription.textContent = weatherIcons[weatherCode] || weatherIcons.default;

	// Display today's high/low
	const maxTemp = data.daily.temperature_2m_max[0];
	const minTemp = data.daily.temperature_2m_min[0];
	todayRange.textContent = `${maxTemp}${unit} / ${minTemp}${unit}`;

	// Hourly forecast (next 24 hours)
	scrollLeftBtn.classList.remove ('is-hidden');
	scrollRightBtn.classList.remove ('is-hidden');
	hourlyForecastContainer.innerHTML = '';
	hourlyForecastContainer.classList.remove ('m-0');
	hourlyForecastContainer.classList.add ('is-variable', 'is-1', 'px-2');
	hourlyForecastContainer.style.paddingBottom = '1rem';
	const now = new Date ();
	const startIndex = data.hourly.time.findIndex (t => new Date (t) >= now);
	const displayIndex = startIndex !== -1 ? startIndex : 0;
	const next24Hours = data.hourly.time.slice (displayIndex, displayIndex + 24);

	next24Hours.forEach ((time, i) => {
		const dateObj = new Date (time);
		const date = dateObj.toLocaleDateString ('en-US', {month: 'short', day: 'numeric'});
		const hour = dateObj.toLocaleTimeString ('en-US', {hour: 'numeric'});
		const temp = data.hourly.temperature_2m[displayIndex + i];
		const unit = data.hourly_units.temperature_2m;
		const weatherCode = data.hourly.weather_code[displayIndex + i];

		const col = document.createElement ('div');
		col.className = 'column is-narrow p-1';
		col.innerHTML = `
			<div class="card forecast-item-card p-2 has-text-centered">
				<p class="is-size-7">${date}</p>
				<p class="is-size-7">${hour}</p>
				<img src="${getWeatherIcon (weatherCode)}" class="weather-icon mb-1" alt="weather">
				<p style="color: var(--almost-pure-white) !important;">${temp}${unit}</p>
			</div>
		`;
		hourlyForecastContainer.appendChild (col);
	});

	// Scroll to start of hourly forecast (current time)
	hourlyForecastContainer.scrollLeft = 0;
	setTimeout (updateScrollButtons, 100);
}

function updateScrollButtons () {
	const maxScroll = hourlyForecastContainer.scrollWidth - hourlyForecastContainer.clientWidth;
	scrollLeftBtn.disabled = hourlyForecastContainer.scrollLeft <= 0;
	scrollRightBtn.disabled = hourlyForecastContainer.scrollLeft >= maxScroll;
}

hourlyForecastContainer.addEventListener ('scroll', updateScrollButtons);

scrollLeftBtn.addEventListener ('click', () => {
	hourlyForecastContainer.scrollBy ({left: -200, behavior: 'smooth'});
});

scrollRightBtn.addEventListener ('click', () => {
	hourlyForecastContainer.scrollBy ({left: 200, behavior: 'smooth'});
});

searchButton.addEventListener ('click', () => {
	const city = searchInput.value.trim ();
	if (city) {
		searchCity (city).then (_r => {
		});
	}
});

searchInput.addEventListener ('keypress', (e) => {
	if (e.key === 'Enter') {
		const city = searchInput.value.trim ();
		if (city) {
			searchCity (city).then (_r => {
			});
			suggestionsContainer.classList.add ('is-hidden');
		}
	}
});

let debounceTimer;
searchInput.addEventListener ('input', () => {
	clearTimeout (debounceTimer);
	const query = searchInput.value.trim ();
	if (query.length < 2) {
		suggestionsContainer.innerHTML = '';
		suggestionsContainer.classList.add ('is-hidden');
		return;
	}

	debounceTimer = setTimeout (async () => {
		try {
			const response = await fetch (`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent (query)}&count=5&language=en&format=json`);
			const data = await response.json ();

			if (data.results && data.results.length > 0) {
				suggestionsContainer.innerHTML = '';
				data.results.forEach (result => {
					const div = document.createElement ('div');
					div.className = 'suggestion-item';

					const subParts = [];
					if (result.admin1) subParts.push (result.admin1);
					subParts.push (result.country);
					const subText = subParts.join (', ');

					div.innerHTML = `
						<img src="assets/images/icons/icon-search.svg" class="location-icon" alt="location">
						<span class="location-main">${result.name}</span>
						<span class="location-sub">${subText}</span>
					`;
					
					div.addEventListener ('click', () => {
						searchInput.value = result.name;
						suggestionsContainer.classList.add ('is-hidden');
						currentCoords = {
							latitude: result.latitude,
							longitude: result.longitude,
							name: result.name,
							country: result.country
						};
						console.log (`Selected: ${result.name}, ${result.country} (${result.latitude}, ${result.longitude})`);
						searchCheckIcon.classList.add ('is-active');
						fetchWeather ();
					});
					suggestionsContainer.appendChild (div);
				});
				suggestionsContainer.classList.remove ('is-hidden');
			} else {
				suggestionsContainer.innerHTML = '';
				suggestionsContainer.classList.add ('is-hidden');
			}
		} catch (error) {
			console.error ('Error fetching suggestions:', error);
		}
	}, 300);
});

document.addEventListener ('click', (e) => {
	if (!searchInput.contains (e.target) && !suggestionsContainer.contains (e.target)) {
		suggestionsContainer.classList.add ('is-hidden');
	}
});

unitsMenu.addEventListener ('click', (e) => {
	e.stopPropagation ();
	unitsDropdown.classList.toggle ('is-hidden');
});

document.addEventListener ('click', (e) => {
	if (!unitsDropdown.classList.contains ('is-hidden') && !unitsDropdown.contains (e.target) && e.target !== unitsMenu) {
		unitsDropdown.classList.add ('is-hidden');
	}
});

tempToggle.addEventListener ('change', () => {
	const isImperial = tempToggle.checked;
	tempLabel.textContent = `Temperature (${isImperial ? '°F' : '°C'})`;
	console.log (`Temperature units switched to: ${isImperial ? 'Fahrenheit' : 'Celsius'}`);
	fetchWeather ().then (_r => {
	});
});

windToggle.addEventListener ('change', () => {
	const isImperial = windToggle.checked;
	windLabel.textContent = `Wind Speed (${isImperial ? 'mph' : 'km/h'})`;
	console.log (`Wind speed units switched to: ${isImperial ? 'mph' : 'km/h'}`);
	fetchWeather ().then (_r => {
	});
});

precipitationToggle.addEventListener ('change', () => {
	const isImperial = precipitationToggle.checked;
	precipitationLabel.textContent = `Precipitation (${isImperial ? 'in' : 'mm'})`;
	console.log (`Precipitation units switched to: ${isImperial ? 'inches' : 'millimeters'}`);
	fetchWeather ().then (_r => {
	});
});