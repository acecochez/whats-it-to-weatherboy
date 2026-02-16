// noinspection JSUnresolvedReference

const elements = {
	exampleLocationButtons: document.querySelectorAll ('.example-location'),
	unitsMenu: document.querySelector ('.units-toggle'),
	unitsDropdown: document.querySelector ('.dropdown'),
	tempToggle: document.getElementById ('temp-toggle'),
	windToggle: document.getElementById ('wind-toggle'),
	precipitationToggle: document.getElementById ('precipitation-toggle'),
	tempLabel: document.getElementById ('temp-label'),
	windLabel: document.getElementById ('wind-label'),
	precipitationLabel: document.getElementById ('precipitation-label'),
	searchInput: document.getElementById ('search-input'),
	suggestionsContainer: document.getElementById ('suggestions'),
	currentFeelsLike: document.getElementById ('current-feels-like'),
	currentHumidity: document.getElementById ('current-humidity'),
	currentWind: document.getElementById ('current-wind'),
	currentPrecipitation: document.getElementById ('current-precipitation'),
	todayTemp: document.getElementById ('today-temp'),
	todayIcon: document.getElementById ('today-icon'),
	todayDescription: document.getElementById ('today-description'),
	todayRange: document.getElementById ('today-range'),
	searchCheckIcon: document.getElementById ('search-check-icon'),
	errorModal: document.getElementById ('error-modal'),
	weatherboyModal: document.getElementById ('weatherboy-modal'),
	logoContent: document.querySelector ('.logo-content'),
	retryButton: document.getElementById ('retry-button'),
	hourlyForecastContainer: document.getElementById ('hourly-forecast'),
	scrollLeftBtn: document.getElementById ('hourly-scroll-left'),
	scrollRightBtn: document.getElementById ('hourly-scroll-right'),
};

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
	elements.hourlyForecastContainer.innerHTML = `
		<div class="column is-full has-text-centered">
			<p class="subtitle is-5 has-text-white has-text-weight-normal">Nothing yet!</p>
		</div>
	`;
	elements.hourlyForecastContainer.classList.add ('m-0');
	elements.hourlyForecastContainer.classList.remove ('is-variable', 'is-1', 'pb-4');
	elements.currentFeelsLike.textContent = 'Nothing yet!';
	elements.currentHumidity.textContent = 'Dry!';
	elements.currentWind.textContent = 'Icy cold!';
	elements.currentPrecipitation.textContent = 'Don\'t care!';
	elements.todayTemp.textContent = '--°';
	elements.todayDescription.textContent = '--';
	elements.todayRange.textContent = '-- / --';
	elements.todayIcon.classList.add ('is-hidden');
	elements.scrollLeftBtn.classList.add ('is-hidden');
	elements.scrollRightBtn.classList.add ('is-hidden');
}

showEmptyState ();

// Weather functionalities using meteo api
async function searchCity (city) {
	try {
		const response = await fetch (`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent (city)}&count=1&language=en&format=json`);
		const data = await response.json ();
		if (data.results && data.results.length > 0) {
			const {
				latitude,
				longitude,
				name,
				country
			} = data.results[0];
			currentCoords = {
				latitude,
				longitude,
				name,
				country
			};
			elements.searchCheckIcon.classList.add ('is-active');
			await fetchWeather ();
		} else {
			showError ();
		}
	} catch (error) {
		console.error ('Error searching city:', error);
		showError ();
	}
}

