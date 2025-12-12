// Страница результатов - result.js

document.addEventListener('DOMContentLoaded', () => {
    loadResults();
});

function loadResults() {
    const resultsData = sessionStorage.getItem('testResults');
    
    if (!resultsData) {
        alert('Результаты не найдены!');
        window.location.href = 'index.html';
        return;
    }
    
    const results = JSON.parse(resultsData);
    const { score, answers } = results;
    
    // Подсчитываем правильные ответы
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalQuestions = answers.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    
    // Обновляем UI
    document.getElementById('finalScore').textContent = score.toFixed(1);
    document.getElementById('correctAnswers').textContent = `${correctCount} из ${totalQuestions}`;
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    // Определяем сообщение и эмодзи на основе результата
    let message, emoji, title;
    
    if (accuracy >= 90) {
        title = 'Превосходно!';
        emoji = '🏆';
        message = 'Вы отлично знаете историю Беларуси! Результат выше 90% - это настоящее достижение!';
    } else if (accuracy >= 75) {
        title = 'Отличный результат!';
        emoji = '🎉';
        message = 'Вы хорошо знаете материал. Продолжайте в том же духе!';
    } else if (accuracy >= 60) {
        title = 'Хороший результат!';
        emoji = '👍';
        message = 'Неплохо! Есть куда расти, но основы вы знаете хорошо.';
    } else if (accuracy >= 50) {
        title = 'Можно лучше!';
        emoji = '📚';
        message = 'Стоит повторить материал. Попробуйте пройти тест еще раз!';
    } else {
        title = 'Нужно подготовиться!';
        emoji = '📖';
        message = 'Рекомендуем повторить материал и попробовать снова.';
    }
    
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultMessage').textContent = message;
    
    // Сохраняем ответы для просмотра
    window.userAnswers = answers;
}

function showAnswers() {
    const reviewSection = document.getElementById('answersReview');
    const reviewList = document.getElementById('answersReviewList');
    
    if (reviewSection.style.display === 'block') {
        reviewSection.style.display = 'none';
        return;
    }
    
    reviewSection.style.display = 'block';
    reviewList.innerHTML = '';
    
    window.userAnswers.forEach((answer, index) => {
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-review-item';
        answerItem.style.cssText = `
            background: var(--navy);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            border-left: 4px solid ${answer.isCorrect ? 'var(--success)' : 'var(--error)'};
        `;
        
        answerItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <strong>Вопрос ${index + 1}</strong>
                <span style="color: ${answer.isCorrect ? 'var(--success)' : 'var(--error)'}; font-weight: 600;">
                    ${answer.isCorrect ? '✓ Правильно' : '✗ Неправильно'}
                </span>
            </div>
            <div style="margin-bottom: 0.8rem; color: var(--light-gray);">
                ${answer.question}
            </div>
            <div style="display: grid; gap: 0.5rem; font-size: 0.95rem;">
                <div>
                    <span style="color: var(--light-gray);">Ваш ответ:</span>
                    <span style="color: ${answer.isCorrect ? 'var(--success)' : 'var(--error)'}; font-weight: 600; margin-left: 0.5rem;">
                        ${answer.userAnswer}
                    </span>
                </div>
                ${!answer.isCorrect ? `
                    <div>
                        <span style="color: var(--light-gray);">Правильный ответ:</span>
                        <span style="color: var(--success); font-weight: 600; margin-left: 0.5rem;">
                            ${answer.correctAnswer}
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
        
        reviewList.appendChild(answerItem);
    });
    
    // Прокручиваем к просмотру ответов
    reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
