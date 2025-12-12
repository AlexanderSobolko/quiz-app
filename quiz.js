// Страница викторины - quiz.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)

let currentTest = null;
let currentQuestionIndex = 0;
let score = 2.0; // Стартовые 2 балла
let userAnswers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadTest();
    setupEventListeners();
    displayQuestion();
    updateScoreLadder();
});

async function loadTest() {
    const testId = sessionStorage.getItem('currentTestId');
    
    if (!testId) {
        alert('Тест не выбран!');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        currentTest = await API.getTest(testId);
        
        if (!currentTest) {
            alert('Тест не найден!');
            window.location.href = 'index.html';
            return;
        }
        
        // ИСПРАВЛЕНИЕ 1: Сортируем вопросы - сначала закрытые, потом открытые
        const multipleChoiceQuestions = currentTest.questions.filter(q => q.type === 'multiple');
        const textQuestions = currentTest.questions.filter(q => q.type === 'text');
        currentTest.questions = [...multipleChoiceQuestions, ...textQuestions];
        
        // Инициализируем массив ответов
        userAnswers = new Array(currentTest.questions.length).fill(null);
        
    } catch (error) {
        console.error('Ошибка загрузки теста:', error);
        alert('Ошибка загрузки теста!');
        window.location.href = 'index.html';
    }
}

function setupEventListeners() {
    // Обработчики для кнопок с вариантами ответов
    const answerButtons = document.querySelectorAll('.answer-button');
    answerButtons.forEach(button => {
        button.addEventListener('click', () => selectAnswer(button));
    });
    
    // Обработчик для текстового ответа
    const submitButton = document.getElementById('submitTextAnswer');
    if (submitButton) {
        submitButton.addEventListener('click', submitTextAnswer);
    }
    
    // Enter для текстового ответа
    const textInput = document.getElementById('textAnswerInput');
    if (textInput) {
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitTextAnswer();
            }
        });
    }
}

