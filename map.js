// map.js - Модуль для работы с интерактивной картой погоды

document.addEventListener('DOMContentLoaded', () => {
    // API ключ берем из основного скрипта
    const API_KEY = document.querySelector('script[src="script.js"]') ? 'c129f2bd8c1a2694ace3c6273af63813' : '';
    
    // Карта и слои
    let map = null;
    let temperatureLayer = null;
    let precipitationLayer = null;
    let windLayer = null;
    let cloudsLayer = null;
    let mapMarker = null;
    
    // DOM элементы для контролов карты
    const showTemperatureBtn = document.getElementById('show-temperature');
    const showPrecipitationBtn = document.getElementById('show-precipitation');
    const showWindBtn = document.getElementById('show-wind');
    const showCloudsBtn = document.getElementById('show-clouds');
    
    /**
     * Инициализирует погодную карту
     * @param {number} lat - Широта исходной позиции
     * @param {number} lon - Долгота исходной позиции
     */
    window.initMap = function(lat, lon) {
        // Если карта уже создана, обновляем центр и маркер
        if (map) {
            map.setView([lat, lon], 10);
            updateMapMarker(lat, lon);
            return;
        }
        
        // Создаем карту
        map = L.map('weather-map').setView([lat, lon], 10);
        
        // Добавляем базовый слой OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Создаем маркер текущего местоположения
        createMapMarker(lat, lon);
        
        // Погодные слои OpenWeatherMap
        temperatureLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
            attribution: '&copy; OpenWeatherMap',
            maxZoom: 19
        });
        
        precipitationLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
            attribution: '&copy; OpenWeatherMap',
            maxZoom: 19
        });
        
        windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
            attribution: '&copy; OpenWeatherMap',
            maxZoom: 19
        });
        
        cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
            attribution: '&copy; OpenWeatherMap',
            maxZoom: 19
        });
        
        // По умолчанию показываем температуру
        temperatureLayer.addTo(map);
        activateMapControl(showTemperatureBtn);
        
        // Обработчики событий для кнопок управления слоями
        setupMapControls();
        
        // Обработка кликов по карте
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lon = e.latlng.lng;
            
            // Обновляем маркер
            updateMapMarker(lat, lon);
            
            // Получаем погоду для выбранной точки
            window.fetchWeatherByCoords(lat, lon);
        });
        
        // Обновляем размер карты после рендеринга таба
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    };
    
    /**
     * Создает маркер на карте
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     */
    function createMapMarker(lat, lon) {
        const markerIcon = L.divIcon({
            className: 'custom-map-marker',
            html: '<i class="fas fa-map-marker-alt"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        mapMarker = L.marker([lat, lon], { icon: markerIcon }).addTo(map);
    }
    
    /**
     * Обновляет позицию маркера
     * @param {number} lat - Широта
     * @param {number} lon - Долгота
     */
    function updateMapMarker(lat, lon) {
        if (mapMarker) {
            mapMarker.setLatLng([lat, lon]);
        } else {
            createMapMarker(lat, lon);
        }
    }
    
    /**
     * Настраивает контролы для переключения слоев карты
     */
    function setupMapControls() {
        showTemperatureBtn.addEventListener('click', function() {
            map.removeLayer(precipitationLayer);
            map.removeLayer(windLayer);
            map.removeLayer(cloudsLayer);
            map.addLayer(temperatureLayer);
            
            activateMapControl(this);
        });
        
        showPrecipitationBtn.addEventListener('click', function() {
            map.removeLayer(temperatureLayer);
            map.removeLayer(windLayer);
            map.removeLayer(cloudsLayer);
            map.addLayer(precipitationLayer);
            
            activateMapControl(this);
        });
        
        showWindBtn.addEventListener('click', function() {
            map.removeLayer(temperatureLayer);
            map.removeLayer(precipitationLayer);
            map.removeLayer(cloudsLayer);
            map.addLayer(windLayer);
            
            activateMapControl(this);
        });
        
        showCloudsBtn.addEventListener('click', function() {
            map.removeLayer(temperatureLayer);
            map.removeLayer(precipitationLayer);
            map.removeLayer(windLayer);
            map.addLayer(cloudsLayer);
            
            activateMapControl(this);
        });
    }
    
    /**
     * Активирует выбранный контрол карты и деактивирует остальные
     * @param {HTMLElement} activeControl - Активный контрол
     */
    function activateMapControl(activeControl) {
        const controls = [showTemperatureBtn, showPrecipitationBtn, showWindBtn, showCloudsBtn];
        
        controls.forEach(control => {
            control.classList.remove('active');
        });
        
        activeControl.classList.add('active');
    }
}); 