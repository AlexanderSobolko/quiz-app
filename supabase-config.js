// Конфигурация Supabase
// ⚠️ ВАЖНО: Замените эти значения на ваши после создания проекта в Supabase

const SUPABASE_URL = 'https://rznutoztkurcfuczmstq.supabase.co'; // Замените на ваш URL
const SUPABASE_KEY = 'sb_publishable_e6VJfwbTzOLaajYYJKpHjg_RDKIOZPJ'; // Замените на ваш ключ

// Инициализация Supabase клиента
let supabase;

// Проверяем, что Supabase библиотека загружена
if (typeof window !== 'undefined') {
    // Загружаем Supabase из CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized');
    };
    document.head.appendChild(script);
}

// Функции для работы с localStorage (если Supabase не настроен)
const LocalStorage = {
    getTests: () => {
        const tests = localStorage.getItem('quizTests');
        return tests ? JSON.parse(tests) : [];
    },
    
    saveTest: (test) => {
        const tests = LocalStorage.getTests();
        test.id = Date.now();
        tests.push(test);
        localStorage.setItem('quizTests', JSON.stringify(tests));
        return test;
    },
    
    getTest: (id) => {
        const tests = LocalStorage.getTests();
        return tests.find(t => t.id == id);
    },
    
    getRandomTest: (excludeIds = []) => {
        const tests = LocalStorage.getTests();
        const availableTests = tests.filter(t => !excludeIds.includes(t.id));
        if (availableTests.length === 0) return tests[Math.floor(Math.random() * tests.length)];
        return availableTests[Math.floor(Math.random() * availableTests.length)];
    },
    
    saveProgress: (userId, testId, score, answers) => {
        const progress = LocalStorage.getProgress(userId) || { completedTests: [], scores: [] };
        progress.completedTests.push(testId);
        progress.scores.push(score);
        localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));
    },
    
    getProgress: (userId) => {
        const progress = localStorage.getItem(`progress_${userId}`);
        return progress ? JSON.parse(progress) : null;
    }
};

// API функции (используют Supabase если настроен, иначе localStorage)
const API = {
    // Получить все тесты
    async getTests() {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
        return LocalStorage.getTests();
    },
    
    // Получить один тест по ID
    async getTest(id) {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        }
        return LocalStorage.getTest(id);
    },
    
    // Получить случайный тест (исключая уже пройденные)
    async getRandomTest(userId) {
        const completedTestIds = await this.getCompletedTests(userId);
        
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            let query = supabase.from('tests').select('*');
            
            if (completedTestIds.length > 0) {
                query = query.not('id', 'in', `(${completedTestIds.join(',')})`);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Если все тесты пройдены, начинаем сначала
            if (!data || data.length === 0) {
                const { data: allTests, error: allError } = await supabase
                    .from('tests')
                    .select('*');
                if (allError) throw allError;
                return allTests[Math.floor(Math.random() * allTests.length)];
            }
            
            return data[Math.floor(Math.random() * data.length)];
        }
        return LocalStorage.getRandomTest(completedTestIds);
    },
    
    // Сохранить новый тест
    async saveTest(test) {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('tests')
                .insert([test])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        return LocalStorage.saveTest(test);
    },
    
    // Сохранить прогресс пользователя
    async saveProgress(userId, testId, score, answers) {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('user_progress')
                .insert([{
                    user_id: userId,
                    test_id: testId,
                    score: score,
                    answers: answers,
                    completed_at: new Date().toISOString()
                }]);
            if (error) throw error;
            return data;
        }
        return LocalStorage.saveProgress(userId, testId, score, answers);
    },
    
    // Получить список пройденных тестов
    async getCompletedTests(userId) {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('user_progress')
                .select('test_id')
                .eq('user_id', userId);
            if (error) throw error;
            return data.map(item => item.test_id);
        }
        const progress = LocalStorage.getProgress(userId);
        return progress ? progress.completedTests : [];
    },
    
    // Получить статистику пользователя
    async getUserStats(userId) {
        if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            const { data, error } = await supabase
                .from('user_progress')
                .select('score')
                .eq('user_id', userId);
            if (error) throw error;
            
            return {
                testsCompleted: data.length,
                averageScore: data.length > 0 
                    ? (data.reduce((sum, item) => sum + item.score, 0) / data.length).toFixed(1)
                    : 0
            };
        }
        const progress = LocalStorage.getProgress(userId);
        if (!progress || progress.scores.length === 0) {
            return { testsCompleted: 0, averageScore: 0 };
        }
        return {
            testsCompleted: progress.scores.length,
            averageScore: (progress.scores.reduce((a, b) => a + b, 0) / progress.scores.length).toFixed(1)
        };
    }
};

// Генерация ID пользователя (для анонимного использования)
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}
