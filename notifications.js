// notifications.js - Модуль для работы с уведомлениями о погоде

document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    const notificationSettingsBtn = document.getElementById('notification-settings-btn');
    const notificationSettingsModal = document.getElementById('notification-settings-modal');
    const saveNotificationSettings = document.getElementById('save-notification-settings');
    
    // Настройки уведомлений
    let notificationSettings = {
        extremeTemp: false,
        rain: false,
        wind: false,
        airQuality: false
    };
    
    // Инициализация модуля
    init();
    
    /**
     * Инициализирует модуль уведомлений
     */
    function init() {
        // Загружаем настройки уведомлений из localStorage
        loadNotificationSettings();
        
        // Добавляем обработчики событий
        setupEventListeners();
    }
    
    /**
     * Настраивает обработчики событий для элементов уведомлений
     */
    function setupEventListeners() {
        // Закрытие уведомления
        notificationClose.addEventListener('click', () => {
            notificationContainer.style.display = 'none';
        });
        
        // Открытие модального окна настроек
        notificationSettingsBtn.addEventListener('click', () => {
            notificationSettingsModal.style.display = 'block';
        });
        
        // Закрытие модального окна настроек
        notificationSettingsModal.querySelector('.close').addEventListener('click', () => {
            notificationSettingsModal.style.display = 'none';
        });
        
        // Сохранение настроек уведомлений
        saveNotificationSettings.addEventListener('click', () => {
            notificationSettings = {
                extremeTemp: document.getElementById('notify-extreme-temp').checked,
                rain: document.getElementById('notify-rain').checked,
                wind: document.getElementById('notify-wind').checked,
                airQuality: document.getElementById('notify-air-quality').checked
            };
            
            saveNotificationSettings();
            notificationSettingsModal.style.display = 'none';
            window.showNotification('Успех', 'Настройки уведомлений сохранены', 'info');
        });
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (event) => {
            if (event.target === notificationSettingsModal) {
                notificationSettingsModal.style.display = 'none';
            }
        });
        
        // Закрытие уведомления по Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (notificationSettingsModal.style.display === 'block') {
                    notificationSettingsModal.style.display = 'none';
                } else if (notificationContainer.style.display === 'block') {
                    notificationContainer.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Загружает настройки уведомлений из localStorage
     */
    function loadNotificationSettings() {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            notificationSettings = JSON.parse(savedSettings);
            
            // Устанавливаем значения чекбоксов
            document.getElementById('notify-extreme-temp').checked = notificationSettings.extremeTemp;
            document.getElementById('notify-rain').checked = notificationSettings.rain;
            document.getElementById('notify-wind').checked = notificationSettings.wind;
            document.getElementById('notify-air-quality').checked = notificationSettings.airQuality;
        }
    }
    
    /**
     * Сохраняет настройки уведомлений в localStorage
     */
    function saveNotificationSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    }
    
    /**
     * Проверяет погодные условия и отображает уведомления при необходимости
     * @param {Object} weatherData - Данные о погоде
     */
    window.checkWeatherAlerts = function(weatherData) {
        if (!weatherData) return;
        
        // Проверка экстремальных температур
        if (notificationSettings.extremeTemp) {
            const temp = weatherData.main.temp;
            if (temp > 30) {
                window.showNotification('Высокая температура', 'Температура выше 30°C. Избегайте прямых солнечных лучей и пейте больше воды.', 'warning');
            } else if (temp < -10) {
                window.showNotification('Низкая температура', 'Температура ниже -10°C. Одевайтесь теплее и ограничьте время пребывания на улице.', 'warning');
            }
        }
        
        // Проверка на дождь
        if (notificationSettings.rain && weatherData.weather && weatherData.weather[0]) {
            const weatherMain = weatherData.weather[0].main.toLowerCase();
            if (weatherMain === 'rain' || weatherMain === 'drizzle' || weatherMain === 'thunderstorm') {
                window.showNotification('Осадки', `Ожидается ${weatherData.weather[0].description}. Не забудьте взять зонт!`, 'info');
            } else if (weatherMain === 'snow') {
                window.showNotification('Снег', 'Ожидается снег. Одевайтесь теплее!', 'info');
            }
        }
        
        // Проверка сильного ветра
        if (notificationSettings.wind && weatherData.wind && weatherData.wind.speed > 10) {
            window.showNotification('Сильный ветер', 'Скорость ветра превышает 10 м/с. Будьте осторожны на улице.', 'warning');
        }
    };
    
    /**
     * Отображает уведомление
     * @param {string} title - Заголовок уведомления
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип уведомления ('info', 'warning', 'error')
     */
    window.showNotification = function(title, message, type = 'info') {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // Удаляем все классы типов
        notification.classList.remove('info', 'warning', 'error');
        // Добавляем соответствующий класс
        notification.classList.add(type);
        
        // Показываем уведомление
        notificationContainer.style.display = 'block';
        
        // Добавляем анимацию появления
        notification.classList.add('notification-show');
        
        // Автоматически скрываем через 5 секунд, если это не ошибка
        if (type !== 'error') {
            setTimeout(() => {
                notification.classList.remove('notification-show');
                notification.classList.add('notification-hide');
                
                setTimeout(() => {
                    notificationContainer.style.display = 'none';
                    notification.classList.remove('notification-hide');
                }, 500);
            }, 5000);
        }
    };
    
    // Добавляем стили для анимации уведомлений
    const style = document.createElement('style');
    style.textContent = `
        .notification-show {
            animation: slideIn 0.5s ease forwards;
        }
        
        .notification-hide {
            animation: slideOut 0.5s ease forwards;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}); 