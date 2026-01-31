// Конфигурация для GitHub Pages
const CONFIG = {
    API_BASE_URL: localStorage.getItem('telegram_admin_api_url') || 'http://localhost:8000',
    UPDATE_INTERVAL: 30000, // 30 секунд
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000
};

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
let currentUser = null;
let isAdmin = false;
let connectionChecked = false;

// Инициализация приложения
function initApp() {
    if (!tg) {
        console.warn('Telegram Web App не обнаружен. Режим отладки.');
        setupDebugMode();
        return;
    }
    
    // Настройки Telegram
    tg.expand();
    tg.setHeaderColor('#667eea');
    tg.setBackgroundColor('#667eea');
    
    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;
    currentUser = user;
    
    if (user) {
        updateUserInfo(user);
        checkAdminStatus(user.id);
    } else {
        document.getElementById('user-name').textContent = 'Telegram Пользователь';
        document.getElementById('user-role').textContent = 'Загрузка...';
    }
    
    // Инициализация интерфейса
    initBackButton();
    setupEventListeners();
    
    // Проверка подключения
    testConnection();
    
    // Загрузка данных
    refreshData();
    
    // Периодическое обновление
    setInterval(refreshData, CONFIG.UPDATE_INTERVAL);
    
    // Сохранение настроек при изменении
    document.getElementById('api-endpoint').addEventListener('change', saveApiUrl);
}

// Режим отладки для GitHub Pages
function setupDebugMode() {
    console.log('📱 Режим отладки активирован');
    
    // Тестовые данные
    currentUser = {
        id: 123456789,
        first_name: 'Тестовый',
        last_name: 'Администратор',
        username: 'test_admin'
    };
    
    isAdmin = true;
    
    // Обновляем UI
    document.getElementById('user-avatar').textContent = 'TD';
    document.getElementById('user-name').textContent = 'Тестовый Администратор';
    document.getElementById('user-role').textContent = '👑 Администратор (тест)';
    document.getElementById('user-role').style.color = '#2196f3';
    
    // Добавляем демо-бейдж
    const demoBadge = document.createElement('div');
    demoBadge.className = 'demo-badge';
    demoBadge.textContent = 'DEMO MODE';
    document.querySelector('.container').prepend(demoBadge);
    
    // Показываем предупреждение
    showAlert('info', 'Режим демонстрации. Данные загружаются локально.');
    
    // Загружаем демо-данные
    loadDemoData();
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    const name = `${user.first_name} ${user.last_name || ''}`.trim();
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-avatar').textContent = 
        user.first_name?.[0] + (user.last_name?.[0] || '');
}

