// Главная страница - app.js

document.addEventListener('DOMContentLoaded', async () => {
    const startButton = document.getElementById('startButton');
    const userStats = document.getElementById('userStats');
    const testsCompleted = document.getElementById('testsCompleted');
    const avgScore = document.getElementById('avgScore');
    
    const userId = getUserId();
    
    // Загружаем статистику пользователя
    try {
        const stats = await API.getUserStats(userId);
        if (stats.testsCompleted > 0) {
            userStats.style.display = 'block';
            testsCompleted.textContent = stats.testsCompleted;
            avgScore.textContent = stats.averageScore;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
    
    // Обработчик кнопки "Начать тест"
    startButton.addEventListener('click', async () => {
        startButton.disabled = true;
        startButton.innerHTML = '<span>Загрузка теста...</span>';
        
        try {
            // Получаем случайный тест, который пользователь еще не проходил
            const test = await API.getRandomTest(userId);
            
            if (!test) {
                alert('Тесты не найдены! Пожалуйста, добавьте тесты через админ-панель.');
                startButton.disabled = false;
                startButton.innerHTML = '<span>Начать тест</span><div class="button-shine"></div>';
                return;
            }
            
            // Сохраняем ID теста в sessionStorage
            sessionStorage.setItem('currentTestId', test.id);
            
            // Переходим на страницу теста
            window.location.href = 'quiz.html';
            
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            alert('Произошла ошибка при загрузке теста. Проверьте консоль для деталей.');
            startButton.disabled = false;
            startButton.innerHTML = '<span>Начать тест</span><div class="button-shine"></div>';
        }
    });
    
    // Добавляем анимацию звезд
    createStars();
});

// Функция создания звезд
function createStars() {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: twinkle ${2 + Math.random() * 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        starsContainer.appendChild(star);
    }
}
