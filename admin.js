// Админ-панель - admin.js

let questionsData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadExistingTests();
});

// Добавить новый вопрос
function addQuestion() {
    const container = document.getElementById('questionsContainer');
    const template = document.querySelector('.question-form-template');
    const clone = template.cloneNode(true);
    
    // Убираем класс template
    clone.classList.remove('question-form-template');
    
    // Обновляем номер вопроса
    const questionNumber = questionsData.length + 1;
    clone.querySelector('.question-number').textContent = questionNumber;
    
    container.appendChild(clone);
    
    // Обновляем счетчик
    updateQuestionsCount();
    
    // Прокручиваем к новому вопросу
    clone.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Удалить вопрос
function removeQuestion(button) {
    const questionItem = button.closest('.question-form-item');
    questionItem.remove();
    
    // Обновляем нумерацию
    updateQuestionNumbers();
    updateQuestionsCount();
}

// Обновить нумерацию вопросов
function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-form-item:not(.question-form-template)');
    questions.forEach((question, index) => {
        question.querySelector('.question-number').textContent = index + 1;
    });
}

// Обновить счетчик вопросов
function updateQuestionsCount() {
    const count = document.querySelectorAll('.question-form-item:not(.question-form-template)').length;
    document.getElementById('questionsCount').textContent = count;
}

// Переключение типа вопроса
function toggleAnswerType(select) {
    const questionItem = select.closest('.question-form-item');
    const multipleGroup = questionItem.querySelector('.multiple-answers-group');
    const textGroup = questionItem.querySelector('.text-answer-group');
    
    if (select.value === 'multiple') {
        multipleGroup.style.display = 'block';
        textGroup.style.display = 'none';
    } else {
        multipleGroup.style.display = 'none';
        textGroup.style.display = 'block';
    }
}

// Сохранить тест
async function saveTest() {
    const testTitle = document.getElementById('testTitle').value.trim();
    const testDescription = document.getElementById('testDescription').value.trim();
    
    if (!testTitle) {
        alert('Пожалуйста, введите название теста!');
        return;
    }
    
    // Собираем вопросы
    const questions = [];
    const questionItems = document.querySelectorAll('.question-form-item:not(.question-form-template)');
    
    if (questionItems.length === 0) {
        alert('Добавьте хотя бы один вопрос!');
        return;
    }
    
    if (questionItems.length !== 16) {
        alert('Тест должен содержать ровно 16 вопросов!');
        return;
    }
    
    let isValid = true;
    
    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text-input').value.trim();
        const questionType = item.querySelector('.question-type-select').value;
        
        if (!questionText) {
            alert(`Вопрос ${index + 1}: введите текст вопроса!`);
            isValid = false;
            return;
        }
        
        const question = {
            text: questionText,
            type: questionType
        };
        
        if (questionType === 'multiple') {
            const answerA = item.querySelector('.answer-a').value.trim();
            const answerB = item.querySelector('.answer-b').value.trim();
            const answerC = item.querySelector('.answer-c').value.trim();
            const answerD = item.querySelector('.answer-d').value.trim();
            const correctAnswer = item.querySelector('.correct-answer-select').value;
            
            if (!answerA || !answerB || !answerC || !answerD) {
                alert(`Вопрос ${index + 1}: заполните все варианты ответов!`);
                isValid = false;
                return;
            }
            
            question.answers = {
                a: answerA,
                b: answerB,
                c: answerC,
                d: answerD
            };
            question.correctAnswer = correctAnswer;
            
        } else {
            const correctAnswers = item.querySelector('.correct-text-answers').value.trim();
            
            if (!correctAnswers) {
                alert(`Вопрос ${index + 1}: укажите правильные ответы!`);
                isValid = false;
                return;
            }
            
            question.correctAnswers = correctAnswers.split(',').map(a => a.trim());
        }
        
        questions.push(question);
    });
    
    if (!isValid) return;
    
    // Создаем объект теста
    const test = {
        title: testTitle,
        description: testDescription,
        questions: questions,
        created_at: new Date().toISOString()
    };
    
    try {
        await API.saveTest(test);
        alert('Тест успешно сохранен!');
        
        // Очищаем форму
        document.getElementById('testTitle').value = '';
        document.getElementById('testDescription').value = '';
        
        // Удаляем все вопросы
        const allQuestions = document.querySelectorAll('.question-form-item:not(.question-form-template)');
        allQuestions.forEach(q => q.remove());
        updateQuestionsCount();
        
        // Обновляем список тестов
        loadExistingTests();
        
    } catch (error) {
        console.error('Ошибка сохранения теста:', error);
        alert('Ошибка сохранения теста! Проверьте консоль для деталей.');
    }
}

// Загрузить список существующих тестов
async function loadExistingTests() {
    try {
        const tests = await API.getTests();
        const testsList = document.getElementById('testsList');
        
        if (tests.length === 0) {
            testsList.innerHTML = '<p style="color: var(--light-gray); text-align: center;">Тесты еще не добавлены</p>';
            return;
        }
        
        testsList.innerHTML = tests.map(test => `
            <div class="test-card" style="
                background: var(--navy);
                padding: 1.5rem;
                border-radius: 10px;
                border: 2px solid rgba(255, 215, 0, 0.2);
                margin-bottom: 1rem;
            ">
                <h3 style="color: var(--primary-gold); margin-bottom: 0.5rem;">${test.title}</h3>
                <p style="color: var(--light-gray); margin-bottom: 1rem; font-size: 0.9rem;">
                    ${test.description || 'Без описания'}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--light-gray); font-size: 0.9rem;">
                        Вопросов: ${test.questions.length}
                    </span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="previewTestById(${test.id})" style="
                            padding: 0.5rem 1rem;
                            background: var(--deep-blue);
                            color: var(--primary-gold);
                            border: 1px solid var(--primary-gold);
                            border-radius: 5px;
                            cursor: pointer;
                        ">
                            Просмотр
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки тестов:', error);
    }
}

// Предпросмотр теста
function previewTest() {
    alert('Функция предпросмотра в разработке. Сохраните тест и пройдите его на главной странице.');
}

function previewTestById(testId) {
    sessionStorage.setItem('currentTestId', testId);
    window.location.href = 'quiz.html';
}
