document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    const searchForm = document.getElementById('search-form');
    const cityInput = document.getElementById('city-input');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const weatherDisplay = document.getElementById('weather-display');
    const currentDateElement = document.getElementById('current-date');
    const geolocationButton = document.getElementById('geolocation-button');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    
    // Элементы для отображения погоды
    const cityNameElement = document.getElementById('city-name');
    const weatherIconElement = document.getElementById('weather-icon');
    const temperatureElement = document.getElementById('temperature');
    const weatherDescriptionElement = document.getElementById('weather-description');
    const feelsLikeElement = document.getElementById('feels-like');
    const humidityElement = document.getElementById('humidity');
    const pressureElement = document.getElementById('pressure');
    const windElement = document.getElementById('wind');
    const tempMinElement = document.getElementById('temp-min');
    const tempMaxElement = document.getElementById('temp-max');
    const sunriseElement = document.getElementById('sunrise');
    const sunsetElement = document.getElementById('sunset');
    
    // API ключ для OpenWeatherMap 
    const API_KEY = 'c129f2bd8c1a2694ace3c6273af63813';
    
    // CORS-прокси для обхода ограничений при запросе с локального файла
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    
    // Проверяем сохраненную тему
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // При загрузке страницы запрашиваем погоду для Москвы
    fetchWeather('Москва');
    
    // Устанавливаем текущую дату
    setCurrentDate();
    
    // Обработчик отправки формы поиска
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });
    
    // Обработчик для кнопки геолокации
    geolocationButton.addEventListener('click', function() {
        if (navigator.geolocation) {
            loadingElement.style.display = 'block';
            errorElement.style.display = 'none';
            weatherDisplay.style.display = 'none';
            
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            }, () => {
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
                errorElement.textContent = 'Не удалось получить ваше местоположение. Проверьте настройки разрешений.';
            });
        } else {
            errorElement.style.display = 'block';
            errorElement.textContent = 'Геолокация не поддерживается вашим браузером.';
        }
    });
    
    // Обработчик для кнопки переключения темы
    themeToggleButton.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcon(newTheme);
    });
    
    // Функция для получения погоды по координатам
    function fetchWeatherByCoords(lat, lon) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    return fetch(CORS_PROXY + apiUrl);
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось получить данные о погоде');
                }
                return response.json();
            })
            .then(data => {
                console.log('Получены данные по координатам:', data);
                loadingElement.style.display = 'none';
                displayWeather(data);
                cityInput.value = data.name;
            })
            .catch(error => {
                console.error('Ошибка:', error);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
                errorElement.textContent = 'Не удалось загрузить данные о погоде для вашего местоположения.';
            });
    }
    
    // Функция для установки текущей даты
    function setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('ru-RU', options);
    }
    
    // Функция для получения данных о погоде
    function fetchWeather(city) {
        // Показываем загрузку, скрываем ошибку и результаты
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        weatherDisplay.style.display = 'none';
        
        // URL для запроса через прокси или напрямую
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=ru`;
        
        // Пробуем получить данные напрямую, если не получится - через прокси
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    // Если не получилось напрямую, пробуем через прокси
                    return fetch(CORS_PROXY + apiUrl);
                }
                return response;
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Город не найден или проблема с API');
                }
                return response.json();
            })
            .then(data => {
                console.log('Получены данные:', data);
                // Скрываем загрузку
                loadingElement.style.display = 'none';
                
                // Отображаем данные о погоде
                displayWeather(data);
                
                // Сохраняем город в поле ввода
                cityInput.value = city;
            })
            .catch(error => {
                console.error('Ошибка API:', error);
                
                // Показываем ошибку
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
                errorElement.textContent = 'Не удалось загрузить данные о погоде. Проверьте название города и подключение к интернету.';
            });
    }
    
    // Функция для отображения данных о погоде
    function displayWeather(data) {
        // Распаковываем данные
        const { name, main, weather, wind, sys } = data;
        
        // Заполняем элементы данными
        cityNameElement.textContent = `${name}, ${sys.country}`;
        weatherIconElement.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
        weatherIconElement.alt = weather[0].description;
        temperatureElement.textContent = `${Math.round(main.temp)}°C`;
        weatherDescriptionElement.textContent = weather[0].description;
        feelsLikeElement.textContent = `${Math.round(main.feels_like)}°C`;
        humidityElement.textContent = `${main.humidity}%`;
        pressureElement.textContent = `${Math.round(main.pressure * 0.75)} мм рт.ст.`;
        windElement.textContent = `${Math.round(wind.speed)} м/с`;
        tempMinElement.textContent = `${Math.round(main.temp_min)}°C`;
        tempMaxElement.textContent = `${Math.round(main.temp_max)}°C`;
        
        // Форматируем время восхода и заката
        sunriseElement.textContent = formatTime(sys.sunrise);
        sunsetElement.textContent = formatTime(sys.sunset);
        
        // Показываем блок с данными о погоде
        weatherDisplay.style.display = 'block';
    }
    
    // Функция для форматирования времени из Unix timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggleButton.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
}); 