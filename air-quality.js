// air-quality.js - Модуль для работы с данными о качестве воздуха

document.addEventListener('DOMContentLoaded', () => {
    // API ключ берем из основного скрипта
    const API_KEY = document.querySelector('script[src="script.js"]') ? 'c129f2bd8c1a2694ace3c6273af63813' : '';
    const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
    
    // DOM элементы для отображения данных о качестве воздуха
    const aqiValue = document.getElementById('aqi-value');
    const aqiCircle = document.getElementById('aqi-circle');
    const aqiLevel = document.querySelector('.aqi-level');
    const aqiAdvice = document.querySelector('.aqi-advice');
    const pm25Element = document.getElementById('pm25');
    const pm10Element = document.getElementById('pm10');
    const no2Element = document.getElementById('no2');
    const so2Element = document.getElementById('so2');
    const o3Element = document.getElementById('o3');
    const coElement = document.getElementById('co');
    
    /**
     * Загружает данные о качестве воздуха по координатам
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     */
    window.fetchAirQuality = async function(lat, lon) {
        try {
            const airQualityResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
            
            if (!airQualityResponse.ok) {
                throw new Error(`Ошибка API качества воздуха: ${airQualityResponse.status}`);
            }
            
            const airQualityData = await airQualityResponse.json();
            
            if (airQualityData.list && airQualityData.list.length > 0) {
                processAirQualityData(airQualityData.list[0]);
                return airQualityData;
            }
            
        } catch (error) {
            console.error('Ошибка при загрузке данных о качестве воздуха:', error);
            
            try {
                // Пробуем через прокси
                const proxyResponse = await fetch(`${CORS_PROXY}https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
                
                if (!proxyResponse.ok) {
                    throw new Error(`Ошибка API качества воздуха через прокси: ${proxyResponse.status}`);
                }
                
                const airQualityData = await proxyResponse.json();
                
                if (airQualityData.list && airQualityData.list.length > 0) {
                    processAirQualityData(airQualityData.list[0]);
                    return airQualityData;
                }
                
            } catch (proxyError) {
                console.error('Ошибка при загрузке данных о качестве воздуха через прокси:', proxyError);
                displayNoAirQualityData();
                return null;
            }
        }
        
        displayNoAirQualityData();
        return null;
    };
    
    /**
     * Обрабатывает данные о качестве воздуха и отображает их
     * @param {Object} data - Данные о качестве воздуха
     */
    function processAirQualityData(data) {
        const aqiIndex = data.main.aqi;
        const components = data.components;
        
        // Заполняем значения компонентов
        pm25Element.textContent = `${components.pm2_5.toFixed(1)} мкг/м³`;
        pm10Element.textContent = `${components.pm10.toFixed(1)} мкг/м³`;
        no2Element.textContent = `${components.no2.toFixed(1)} мкг/м³`;
        so2Element.textContent = `${components.so2.toFixed(1)} мкг/м³`;
        o3Element.textContent = `${components.o3.toFixed(1)} мкг/м³`;
        coElement.textContent = `${components.co.toFixed(1)} мкг/м³`;
        
        // Обновляем индекс качества воздуха
        aqiValue.textContent = aqiIndex;
        
        // Стилизация и описание на основе индекса качества воздуха
        updateAqiInfo(aqiIndex);
        
        // Проверка настроек уведомлений
        const notificationSettings = getNotificationSettings();
        if (notificationSettings.airQuality && aqiIndex >= 4) {
            showAirQualityAlert(aqiIndex);
        }
    }
    
    /**
     * Обновляет визуальную информацию о качестве воздуха на основе индекса
     * @param {number} aqiIndex - Индекс качества воздуха (от 1 до 5)
     */
    function updateAqiInfo(aqiIndex) {
        let aqiColor, aqiText, aqiAdviceText;
        
        switch(aqiIndex) {
            case 1:
                aqiColor = '#4CAF50'; // Зеленый
                aqiText = 'Отличное';
                aqiAdviceText = 'Качество воздуха отличное. Идеально для всех видов активности на свежем воздухе.';
                break;
            case 2:
                aqiColor = '#8BC34A'; // Светло-зеленый
                aqiText = 'Хорошее';
                aqiAdviceText = 'Качество воздуха хорошее. Подходит для всех видов активности на свежем воздухе.';
                break;
            case 3:
                aqiColor = '#FFD54F'; // Желтый
                aqiText = 'Среднее';
                aqiAdviceText = 'Качество воздуха приемлемое. Людям с респираторными заболеваниями следует ограничить длительное пребывание на улице.';
                break;
            case 4:
                aqiColor = '#FF9800'; // Оранжевый
                aqiText = 'Плохое';
                aqiAdviceText = 'Качество воздуха плохое. Людям с респираторными заболеваниями следует ограничить пребывание на улице.';
                break;
            case 5:
                aqiColor = '#F44336'; // Красный
                aqiText = 'Очень плохое';
                aqiAdviceText = 'Качество воздуха очень плохое. Всем следует ограничить пребывание на открытом воздухе.';
                break;
            default:
                aqiColor = '#9E9E9E'; // Серый
                aqiText = 'Нет данных';
                aqiAdviceText = 'Данные о качестве воздуха недоступны.';
        }
        
        // Обновляем визуальные элементы
        aqiCircle.style.background = `conic-gradient(${aqiColor}, var(--primary-color))`;
        aqiLevel.textContent = aqiText;
        aqiAdvice.textContent = aqiAdviceText;
        
        // Добавляем анимацию для визуального эффекта
        aqiCircle.classList.add('pulse');
        setTimeout(() => {
            aqiCircle.classList.remove('pulse');
        }, 1000);
    }
    
    /**
     * Отображает сообщение об отсутствии данных о качестве воздуха
     */
    function displayNoAirQualityData() {
        // Сбрасываем значения на "нет данных"
        aqiValue.textContent = '--';
        aqiLevel.textContent = 'Нет данных';
        aqiAdvice.textContent = 'Данные о качестве воздуха недоступны.';
        aqiCircle.style.background = 'conic-gradient(#9E9E9E, var(--primary-color))';
        
        // Сбрасываем значения компонентов
        pm25Element.textContent = '--';
        pm10Element.textContent = '--';
        no2Element.textContent = '--';
        so2Element.textContent = '--';
        o3Element.textContent = '--';
        coElement.textContent = '--';
    }
    
    /**
     * Показывает уведомление о плохом качестве воздуха
     * @param {number} aqiIndex - Индекс качества воздуха
     */
    function showAirQualityAlert(aqiIndex) {
        let title, message, type;
        
        if (aqiIndex === 4) {
            title = 'Плохое качество воздуха';
            message = 'Людям с респираторными заболеваниями следует ограничить пребывание на улице.';
            type = 'warning';
        } else if (aqiIndex === 5) {
            title = 'Очень плохое качество воздуха';
            message = 'Всем следует ограничить пребывание на открытом воздухе.';
            type = 'error';
        }
        
        // Вызываем глобальную функцию для отображения уведомления
        if (window.showNotification) {
            window.showNotification(title, message, type);
        }
    }
    
    /**
     * Получает настройки уведомлений из localStorage
     * @returns {Object} Настройки уведомлений
     */
    function getNotificationSettings() {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        
        return {
            extremeTemp: false,
            rain: false,
            wind: false,
            airQuality: false
        };
    }
    
    // Добавляем анимацию пульсации для кружка AQI
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.05);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .pulse {
            animation: pulse 1s ease-in-out;
        }
        
        .custom-map-marker {
            color: var(--primary-color);
            font-size: 30px;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
        }
    `;
    document.head.appendChild(style);
}); 