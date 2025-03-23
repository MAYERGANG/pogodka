// service-worker-register.js - Регистрация Service Worker для PWA

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker успешно зарегистрирован с областью видимости:', registration.scope);
            })
            .catch(error => {
                console.error('Ошибка при регистрации ServiceWorker:', error);
            });
    });
}

// Добавляем информацию об установке PWA
let deferredPrompt;
const addBtn = document.createElement('button');
addBtn.classList.add('add-pwa-button');
addBtn.style.display = 'none';
addBtn.textContent = 'Установить приложение';
document.body.appendChild(addBtn);

window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем стандартное окно установки
    e.preventDefault();
    // Сохраняем событие для использования позже
    deferredPrompt = e;
    // Показываем нашу кнопку установки
    addBtn.style.display = 'block';
    
    // Обработчик клика на кнопку установки
    addBtn.addEventListener('click', (e) => {
        // Скрываем кнопку установки
        addBtn.style.display = 'none';
        // Показываем диалог установки
        deferredPrompt.prompt();
        // Ожидаем ответа пользователя
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Пользователь установил PWA');
                // Показываем уведомление об успешной установке
                if (window.showNotification) {
                    window.showNotification('Успех', 'Приложение успешно установлено! Теперь вы можете запускать его с рабочего стола.', 'info');
                }
            } else {
                console.log('Пользователь отклонил установку PWA');
            }
            deferredPrompt = null;
        });
    });
    
    // Добавляем информацию об установке в футер
    const footer = document.querySelector('footer');
    if (footer) {
        const installInfo = document.createElement('div');
        installInfo.classList.add('install-info');
        installInfo.innerHTML = 'Установите приложение на устройство <button id="install-app-btn" class="install-btn">Установить</button>';
        footer.appendChild(installInfo);
        
        document.getElementById('install-app-btn').addEventListener('click', () => {
            addBtn.click();
        });
    }
});

// Стили для кнопки установки
const style = document.createElement('style');
style.textContent = `
    .add-pwa-button {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--button-background);
        color: var(--button-text);
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: var(--card-shadow);
        cursor: pointer;
        z-index: 999;
        display: none;
    }
    
    .install-info {
        margin-top: 10px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .install-btn {
        background: transparent;
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
        border-radius: 5px;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;
    }
    
    .install-btn:hover {
        background: var(--primary-color);
        color: white;
    }
    
    @media (display-mode: standalone) {
        .add-pwa-button, .install-info {
            display: none !important;
        }
    }
`;
document.head.appendChild(style);

// Проверяем обновления приложения
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Предлагаем обновить приложение
        if (window.showNotification) {
            window.showNotification(
                'Обновление доступно', 
                'Доступна новая версия приложения. Перезагрузите страницу для обновления.', 
                'info'
            );
        }
    });
} 