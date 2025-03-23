// forecast.js - Модуль для обработки прогноза погоды на несколько дней

document.addEventListener('DOMContentLoaded', () => {
    // API ключ берем из основного скрипта
    const API_KEY = document.querySelector('script[src="script.js"]') ? 'c129f2bd8c1a2694ace3c6273af63813' : '';
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    
    // DOM элементы
    const forecastContainer = document.getElementById('forecast-days-container');
    const temperatureChartCanvas = document.getElementById('temperature-chart');
    
    /**
     * Загружает данные прогноза погоды на 5 дней
     * @param {string} city - Название города
     */
    window.fetchForecast = async function(city) {
        try {
            // Получаем координаты города
            const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
            
            if (!geoResponse.ok) {
                throw new Error(`Ошибка получения координат: ${geoResponse.status}`);
            }
            
            const geoData = await geoResponse.json();
            
            if (!geoData.length) {
                throw new Error('Город не найден');
            }
            
            const { lat, lon } = geoData[0];
            
            // Получаем прогноз погоды
            return fetchForecastByCoords(lat, lon);
            
        } catch (error) {
            console.error('Ошибка при загрузке прогноза погоды:', error);
            
            try {
                // Пробуем через прокси
                const proxyGeoResponse = await fetch(`${CORS_PROXY}https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`);
                
                if (!proxyGeoResponse.ok) {
                    throw new Error(`Ошибка получения координат через прокси: ${proxyGeoResponse.status}`);
                }
                
                const geoData = await proxyGeoResponse.json();
                
                if (!geoData.length) {
                    throw new Error('Город не найден');
                }
                
                const { lat, lon } = geoData[0];
                
                // Получаем прогноз погоды через прокси
                return fetchForecastByCordsWithProxy(lat, lon);
                
            } catch (proxyError) {
                console.error('Ошибка при использовании прокси для прогноза погоды:', proxyError);
                return null;
            }
        }
    };
    
    /**
     * Загружает данные прогноза погоды по координатам
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     */
    window.fetchForecastByCoords = async function(lat, lon) {
        try {
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`);
            
            if (!forecastResponse.ok) {
                throw new Error(`Ошибка получения прогноза: ${forecastResponse.status}`);
            }
            
            const forecastData = await forecastResponse.json();
            processForecastData(forecastData);
            return forecastData;
            
        } catch (error) {
            console.error('Ошибка при загрузке прогноза погоды по координатам:', error);
            return null;
        }
    };
    
    /**
     * Загружает данные прогноза погоды по координатам через прокси
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     */
    async function fetchForecastByCordsWithProxy(lat, lon) {
        try {
            const forecastResponse = await fetch(`${CORS_PROXY}https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`);
            
            if (!forecastResponse.ok) {
                throw new Error(`Ошибка получения прогноза через прокси: ${forecastResponse.status}`);
            }
            
            const forecastData = await forecastResponse.json();
            processForecastData(forecastData);
            return forecastData;
            
        } catch (error) {
            console.error('Ошибка при загрузке прогноза погоды через прокси:', error);
            return null;
        }
    }
    
    /**
     * Обрабатывает данные прогноза и отображает их
     * @param {Object} forecastData - Данные прогноза погоды
     */
    function processForecastData(forecastData) {
        if (!forecastData || !forecastData.list) {
            console.error('Некорректные данные прогноза');
            return;
        }
        
        // Группируем прогноз по дням
        const dailyForecasts = groupForecastsByDay(forecastData.list);
        
        // Очищаем контейнер для прогноза
        forecastContainer.innerHTML = '';
        
        // Данные для графика
        const dates = [];
        const minTemps = [];
        const maxTemps = [];
        
        // Создаем элементы для каждого дня
        Object.entries(dailyForecasts).slice(0, 5).forEach(([dateStr, forecasts]) => {
            const date = new Date(dateStr);
            const dayName = getDayName(date);
            const formattedDate = formatDate(date);
            
            // Находим мин и макс температуру для дня
            const temps = forecasts.map(f => f.main.temp);
            const minTemp = Math.round(Math.min(...temps));
            const maxTemp = Math.round(Math.max(...temps));
            
            // Берем погодные условия на середину дня или первые доступные
            const midDayForecast = forecasts.find(f => {
                const hour = new Date(f.dt * 1000).getHours();
                return hour >= 12 && hour <= 15;
            }) || forecasts[0];
            
            const icon = midDayForecast.weather[0].icon;
            const description = midDayForecast.weather[0].description;
            
            // Создаем элемент дня
            const dayElement = document.createElement('div');
            dayElement.className = 'forecast-day';
            dayElement.innerHTML = `
                <div class="forecast-date">${dayName} ${formattedDate}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="forecast-icon">
                <div>
                    <span class="forecast-temp-high">${maxTemp}°C</span>
                    <span class="forecast-temp-low">${minTemp}°C</span>
                </div>
                <div class="forecast-description">${description}</div>
                <div class="forecast-details">
                    <div><i class="fas fa-tint"></i> ${Math.round(midDayForecast.main.humidity)}%</div>
                    <div><i class="fas fa-wind"></i> ${midDayForecast.wind.speed} м/с</div>
                </div>
            `;
            
            forecastContainer.appendChild(dayElement);
            
            // Добавляем данные для графика
            dates.push(dayName);
            minTemps.push(minTemp);
            maxTemps.push(maxTemp);
        });
        
        // Создаем график температуры
        createTemperatureChart(dates, minTemps, maxTemps);
    }
    
    /**
     * Группирует прогнозы по дням
     * @param {Array} forecastList - Список прогнозов
     * @returns {Object} Прогнозы, сгруппированные по дням
     */
    function groupForecastsByDay(forecastList) {
        const dailyForecasts = {};
        
        forecastList.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!dailyForecasts[dateStr]) {
                dailyForecasts[dateStr] = [];
            }
            
            dailyForecasts[dateStr].push(forecast);
        });
        
        return dailyForecasts;
    }
    
    /**
     * Создает график температуры
     * @param {Array} dates - Даты (метки оси X)
     * @param {Array} minTemps - Минимальные температуры
     * @param {Array} maxTemps - Максимальные температуры
     */
    function createTemperatureChart(dates, minTemps, maxTemps) {
        const ctx = temperatureChartCanvas.getContext('2d');
        
        // Удаляем предыдущий график, если он существует
        if (window.temperatureChart instanceof Chart) {
            window.temperatureChart.destroy();
        }
        
        // Определяем цвета на основе текущей темы
        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkTheme ? '#f5f5f5' : '#333';
        const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        window.temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Макс. температура',
                        data: maxTemps,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointBackgroundColor: '#FF9800',
                        fill: true
                    },
                    {
                        label: 'Мин. температура',
                        data: minTemps,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointBackgroundColor: '#2196F3',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                family: 'Nunito'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        titleFont: {
                            family: 'Nunito'
                        },
                        bodyFont: {
                            family: 'Nunito'
                        },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}°C`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Температура (°C)',
                            color: textColor,
                            font: {
                                family: 'Nunito',
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Nunito'
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                family: 'Nunito'
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Возвращает название дня недели
     * @param {Date} date - Дата
     * @returns {string} Название дня недели
     */
    function getDayName(date) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[date.getDay()];
    }
    
    /**
     * Форматирует дату в формате DD.MM
     * @param {Date} date - Дата
     * @returns {string} Отформатированная дата
     */
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}.${month}`;
    }
}); 