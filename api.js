// Этот файл нужен для тестирования без реального бота
// В реальном проекте эти функции будут делать запросы к вашему Python боту

// Фейковые данные для тестирования
const mockData = {
    stats: {
        new_orders: 3,
        active_orders: 5,
        available_masters: 2,
        completed_today: 12
    },
    
    recent_orders: [
        {
            app_id: 'app_12345678',
            first_name: 'Иван',
            last_name: 'Петров',
            phone: '79123456789',
            address: 'г. Москва, ул. Ленина, д. 10',
            status: 'open',
            created_at: '2024-01-31 10:30:00'
        },
        {
            app_id: 'app_87654321',
            first_name: 'Мария',
            last_name: 'Сидорова',
            phone: '79234567890',
            address: 'г. Санкт-Петербург, Невский пр., д. 25',
            status: 'in_progress',
            created_at: '2024-01-31 09:15:00'
        }
    ],
    
    order_details: {
        'app_12345678': {
            app_id: 'app_12345678',
            first_name: 'Иван',
            last_name: 'Петров',
            phone: '79123456789',
            address: 'г. Москва, ул. Ленина, д. 10, кв. 25, 3 подъезд, 5 этаж',
            problem: 'Протекает кран на кухне. Капает уже 2 дня.',
            status: 'open',
            created_at: '2024-01-31 10:30:00',
            master_id: null
        }
    },
    
    available_masters: [
        {
            id: '123456789',
            name: 'Александр Васильев',
            active_orders: 1,
            rating: 4.8
        },
        {
            id: '987654321',
            name: 'Дмитрий Иванов',
            active_orders: 2,
            rating: 4.9
        }
    ]
};

// Имитация API запросов
async function fetchMockData(endpoint) {
    console.log(`Запрос к ${endpoint}`);
    
    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (endpoint === '/stats') {
        return mockData.stats;
    }
    
    if (endpoint === '/recent-orders') {
        return mockData.recent_orders;
    }
    
    if (endpoint.startsWith('/order/')) {
        const appId = endpoint.replace('/order/', '');
        return mockData.order_details[appId] || null;
    }
    
    if (endpoint === '/available-masters') {
        return mockData.available_masters;
    }
    
    if (endpoint === '/detailed-stats') {
        return {
            total_orders: 150,
            completed_today: 12,
            in_progress: 5,
            avg_completion_time: '1ч 25м',
            total_masters: 8,
            available_masters: 2
        };
    }
    
    return null;
}

// Для тестирования - заменяем реальные запросы на моки
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Сохраняем оригинальную функцию
    const originalFetchData = window.fetchData;
    
    // Заменяем на моковую
    window.fetchData = async function(endpoint) {
        try {
            // Пытаемся сделать реальный запрос
            return await originalFetchData(endpoint);
        } catch (error) {
            // Если реальный запрос не удался, используем мок
            console.log('Используем моковые данные для', endpoint);
            return await fetchMockData(endpoint);
        }
    };
}