function displayQuestion() {
    if (!currentTest || !currentTest.questions) return;
    
    const question = currentTest.questions[currentQuestionIndex];
    
    // Обновляем счетчик вопросов
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('currentScore').textContent = score.toFixed(1);
    
    // Обновляем прогресс бар
    const progress = ((currentQuestionIndex) / currentTest.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Отображаем текст вопроса
    document.getElementById('questionText').textContent = question.text;
    
    // Скрываем feedback
    document.getElementById('answerFeedback').className = 'answer-feedback';
    
    // Определяем тип вопроса и показываем соответствующий UI
    if (question.type === 'multiple') {
        // Вопрос с вариантами ответов
        document.getElementById('answersGrid').style.display = 'grid';
        document.getElementById('textAnswerContainer').style.display = 'none';
        
        const answerButtons = document.querySelectorAll('.answer-button');
        const answers = ['a', 'b', 'c', 'd'];
        
        answerButtons.forEach((button, index) => {
            const answer = answers[index];
            button.querySelector('.answer-text').textContent = question.answers[answer];
            button.classList.remove('selected', 'correct', 'incorrect');
            button.disabled = false;
            button.blur(); // ИСПРАВЛЕНИЕ: Убираем focus с кнопки
        });
        
    } else if (question.type === 'text') {
        // Текстовый вопрос
        document.getElementById('answersGrid').style.display = 'none';
        document.getElementById('textAnswerContainer').style.display = 'block';
        
        // ИСПРАВЛЕНИЕ 2: Сбрасываем состояние поля ввода
        const textInput = document.getElementById('textAnswerInput');
        const submitButton = document.getElementById('submitTextAnswer');
        
        textInput.value = '';
        textInput.disabled = false; // Разблокируем поле
        submitButton.disabled = false; // Разблокируем кнопку
        textInput.focus();
    }
    
    // Обновляем лесенку
    updateScoreLadder();
}

function selectAnswer(button) {
    // Убираем выделение с других кнопок
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Выделяем выбранную кнопку
    button.classList.add('selected');
    
    // Получаем выбранный ответ
    const selectedAnswer = button.dataset.answer;
    
    // Проверяем ответ
    checkAnswer(selectedAnswer, button);
}

function submitTextAnswer() {
    const input = document.getElementById('textAnswerInput');
    const userAnswer = input.value.trim();
    
    if (!userAnswer) {
        alert('Пожалуйста, введите ответ!');
        return;
    }
    
    checkAnswer(userAnswer);
}

function checkAnswer(userAnswer, button = null) {
    const question = currentTest.questions[currentQuestionIndex];
    let isCorrect = false;
    
    if (question.type === 'multiple') {
        isCorrect = userAnswer === question.correctAnswer;
        
        // Подсвечиваем правильный/неправильный ответ
        if (button) {
            if (isCorrect) {
                button.classList.add('correct');
                showFeedback(true);
            } else {
                button.classList.add('incorrect');
                // Показываем правильный ответ
                document.querySelectorAll('.answer-button').forEach(btn => {
                    if (btn.dataset.answer === question.correctAnswer) {
                        btn.classList.add('correct');
                    }
                });
                showFeedback(false, question.answers[question.correctAnswer]);
            }
            
            // Блокируем кнопки
            document.querySelectorAll('.answer-button').forEach(btn => {
                btn.disabled = true;
            });
        }
        
    } else if (question.type === 'text') {
        // Проверяем текстовый ответ (с учетом вариантов)
        const correctAnswers = question.correctAnswers.map(a => a.toLowerCase().trim());
        isCorrect = correctAnswers.some(answer => 
            userAnswer.toLowerCase().trim() === answer
        );
        
        showFeedback(isCorrect, question.correctAnswers[0]);
        
        // Блокируем поле ввода и кнопку ТОЛЬКО для текущего вопроса
        document.getElementById('submitTextAnswer').disabled = true;
        document.getElementById('textAnswerInput').disabled = true;
    }
    
    // Сохраняем ответ
    userAnswers[currentQuestionIndex] = {
        question: question.text,
        userAnswer: userAnswer,
        correctAnswer: question.type === 'multiple' ? question.correctAnswer : question.correctAnswers[0],
        isCorrect: isCorrect
    };
    
    // Обновляем счет
    if (isCorrect) {
        score += 0.5;
        document.getElementById('currentScore').textContent = score.toFixed(1);
    }
    
    // Переход к следующему вопросу через 2 секунды
    setTimeout(() => {
        nextQuestion();
    }, 2000);
}

function showFeedback(isCorrect, correctAnswer = '') {
    const feedback = document.getElementById('answerFeedback');
    
    if (isCorrect) {
        feedback.className = 'answer-feedback correct';
        feedback.textContent = '✓ Правильно! +0.5 балла';
    } else {
        feedback.className = 'answer-feedback incorrect';
        feedback.textContent = `✗ Неправильно. Правильный ответ: ${correctAnswer}`;
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= currentTest.questions.length) {
        // Тест завершен
        finishTest();
    } else {
        // Следующий вопрос
        // ИСПРАВЛЕНИЕ: Убираем фокус со всех элементов
        if (document.activeElement) {
            document.activeElement.blur();
        }
        displayQuestion();
    }
}

async function finishTest() {
    const userId = getUserId();
    
    // Сохраняем результаты
    try {
        await API.saveProgress(userId, currentTest.id, score, userAnswers);
    } catch (error) {
        console.error('Ошибка сохранения результатов:', error);
    }
    
    // Сохраняем результаты в sessionStorage для страницы результатов
    sessionStorage.setItem('testResults', JSON.stringify({
        score: score,
        answers: userAnswers,
        testTitle: currentTest.title
    }));
    
    // Переходим на страницу результатов
    window.location.href = 'result.html';
}

function updateScoreLadder() {
    const ladderItems = document.getElementById('ladderItems');
    if (!ladderItems) return;
    
    ladderItems.innerHTML = '';
    
    // Создаем 16 ступенек
    for (let i = 0; i < 16; i++) {
        const item = document.createElement('div');
        item.className = 'ladder-item';
        
        if (i < currentQuestionIndex) {
            item.classList.add('completed');
        } else if (i === currentQuestionIndex) {
            item.classList.add('current');
        }
        
        const points = 2 + (i + 1) * 0.5;
        item.innerHTML = `
            <span>Вопрос ${i + 1}</span>
            <span>${points.toFixed(1)} б.</span>
        `;
        
        ladderItems.appendChild(item);
    }
}