let debounceTimer;
elements.searchInput.addEventListener ('input', () => {
	clearTimeout (debounceTimer);
	const query = elements.searchInput.value.trim ();
	if (query.length < 2) {
		elements.suggestionsContainer.innerHTML = '';
		elements.suggestionsContainer.classList.add ('is-hidden');
		return;
	}

	debounceTimer = setTimeout (async () => {
		try {
			elements.searchInput.parentElement.classList.add ('is-loading');
			const response = await fetch (`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent (query)}&count=5&language=en&format=json`);
			const data = await response.json ();
			elements.searchInput.parentElement.classList.remove ('is-loading');

			if (data.results && data.results.length > 0) {
				const {
					suggestionsContainer
				} = elements;
				suggestionsContainer.innerHTML = '';
				suggestionsContainer.scrollTop = 0;
				const fragment = document.createDocumentFragment ();

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
						elements.searchInput.value = `${result.name}, ${result.country}`;
						suggestionsContainer.classList.add ('is-hidden');
						currentCoords = {
							latitude: result.latitude,
							longitude: result.longitude,
							name: result.name,
							country: result.country
						};
						elements.searchCheckIcon.classList.add ('is-active');
						fetchWeather ();
					});
					fragment.appendChild (div);
				});
				suggestionsContainer.appendChild (fragment);
				suggestionsContainer.classList.remove ('is-hidden');
			} else {
				elements.suggestionsContainer.innerHTML = '';
				elements.suggestionsContainer.classList.add ('is-hidden');
			}
		} catch (error) {
			elements.searchInput.parentElement.classList.remove ('is-loading');
			console.error ('Error fetching suggestions:', error);
		}
	}, 300);
});

elements.retryButton.addEventListener ('click', () => {
	hideError ();
	elements.searchInput.value = '';
	elements.searchInput.focus ();
});

elements.exampleLocationButtons.forEach (btn => {
	btn.addEventListener ('click', () => {
		hideError ();
		elements.searchInput.value = btn.textContent;
		searchCity (btn.textContent).then (_r => {
		});
	});
});

elements.searchInput.addEventListener ('keypress', (e) => {
	if (e.key === 'Enter') {
		const city = elements.searchInput.value.trim ();
		if (city) {
			searchCity (city).then (_r => {
			});
			elements.suggestionsContainer.classList.add ('is-hidden');
		}
	}
});


async function fetchWeather () {
	if (!currentCoords) return;

	const {
		latitude,
		longitude
	} = currentCoords;
	const tempUnit = elements.tempToggle.checked ? 'fahrenheit' : 'celsius';
	const windUnit = elements.windToggle.checked ? 'mph' : 'kmh';
	const precipitationUnit = elements.precipitationToggle.checked ? 'inch' : 'mm';
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
	const {
		current,
		current_units,
		daily, hourly,
		hourly_units
	} = data;

	elements.currentFeelsLike.textContent = `${current.apparent_temperature}${current_units.apparent_temperature}`;
	elements.currentHumidity.textContent = `${current.relative_humidity_2m}${current_units.relative_humidity_2m}`;
	elements.currentWind.textContent = `${current.wind_speed_10m} ${current_units.wind_speed_10m}`;
	elements.currentPrecipitation.textContent = `${current.precipitation} ${current_units.precipitation}`;

	const weatherCode = current.weather_code;
	const temp = current.temperature_2m;
	const unit = current_units.temperature_2m;

	elements.todayTemp.textContent = `${temp}${unit}`;
	elements.todayIcon.src = getWeatherIcon (weatherCode);
	elements.todayIcon.classList.remove ('is-hidden');
	elements.todayDescription.textContent = weatherIcons[weatherCode] || weatherIcons.default;
	elements.todayDescription.classList.add ('is-capitalized');

	const maxTemp = daily.temperature_2m_max[0];
	const minTemp = daily.temperature_2m_min[0];
	elements.todayRange.textContent = `${maxTemp}${unit} / ${minTemp}${unit}`;

	elements.scrollLeftBtn.classList.remove ('is-hidden');
	elements.scrollRightBtn.classList.remove ('is-hidden');

	const {
		hourlyForecastContainer
	} = elements;
	hourlyForecastContainer.innerHTML = '';
	hourlyForecastContainer.classList.remove ('m-0');
	hourlyForecastContainer.classList.add ('is-variable', 'is-1', 'px-2', 'pb-4');

	const now = new Date ();
	const startIndex = hourly.time.findIndex (t => new Date (t) >= now);
	const displayIndex = startIndex !== -1 ? startIndex : 0;
	const next24Hours = hourly.time.slice (displayIndex, displayIndex + 24);

	const fragment = document.createDocumentFragment ();
	const hourlyUnit = hourly_units.temperature_2m;

	next24Hours.forEach ((time, i) => {
		const dateObj = new Date (time);
		const date = dateObj.toLocaleDateString ('en-US', {
			month: 'short',
			day: 'numeric'
		});
		const hour = dateObj.toLocaleTimeString ('en-US', {
			hour: 'numeric'
		});
		const temp = hourly.temperature_2m[displayIndex + i];
		const weatherCode = hourly.weather_code[displayIndex + i];

		const col = document.createElement ('div');
		col.className = 'column is-narrow p-1';
		col.innerHTML = `
			<div class="card forecast-item-card p-2 has-text-centered">
				<p class="is-size-7">${date}</p>
				<p class="is-size-7">${hour}</p>
				<img src="${getWeatherIcon (weatherCode)}" class="weather-icon mb-1" alt="weather">
				<p class="forecast-temp">${temp}${hourlyUnit}</p>
			</div>
		`;
		fragment.appendChild (col);
	});
	hourlyForecastContainer.appendChild (fragment);

	hourlyForecastContainer.scrollLeft = 0;
	setTimeout (updateScrollButtons, 100);
}

