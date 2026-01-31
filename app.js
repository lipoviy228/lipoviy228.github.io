// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Элементы DOM
const userNameElement = document.getElementById('user-name');
const getDataBtn = document.getElementById('get-data-btn');
const orderButtons = document.querySelectorAll('.order-btn');
const orderForm = document.getElementById('order-form');
const resultDiv = document.getElementById('result');
const servicesDiv = document.querySelector('.services');
const submitBtn = document.getElementById('submit-order');
const cancelBtn = document.getElementById('cancel-order');
const newOrderBtn = document.getElementById('new-order');

// Данные пользователя из Telegram
const user = tg.initDataUnsafe?.user;

// Инициализация
if (user) {
    userNameElement.textContent = `Привет, ${user.first_name || 'пользователь'}!`;
}

// Показать данные пользователя
getDataBtn.addEventListener('click', () => {
    if (user) {
        alert(`Ваши данные из Telegram:\nИмя: ${user.first_name}\nФамилия: ${user.last_name || 'не указана'}\nID: ${user.id}\nЛогин: @${user.username || 'не указан'}`);
    } else {
        alert('Данные Telegram недоступны в режиме предпросмотра');
    }
});

// Выбор услуги
orderButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const service = btn.getAttribute('data-service');
        const serviceName = getServiceName(service);
        
        document.getElementById('service-name').value = serviceName;
        
        // Автозаполнение имени из Telegram
        if (user?.first_name) {
            document.getElementById('client-name').value = user.first_name;
        }
        
        servicesDiv.classList.add('hidden');
        orderForm.classList.remove('hidden');
    });
});

// Отмена заказа
cancelBtn.addEventListener('click', () => {
    orderForm.classList.add('hidden');
    servicesDiv.classList.remove('hidden');
});

// Отправка заказа
submitBtn.addEventListener('click', () => {
    const service = document.getElementById('service-name').value;
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const description = document.getElementById('problem-desc').value;
    
    if (!name || !phone) {
        alert('Пожалуйста, заполните имя и телефон');
        return;
    }
    
    // В реальном приложении здесь был бы AJAX-запрос на сервер
    console.log('Заявка:', { service, name, phone, description });
    
    // Показать результат
    orderForm.classList.add('hidden');
    resultDiv.classList.remove('hidden');
    
    // В реальном приложении можно отправить данные в бота
    // tg.sendData(JSON.stringify({ service, name, phone, description }));
});

// Новый заказ
newOrderBtn.addEventListener('click', () => {
    resultDiv.classList.add('hidden');
    servicesDiv.classList.remove('hidden');
    
    // Очистка формы
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('problem-desc').value = '';
});

// Функция для получения названия услуги
function getServiceName(service) {
    const services = {
        'plumber': 'Сантехник',
        'electrician': 'Электрик',
        'furniture': 'Сборка мебели'
    };
    return services[service] || service;
}

// Кнопка "Назад" в Telegram
tg.BackButton.onClick(() => {
    if (!orderForm.classList.contains('hidden')) {
        orderForm.classList.add('hidden');
        servicesDiv.classList.remove('hidden');
        tg.BackButton.hide();
    } else if (!resultDiv.classList.contains('hidden')) {
        resultDiv.classList.add('hidden');
        servicesDiv.classList.remove('hidden');
        tg.BackButton.hide();
    }
});

// Показать кнопку "Назад" при открытии форм
orderButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tg.BackButton.show();
    });
});

// Цветовая схема
tg.setHeaderColor('#667eea');
tg.setBackgroundColor('#667eea');
