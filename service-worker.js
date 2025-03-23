// service-worker.js - Service Worker для кеширования и оффлайн режима

// Версия кеша - изменяйте при обновлении приложения
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `pogodka-${CACHE_VERSION}`;

// Список ресурсов для кеширования
const ASSETS_TO_CACHE = [
    './',
    './main.html',
    './styles.css',
    './script.js',
    './forecast.js',
    './map.js',
    './air-quality.js',
    './notifications.js',
    './service-worker-register.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    './offline.html',
    './offline-image.png',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Установка Service Worker и кеширование статических ресурсов
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    
    // Принудительная активация нового Service Worker
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('[Service Worker] Cache addAll error: ', error);
            })
    );
});

// Активация Service Worker и удаление старых кешей
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    
    // Удаление старых версий кеша
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Захватить контроль над всеми открытыми вкладками
    return self.clients.claim();
});

// Обработка запросов к сети
self.addEventListener('fetch', (event) => {
    // Пропуск для запросов к API OpenWeatherMap
    if (event.request.url.includes('api.openweathermap.org')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Если ресурс найден в кеше, возвращаем его
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Иначе идем в сеть
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Проверка, получен ли валидный ответ
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Кешируем ответ из сети
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch error:', error);
                        
                        // При ошибке сети для HTML-запросов показываем оффлайн-страницу
                        if (event.request.headers.get('Accept').includes('text/html')) {
                            return caches.match('./offline.html');
                        }
                        
                        // Для запросов изображений возвращаем заглушку
                        if (event.request.url.match(/\.(jpe?g|png|gif|svg|webp)$/)) {
                            return caches.match('./offline-image.png');
                        }
                        
                        // Для остальных типов запросов возвращаем пустой ответ
                        return new Response('', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Фоновая синхронизация для отправки отложенных запросов
self.addEventListener('sync', (event) => {
    if (event.tag === 'weather-sync') {
        event.waitUntil(syncWeatherData());
    }
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received');
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Погодное уведомление', body: event.data.text() };
        }
    }
    
    const title = data.title || 'Погодка от Никитки';
    const options = {
        body: data.body || 'Новое уведомление о погоде',
        icon: './icon-192x192.png',
        badge: './icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            url: data.url || './main.html'
        },
        actions: [
            {
                action: 'explore',
                title: 'Посмотреть',
                icon: './icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: './icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event.notification.tag);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        const urlToOpen = event.notification.data.url || './main.html';
        
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Проверяем, открыто ли приложение
                    for (const client of clientList) {
                        if (client.url.includes('main.html') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Если нет, открываем новое окно
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Функция для синхронизации данных о погоде
async function syncWeatherData() {
    try {
        const dataToSync = await getStoredWeatherRequests();
        if (dataToSync.length === 0) return;
        
        for (const item of dataToSync) {
            try {
                // Выполняем запрос
                await fetch(item.url, item.options);
                // Удаляем из очереди успешно выполненные запросы
                await removeFromQueue(item.id);
            } catch (err) {
                console.error('[Service Worker] Sync error for item:', item, err);
            }
        }
    } catch (err) {
        console.error('[Service Worker] Sync error:', err);
        throw err;
    }
}

// Получение сохраненных запросов из IndexedDB
async function getStoredWeatherRequests() {
    return new Promise((resolve, reject) => {
        const dbName = 'pogodka-offline-requests';
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = (event) => {
            reject('Error opening IndexedDB');
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('requests')) {
                db.createObjectStore('requests', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['requests'], 'readonly');
            const store = transaction.objectStore('requests');
            const getAll = store.getAll();
            
            getAll.onsuccess = () => {
                resolve(getAll.result);
            };
            
            getAll.onerror = () => {
                reject('Error getting stored requests');
            };
        };
    });
}

// Удаление запроса из очереди
async function removeFromQueue(id) {
    return new Promise((resolve, reject) => {
        const dbName = 'pogodka-offline-requests';
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => {
            reject('Error opening IndexedDB');
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['requests'], 'readwrite');
            const store = transaction.objectStore('requests');
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => {
                resolve();
            };
            
            deleteRequest.onerror = () => {
                reject('Error deleting request from queue');
            };
        };
    });
} 