function updateScrollButtons () {
	const {
		hourlyForecastContainer,
		scrollLeftBtn,
		scrollRightBtn
	} = elements;
	const maxScroll = hourlyForecastContainer.scrollWidth - hourlyForecastContainer.clientWidth;
	scrollLeftBtn.disabled = hourlyForecastContainer.scrollLeft <= 0;
	scrollRightBtn.disabled = hourlyForecastContainer.scrollLeft >= maxScroll;
}

elements.hourlyForecastContainer.addEventListener ('scroll', updateScrollButtons);

elements.scrollLeftBtn.addEventListener ('click', () => {
	elements.hourlyForecastContainer.scrollBy ({
		left: -200,
		behavior: 'smooth'
	});
});

elements.scrollRightBtn.addEventListener ('click', () => {
	elements.hourlyForecastContainer.scrollBy ({
		left: 200,
		behavior: 'smooth'
	});
});

// Errors

function showError () {
	elements.searchCheckIcon.classList.remove ('is-active');
	elements.errorModal.classList.add ('is-active');
}

function hideError () {
	elements.errorModal.classList.remove ('is-active');
}

document.addEventListener ('click', (e) => {
	if (!elements.searchInput.contains (e.target) && !elements.suggestionsContainer.contains (e.target)) {
		elements.suggestionsContainer.classList.add ('is-hidden');
	}
});

// Units functionalities
elements.unitsMenu.addEventListener ('click', (e) => {
	e.stopPropagation ();
	elements.unitsDropdown.classList.toggle ('is-hidden');
});

document.addEventListener ('click', (e) => {
	if (!elements.unitsDropdown.classList.contains ('is-hidden') && !elements.unitsDropdown.contains (e.target) && e.target !== elements.unitsMenu) {
		elements.unitsDropdown.classList.add ('is-hidden');
	}
});

function handleUnitChange (toggle, label, type) {
	const isImperial = toggle.checked;
	let unitText = '';
	let typeText = '';

	if (type === 'temp') {
		unitText = isImperial ? '°F' : '°C';
		typeText = 'Temperature';
	} else if (type === 'wind') {
		unitText = isImperial ? 'mph' : 'km/h';
		typeText = 'Wind speed';
	} else if (type === 'precipitation') {
		unitText = isImperial ? 'in' : 'mm';
		typeText = 'Precipitation';
	}

	label.textContent = `${typeText} (${unitText})`;
	fetchWeather ().then (_r => {
	});
}

// Logo functionalities
elements.logoContent.addEventListener ('click', () => {
	elements.weatherboyModal.classList.add ('is-active');
});
elements.weatherboyModal.querySelector ('.modal-background').addEventListener ('click', () => {
	elements.weatherboyModal.classList.remove ('is-active');
});
elements.weatherboyModal.querySelector ('.modal-close').addEventListener ('click', () => {
	elements.weatherboyModal.classList.remove ('is-active');
});

elements.tempToggle.addEventListener ('change',
	() => handleUnitChange (elements.tempToggle, elements.tempLabel, 'temp'));
elements.windToggle.addEventListener ('change',
	() => handleUnitChange (elements.windToggle, elements.windLabel, 'wind'));
elements.precipitationToggle.addEventListener ('change',
	() => handleUnitChange (elements.precipitationToggle, elements.precipitationLabel, 'precipitation'));