// Проверка прав администратора
async function checkAdminStatus(userId) {
    try {
        const response = await fetchWithRetry(`${CONFIG.API_BASE_URL}/check-admin?user_id=${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.is_admin) {
            isAdmin = true;
            document.getElementById('user-role').textContent = '👑 Администратор';
            document.getElementById('user-role').style.color = '#764ba2';
            showAlert('success', 'Доступ администратора подтвержден');
        } else {
            document.getElementById('user-role').textContent = '👤 Пользователь';
            showAccessDenied();
        }
        
    } catch (error) {
        console.error('Ошибка проверки прав:', error);
        
        // Для демо-режима разрешаем доступ
        if (window.location.hostname.includes('github.io')) {
            isAdmin = true;
            document.getElementById('user-role').textContent = '👑 Администратор (демо)';
            document.getElementById('user-role').style.color = '#2196f3';
        } else {
            showAlert('warning', 'Ошибка проверки прав. Проверьте подключение к API.');
        }
    }
}

// Функция с повторными попытками
async function fetchWithRetry(url, options = {}, retries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            
            if (i < retries - 1) {
                await new Promise(resolve => 
                    setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, i))
                );
            }
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => 
                setTimeout(resolve, CONFIG.RETRY_DELAY * Math.pow(2, i))
            );
        }
    }
    throw new Error('Превышено количество попыток');
}

// Тестирование подключения к API
async function testConnection() {
    const statusDot = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-text');
    const apiStatus = document.getElementById('api-status');
    
    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Проверка подключения...';
    apiStatus.textContent = 'Проверка...';
    apiStatus.style.color = '#ff9800';
    
    try {
        const startTime = Date.now();
        const response = await fetch(`${CONFIG.API_BASE_URL}/stats`, {
            signal: AbortSignal.timeout(5000)
        });
        const endTime = Date.now();
        const ping = endTime - startTime;
        
        if (response.ok) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = `Подключено (${ping}мс)`;
            apiStatus.textContent = '✅ Онлайн';
            apiStatus.style.color = '#4caf50';
            connectionChecked = true;
            
            showAlert('success', `Подключение к API успешно установлено (${ping}мс)`);
            
            // Сохраняем успешный URL
            localStorage.setItem('telegram_admin_last_success_url', CONFIG.API_BASE_URL);
            
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('Ошибка подключения:', error);
        
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = `Ошибка: ${error.message}`;
        apiStatus.textContent = '❌ Офлайн';
        apiStatus.style.color = '#f44336';
        
        showAlert('error', `Не удалось подключиться к API: ${error.message}`);
        
        // Для демо-режима на GitHub Pages
        if (window.location.hostname.includes('github.io') && !connectionChecked) {
            setTimeout(() => {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Демо-режим (локальные данные)';
                apiStatus.textContent = '🔧 Демо-режим';
                apiStatus.style.color = '#2196f3';
                loadDemoData();
            }, 1000);
        }
    }
}

// Загрузка демо-данных для GitHub Pages
function loadDemoData() {
    console.log('📊 Загрузка демо-данных');
    
    // Демо-статистика
    const demoStats = {
        new_orders: Math.floor(Math.random() * 10) + 1,
        active_orders: Math.floor(Math.random() * 5) + 1,
        available_masters: Math.floor(Math.random() * 3) + 1,
        completed_today: Math.floor(Math.random() * 20) + 5
    };
    
    updateStats(demoStats);
    
    // Демо-заявки
    const demoOrders = [
        {
            app_id: 'demo_' + Date.now(),
            first_name: 'Иван',
            last_name: 'Петров',
            phone: '7912*******',
            address: 'г. Москва, ул. Ленина, д. 10',
            status: 'open',
            created_at: new Date().toLocaleTimeString('ru-RU')
        },
        {
            app_id: 'demo_' + (Date.now() - 100000),
            first_name: 'Мария',
            last_name: 'Сидорова',
            phone: '7923*******',
            address: 'г. Санкт-Петербург, Невский пр.',
            status: 'in_progress',
            created_at: new Date(Date.now() - 3600000).toLocaleTimeString('ru-RU')
        }
    ];
    
    updateRecentOrders(demoOrders);
    
    // Обновляем время
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString('ru-RU');
    
    showAlert('info', 'Демо-данные загружены. Для реальной работы настройте подключение к API.');
}

// Сохранение URL API
function saveApiUrl() {
    const url = document.getElementById('api-endpoint').value.trim();
    
    if (!url) {
        showAlert('error', 'Введите URL API');
        return;
    }
    
    // Простая валидация URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showAlert('error', 'URL должен начинаться с http:// или https://');
        return;
    }
    
    CONFIG.API_BASE_URL = url;
    localStorage.setItem('telegram_admin_api_url', url);
    document.getElementById('api-url').textContent = url;
    
    showAlert('success', 'URL API сохранен');
    testConnection();
}

// Остальные функции (refreshData, updateStats, etc.) остаются как в предыдущем примере
// Но обновите их для использования CONFIG.API_BASE_URL

// Показать информацию для отладки
function showDebugInfo() {
    const debugInfo = {
        location: {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            href: window.location.href
        },
        telegram: {
            available: !!tg,
            platform: tg?.platform,
            version: tg?.version,
            initData: tg?.initData
        },
        config: CONFIG,
        user: currentUser,
        localStorage: {
            api_url: localStorage.getItem('telegram_admin_api_url'),
            last_success: localStorage.getItem('telegram_admin_last_success_url')
        },
        timestamp: new Date().toISOString()
    };
    
    document.getElementById('debug-info').textContent = 
        JSON.stringify(debugInfo, null, 2);
    
    document.getElementById('debug-modal').style.display = 'flex';
}

// Копирование информации для отладки
function copyDebugInfo() {
    const text = document.getElementById('debug-info').textContent;
    navigator.clipboard.writeText(text)
        .then(() => showAlert('success', 'Скопировано в буфер обмена'))
        .catch(err => showAlert('error', 'Ошибка копирования: ' + err));
}

// Сброс настроек
function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
        localStorage.removeItem('telegram_admin_api_url');
        localStorage.removeItem('telegram_admin_last_success_url');
        
        CONFIG.API_BASE_URL = 'http://localhost:8000';
        document.getElementById('api-endpoint').value = CONFIG.API_BASE_URL;
        document.getElementById('api-url').textContent = CONFIG.API_BASE_URL;
        
        showAlert('success', 'Настройки сброшены');
        testConnection();
    }
}

// Показать сообщение
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.innerHTML = `<p>${message}</p>`;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Настройка слушателей событий
function setupEventListeners() {
    document.getElementById('api-endpoint').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveApiUrl();
    });
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}