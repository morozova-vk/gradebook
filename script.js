// =============================================================================
// GRADEBOOK PRO — Основной скрипт приложения
// =============================================================================

// ===== МОДЕЛЬ ДАННЫХ =====
const APP_DATA = {
    classes: [],
    subjects: [
        'Алгебра', 'Геометрия', 'Русский язык', 'Литература',
        'Информатика', 'Обществознание', 'Физическая культура',
        'Биология', 'География', 'Химия', 'Физика', 'Английский язык'
    ],
    schedules: {
        'Алгебра': [1, 3, 5],
        'Геометрия': [2, 4],
        'Русский язык': [1, 3, 5],
        'Литература': [2, 4],
        'Информатика': [3, 5],
        'Обществознание': [1, 4],
        'Физическая культура': [2, 5],
        'Биология': [1, 3],
        'География': [2, 4],
        'Химия': [3, 5],
        'Физика': [1, 4],
        'Английский язык': [2, 4, 5]
    },
    journal: {}
};

let editingStudent = null;
let importedData = null;
let chartInstances = {};
let importMode = null;
let gradeEditTarget = null;
let topicEditTarget = null;

// Добавить демо-класс при первом запуске
function initDemoData() {
    if (APP_DATA.classes.length === 0) {
        // Создаём демо-класс
        const demoClass = "9А";
        APP_DATA.classes.push(demoClass);
        APP_DATA.journal[demoClass] = {};
        
        for (const subj of APP_DATA.subjects) {
            APP_DATA.journal[demoClass][subj] = {
                students: [
                    { id: 1, name: "Иванов Иван Иванович", grades: {} },
                    { id: 2, name: "Петрова Мария Сергеевна", grades: {} },
                    { id: 3, name: "Сидоров Алексей Николаевич", grades: {} }
                ],
                dates: generateClassDates(subj).slice(0, 8),
                topics: {},
                homework: {}
            };
        }
        saveData();
        console.log("Демо-класс 9А создан");
    }
}


// ===== ИНИЦИАЛИЗАЦИЯ =====
function init() {
    loadFromStorage();
 initDemoData();
    sortAllStudents();
    populateAllDropdowns();
    renderJournal();
}

document.addEventListener('DOMContentLoaded', init);

// ===== ХРАНИЛИЩЕ =====
function saveData() {
    try {
        localStorage.setItem('gradebook_journal', JSON.stringify(APP_DATA.journal));
        localStorage.setItem('gradebook_classes', JSON.stringify(APP_DATA.classes));
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

function saveJournalToStorage() {
    saveData();
    showToast('Данные сохранены', 'success');
}

function loadFromStorage() {
    try {
        const j = localStorage.getItem('gradebook_journal');
        if (j) APP_DATA.journal = JSON.parse(j);
        const c = localStorage.getItem('gradebook_classes');
        if (c) APP_DATA.classes = JSON.parse(c);
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// ===== ПОМОЩНИКИ ДАТ =====
function getSchoolYear() {
    const now = new Date();
    return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function isValidClassName(className) {
    if (!className || typeof className !== 'string') return false;
    const trimmed = className.trim();
    const match = trimmed.match(/^(\d{1,2})([А-Я])$/);
    if (!match) return false;
    const number = parseInt(match[1]);
    const letter = match[2];
    if (number < 1 || number > 11) return false;
    const forbiddenLetters = ['Й', 'Ъ', 'Ь', 'Ы'];
    if (forbiddenLetters.includes(letter)) return false;
    const russianLetters = /[А-Я]/;
    if (!russianLetters.test(letter)) return false;
    return true;
}

function isStudentExists(cls, subj, studentName) {
    const data = APP_DATA.journal[cls]?.[subj];
    if (!data) return false;
    return data.students.some(s => normalizeString(s.name) === normalizeString(studentName));
}

function generateClassDates(subject, startYear) {
    if (!startYear) startYear = getSchoolYear();
    const schedule = APP_DATA.schedules[subject] || [1, 3];
    const dates = [];
    const start = new Date(startYear, 8, 1);
    const end = new Date(startYear + 1, 4, 31);
    let cur = new Date(start);
    while (cur <= end) {
        if (schedule.includes(cur.getDay())) {
            dates.push(formatDateISO(cur));
        }
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

function formatDateISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateStr) {
    const parts = dateStr.split('-');
    return `${parts[2]}.${parts[1]}`;
}

function formatDateFull(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function parseDateFromInput(str) {
    if (!str) return null;
    const parts = String(str).trim().split('.');
    if (parts.length === 2) {
        const year = getSchoolYear();
        const mm = parts[1].padStart(2, '0');
        const dd = parts[0].padStart(2, '0');
        if (parseInt(mm) < 1 || parseInt(mm) > 12 || parseInt(dd) < 1 || parseInt(dd) > 31) return null;
        return `${year}-${mm}-${dd}`;
    } else if (parts.length === 3) {
        const mm = parts[1].padStart(2, '0');
        const dd = parts[0].padStart(2, '0');
        return `${parts[2]}-${mm}-${dd}`;
    }
    return null;
}

// Нормализация строки - заменяет все виды пробелов, убирает невидимые символы
function normalizeString(str) {
    if (!str) return '';
    return str
        .replace(/^\uFEFF/, '')                          // удаляем BOM символ в начале
        .replace(/[\u00A0\u2000-\u200F\u2028-\u202F]/g, ' ') // все спецпробелы в обычные
        .replace(/\s+/g, ' ')                            // несколько пробелов в один
        .trim();
}

// ===== НАВИГАЦИЯ =====
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tabName);
    if (tabEl) {
        tabEl.classList.remove('hidden');
        tabEl.style.animation = 'none';
        tabEl.offsetHeight;
        tabEl.style.animation = '';
    }
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
    if (tabName === 'journal') renderJournal();
    if (tabName === 'stats') renderStatsTable();
    if (tabName === 'graphs') renderStatsGraphs();
}

// ===== ВЫПАДАЮЩИЕ СПИСКИ =====
function populateAllDropdowns() {
    const nonEmptyClasses = APP_DATA.classes.filter(cls => {
        for (const subj of APP_DATA.subjects) {
            const data = APP_DATA.journal[cls]?.[subj];
            if (data && data.students && data.students.length > 0) {
                return true;
            }
        }
        return false;
    });
    
    fillDropdown('journalClass', nonEmptyClasses, { addAll: false });
    fillDropdown('journalSubject', APP_DATA.subjects, { addAll: false });
    fillDropdown('statsClass', nonEmptyClasses, { addAll: true });
    fillDropdown('statsSubject', APP_DATA.subjects, { addAll: true });
	fillDropdown('statsOverallSubject', APP_DATA.subjects, { addAll: false });		
    fillDropdown('graphsClass', nonEmptyClasses, { addAll: true });
    fillDropdown('graphsSubject', APP_DATA.subjects, { addAll: true });
	fillDropdown('graphsOverallSubject', APP_DATA.subjects, { addAll: false });
    fillDropdown('importClass', APP_DATA.classes, { addAll: false, addNew: true });
    fillDropdown('importSubject', APP_DATA.subjects, { addAll: false });
}

function fillDropdown(id, items, opts = {}) {
    const select = document.getElementById(id);
    if (!select) return;
    let html = '';
    if (opts.addAll) html += '<option value="all">Все</option>';
    if (opts.addNew) html += '<option value="__new__">— Новый класс —</option>';
    items.forEach(item => {
        html += `<option value="${item}">${item}</option>`;
    });
    select.innerHTML = html;
}

function onImportClassChange() {
    const sel = document.getElementById('importClass');
    const wrap = document.getElementById('importNewClassWrap');
    if (!sel || !wrap) return;
    wrap.classList.toggle('hidden', sel.value !== '__new__');
}

// ===== ОТРИСОВКА ЖУРНАЛА =====
function ensureClassSubject(cls, subj) {
    if (!APP_DATA.journal[cls]) APP_DATA.journal[cls] = {};
    if (!APP_DATA.journal[cls][subj]) {
        APP_DATA.journal[cls][subj] = {
            students: [],
            dates: generateClassDates(subj).slice(0, 12),
            topics: {},
            homework: {}
        };
    }
    if (!APP_DATA.journal[cls][subj].topics) APP_DATA.journal[cls][subj].topics = {};
    if (!APP_DATA.journal[cls][subj].homework) APP_DATA.journal[cls][subj].homework = {};
}

function renderJournal() {
    const cls = document.getElementById('journalClass')?.value;
    const subj = document.getElementById('journalSubject')?.value;
    const thead = document.getElementById('journalTableHead');
    const tbody = document.getElementById('journalTableBody');

    if (!cls || !subj || !APP_DATA.journal[cls]?.[subj]) {
        thead.innerHTML = '';
        tbody.innerHTML = '<td><td colspan="5" class="text-center py-12 text-slate-400">Нет данных. Создайте класс и добавьте учеников, или загрузите данные.</td></tr>';
        return;
    }

    const data = APP_DATA.journal[cls][subj];
    if (!data.topics) data.topics = {};
    if (!data.homework) data.homework = {};
    const dates = data.dates || [];

    let headHTML = '<tr>';
    headHTML += '<th class="sticky-col sticky-col-0 text-center">№</th>';
    headHTML += '<th class="sticky-col sticky-col-1 text-left">ФИО</th>';
    headHTML += '<th class="sticky-col sticky-col-2 text-center">Ср.</th>';
    dates.forEach(d => {
        headHTML += `<th class="text-center date-col">
            <div class="flex flex-col items-center">
                <span class="date-label">${formatDateDisplay(d)}</span>
                <button onclick="removeDate('${d}')" class="text-red-400 hover:text-red-600 text-xs mt-0.5 leading-none" title="Удалить столбец">✕</button>
            </div>
        </th>`;
    });
    headHTML += '<th class="text-center act-col">Действия</th>';
    headHTML += '</tr>';
    thead.innerHTML = headHTML;

    let bodyHTML = '';

    bodyHTML += '<tr class="topic-row">';
    bodyHTML += '<td class="sticky-col sticky-col-0" style="background:#f0f4ff"></td>';
    bodyHTML += '<td class="sticky-col sticky-col-1 text-left name-cell" style="background:#f0f4ff;font-style:italic;color:#6366f1">Тема урока</td>';
    bodyHTML += '<td class="sticky-col sticky-col-2" style="background:#f0f4ff"></td>';
    dates.forEach(d => {
        const topic = data.topics[d] || '';
        bodyHTML += `<td class="text-center" style="cursor:pointer;min-width:42px" onclick="openTopicEdit('${d}','topic')" title="${topic || 'Нажмите для редактирования'}">
            <span style="font-size:0.65rem;color:${topic ? '#4f46e5' : '#cbd5e1'}">${topic ? escapeHTML(topic) : '+'}</span>
        </table>`;
    });
    bodyHTML += '<td></td><tr>';

    bodyHTML += '<tr class="homework-row">';
    bodyHTML += '<td class="sticky-col sticky-col-0" style="background:#f0faf4"></td>';
    bodyHTML += '<td class="sticky-col sticky-col-1 text-left name-cell" style="background:#f0faf4;font-style:italic;color:#059669">Домашнее задание</td>';
    bodyHTML += '<td class="sticky-col sticky-col-2" style="background:#f0faf4"></td>';
    dates.forEach(d => {
        const hw = data.homework[d] || '';
        bodyHTML += `<td class="text-center" style="cursor:pointer;min-width:42px" onclick="openTopicEdit('${d}','homework')" title="${hw || 'Нажмите для редактирования'}">
            <span style="font-size:0.65rem;color:${hw ? '#059669' : '#cbd5e1'}">${hw ? escapeHTML(hw) : '+'}</span>
        </td>`;
    });
    bodyHTML += '<td></td></tr>';

    const MAX_ROWS = 30;
    for (let i = 0; i < MAX_ROWS; i++) {
        const student = data.students[i];
        if (student) {
            const grades = student.grades || {};
            const gradeValues = Object.values(grades).filter(g => g > 0);
            const avg = gradeValues.length > 0
                ? (gradeValues.reduce((s, g) => s + g, 0) / gradeValues.length).toFixed(2)
                : '—';

            bodyHTML += '<tr>';
            bodyHTML += `<td class="sticky-col sticky-col-0 text-center">${i + 1}</td>`;
            bodyHTML += `<td class="sticky-col sticky-col-1 text-left name-cell">${escapeHTML(student.name)}</td>`;
            bodyHTML += `<td class="sticky-col sticky-col-2 text-center font-bold ${getAvgColor(avg)}">${avg}</td>`;
            dates.forEach(d => {
                const grade = grades[d];
                if (grade) {
                    bodyHTML += `<td class="text-center"><span class="grade-cell grade-${grade}" onclick="openGradeEdit(${i},'${d}',${grade})" title="${formatDateFull(d)}">${grade}</span></td>`;
                } else {
                    bodyHTML += `<td class="text-center"><span class="grade-cell empty-grade" onclick="openGradeEdit(${i},'${d}',null)" title="${formatDateFull(d)}">—</span></td>`;
                }
            });
            bodyHTML += `<td class="text-center"><div class="flex items-center justify-center gap-0.5">
                <button onclick="openEditModal(${i})" class="act-btn edit-btn" title="Редактировать">✏️</button>
                <button onclick="deleteStudent(${i})" class="act-btn del-btn" title="Удалить">🗑</button>
            </div></td>`;
            bodyHTML += '</tr>';
        } else {
            bodyHTML += '<tr>';
            bodyHTML += `<td class="sticky-col sticky-col-0 text-center text-slate-300">${i + 1}</td>`;
            bodyHTML += '<td class="sticky-col sticky-col-1 text-left name-cell text-slate-200"></td>';
            bodyHTML += '<td class="sticky-col sticky-col-2 text-center text-slate-300">—</td>';
            dates.forEach(() => {
                bodyHTML += '<td class="text-center"><span class="grade-cell empty-grade" style="opacity:0.3">—</span></td>';
            });
            bodyHTML += '<td></td></td>';
            bodyHTML += '</tr>';
        }
    }
    tbody.innerHTML = bodyHTML;
}

function getAvgColor(avg) {
    const val = parseFloat(avg);
    if (isNaN(val)) return 'text-slate-400';
    if (val >= 4.5) return 'text-emerald-600';
    if (val >= 3.5) return 'text-blue-600';
    if (val >= 2.5) return 'text-amber-600';
    return 'text-rose-600';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== ДОБАВЛЕНИЕ / УДАЛЕНИЕ ДАТЫ =====
function addDate() {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    const dateInput = document.getElementById('newDateInput');
    const topicInput = document.getElementById('newDateTopic');

    if (!cls || !subj) { showToast('Выберите класс и предмет', 'error'); return; }
    const dateVal = dateInput.value;
    if (!dateVal) { showToast('Выберите дату', 'error'); return; }

    ensureClassSubject(cls, subj);
    const data = APP_DATA.journal[cls][subj];

    if (data.dates.includes(dateVal)) { showToast('Эта дата уже добавлена', 'error'); return; }

    data.dates.push(dateVal);
    data.dates.sort();

    const topic = topicInput.value.trim();
    if (topic) data.topics[dateVal] = topic;

    dateInput.value = '';
    topicInput.value = '';
    renderJournal();
    saveData();
    showToast('Дата добавлена', 'success');
}

function removeDate(dateStr) {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    if (!cls || !subj) return;
    const data = APP_DATA.journal[cls]?.[subj];
    if (!data) return;

    if (!confirm(`Удалить столбец ${formatDateDisplay(dateStr)}?`)) return;

    data.dates = data.dates.filter(d => d !== dateStr);
    delete data.topics[dateStr];
    delete data.homework[dateStr];
    data.students.forEach(s => delete s.grades[dateStr]);

    renderJournal();
    saveData();
    showToast('Столбец удалён', 'info');
}

// ===== МОДАЛЬНОЕ ОКНО ОЦЕНКИ =====
function openGradeEdit(studentIdx, date, currentGrade) {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    if (!cls || !subj) return;

    gradeEditTarget = { cls, subj, studentIdx, date };
    const student = APP_DATA.journal[cls][subj].students[studentIdx];

    document.getElementById('gradeModalInfo').textContent = `${student.name} — ${formatDateFull(date)}`;

    document.querySelectorAll('.grade-pick-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-offset-2');
        const g = parseInt(btn.dataset.grade);
        if (g === currentGrade) btn.classList.add('ring-2', 'ring-offset-2');
    });

    document.getElementById('gradeModal').classList.remove('hidden');
}

function closeGradeModal() {
    document.getElementById('gradeModal').classList.add('hidden');
    gradeEditTarget = null;
}

function setGrade(grade) {
    if (!gradeEditTarget) return;
    const { cls, subj, studentIdx, date } = gradeEditTarget;
    const student = APP_DATA.journal[cls][subj].students[studentIdx];

    if (grade === 0) {
        delete student.grades[date];
    } else if (grade >= 2 && grade <= 5) {
        student.grades[date] = grade;
    }

    closeGradeModal();
    renderJournal();
    saveData();
}

// ===== МОДАЛЬНОЕ ОКНО ТЕМЫ / ДЗ =====
function openTopicEdit(date, type) {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    if (!cls || !subj) return;
    const data = APP_DATA.journal[cls][subj];
    if (!data) return;

    topicEditTarget = { cls, subj, date, type };
    const value = type === 'topic' ? (data.topics?.[date] || '') : (data.homework?.[date] || '');

    document.getElementById('topicModalTitle').textContent = type === 'topic' ? 'Тема урока' : 'Домашнее задание';
    document.getElementById('topicModalDate').textContent = formatDateFull(date);
    document.getElementById('topicInput').value = value;

    document.getElementById('topicModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('topicInput').focus(), 100);
}

function closeTopicModal() {
    document.getElementById('topicModal').classList.add('hidden');
    topicEditTarget = null;
}

function saveTopicEdit() {
    if (!topicEditTarget) return;
    const { cls, subj, date, type } = topicEditTarget;
    const data = APP_DATA.journal[cls][subj];
    const value = document.getElementById('topicInput').value.trim();

    if (type === 'topic') {
        data.topics[date] = value;
    } else {
        data.homework[date] = value;
    }

    closeTopicModal();
    renderJournal();
    saveData();
}

// ===== CRUD СТУДЕНТОВ =====
function addStudent() {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    const nameInput = document.getElementById('newStudentName');
    const gradesInput = document.getElementById('newStudentGrades');
    const name = nameInput.value.trim();

    if (!name) { showToast('Введите ФИО ученика', 'error'); return; }
    if (!cls || !subj) { showToast('Выберите класс и предмет', 'error'); return; }

    if (isStudentExists(cls, subj, name)) {
        showToast(`Ученик "${name}" уже есть в классе "${cls}" по предмету "${subj}".`, 'warning');
        return;
    }

    ensureClassSubject(cls, subj);
    const data = APP_DATA.journal[cls][subj];

    if (data.students.length >= 30) {
        showToast('Максимум 30 учеников в классе', 'error');
        return;
    }

    const grades = {};
    if (gradesInput && gradesInput.value.trim()) {
        gradesInput.value.split(',').forEach(part => {
            const match = part.trim().match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?=(\d)$/);
            if (match) {
                const year = match[3] || getSchoolYear();
                const dateStr = `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
                const grade = parseInt(match[4]);
                if (grade >= 2 && grade <= 5) {
                    grades[dateStr] = grade;
                    if (!data.dates.includes(dateStr)) {
                        data.dates.push(dateStr);
                        data.dates.sort();
                    }
                }
            }
        });
    }

    data.students.push({ id: data.students.length + 1, name, grades });
    nameInput.value = '';
    if (gradesInput) gradesInput.value = '';
    sortStudentsInClass(cls, subj);
    renderJournal();
    saveData();
    showToast('Ученик добавлен', 'success');
}

function deleteStudent(studentIdx) {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    const data = APP_DATA.journal[cls]?.[subj];
    if (!data) return;
    const student = data.students[studentIdx];
    if (!student) return;

    if (!confirm(`Удалить студента "${student.name}"?`)) return;

    data.students.splice(studentIdx, 1);
    sortStudentsInClass(cls, subj);
    renderJournal();
    saveData();
    showToast('Ученик удалён', 'info');
}

function openEditModal(studentIdx) {
    const cls = document.getElementById('journalClass').value;
    const subj = document.getElementById('journalSubject').value;
    const data = APP_DATA.journal[cls]?.[subj];
    if (!data) return;
    const student = data.students[studentIdx];
    if (!student) return;

    editingStudent = { cls, subj, studentIdx };
    document.getElementById('editStudentName').value = student.name;

    const container = document.getElementById('editGradesContainer');
    let html = '<label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Оценки по датам</label>';
    html += '<div class="max-h-[300px] overflow-y-auto space-y-2 pr-2">';

    (data.dates || []).forEach(d => {
        const grade = student.grades[d] || '';
        html += `<div class="flex items-center gap-3">
            <span class="text-sm text-slate-600 w-24 shrink-0">${formatDateDisplay(d)}</span>
            <select data-date="${d}" class="edit-grade-select px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" ${grade === '' ? 'selected' : ''}>—</option>
                <option value="2" ${grade === 2 ? 'selected' : ''}>2</option>
                <option value="3" ${grade === 3 ? 'selected' : ''}>3</option>
                <option value="4" ${grade === 4 ? 'selected' : ''}>4</option>
                <option value="5" ${grade === 5 ? 'selected' : ''}>5</option>
            </select>
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    editingStudent = null;
}

function saveEditStudent() {
    if (!editingStudent) return;
    const { cls, subj, studentIdx } = editingStudent;
    const student = APP_DATA.journal[cls][subj].students[studentIdx];

    const newName = document.getElementById('editStudentName').value.trim();
    if (!newName) { showToast('ФИО не может быть пустым', 'error'); return; }
    student.name = newName;

    document.querySelectorAll('.edit-grade-select').forEach(sel => {
        const date = sel.dataset.date;
        if (sel.value === '') {
            delete student.grades[date];
        } else {
            student.grades[date] = parseInt(sel.value);
        }
    });

    sortStudentsInClass(cls, subj);
    renderJournal();
    saveData();
    showToast('Данные обновлены', 'success');
}

// ===== МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ КЛАССА =====
function openAddClassModal() {
    document.getElementById('newClassName').value = '';
    document.getElementById('newClassStudents').value = '';
    document.getElementById('addClassModal').classList.remove('hidden');
}

function closeAddClassModal() {
    document.getElementById('addClassModal').classList.add('hidden');
}

function confirmAddClass() {
    const name = document.getElementById('newClassName').value.trim();
    if (!name) { showToast('Введите название класса', 'error'); return; }

    if (APP_DATA.classes.includes(name)) {
        showToast('Такой класс уже существует', 'error');
        return;
    }

    if (!isValidClassName(name)) {
        showToast('Ошибка: название класса должно быть в формате "ЦифраБуква" (например: 5А, 9Б, 11В). Цифры от 1 до 11, буквы А-Я (кроме Й,Ъ,Ь,Ы).', 'error');
        return;
    }

    APP_DATA.classes.push(name);
    APP_DATA.journal[name] = {};

    const studentsText = document.getElementById('newClassStudents').value.trim();
    const studentNames = [];
    
    if (studentsText) {
        const lines = studentsText.split('\n').map(l => l.trim()).filter(l => l);
        lines.forEach(line => {
            let studentName = line.replace(/^\d+[\.\)\s]+/, '').trim();
            studentName = studentName.replace(/^["']|["']$/g, '').trim();
            if (studentName && !studentNames.includes(studentName)) {
                studentNames.push(studentName);
            }
        });
    }

    for (const subj of APP_DATA.subjects) {
        APP_DATA.journal[name][subj] = {
            students: [],
            dates: generateClassDates(subj).slice(0, 12),
            topics: {},
            homework: {}
        };
        
        for (let i = 0; i < studentNames.length; i++) {
            APP_DATA.journal[name][subj].students.push({
                id: i + 1,
                name: studentNames[i],
                grades: {}
            });
        }
        sortStudentsInClass(name, subj);
    }

    populateAllDropdowns();
    document.getElementById('journalClass').value = name;
    renderJournal();
    saveData();
    closeAddClassModal();
    showToast(`Класс "${name}" создан с ${studentNames.length} учениками (для всех предметов)`, 'success');
}

// ===== УДАЛЕНИЕ КЛАССА =====
function deleteClass(className) {
    if (!className) {
        showToast('Выберите класс для удаления', 'error');
        return;
    }
    
    const exactClass = APP_DATA.classes.find(c => c === className);
    if (!exactClass) {
        showToast(`Класс "${className}" не найден`, 'error');
        return;
    }
    
    let hasStudents = false;
    for (const subj of APP_DATA.subjects) {
        const data = APP_DATA.journal[exactClass]?.[subj];
        if (data && data.students && data.students.length > 0) {
            hasStudents = true;
            break;
        }
    }
    
    let confirmMessage = `Удалить класс "${exactClass}"?`;
    if (hasStudents) {
        confirmMessage = `В классе "${exactClass}" есть ученики и оценки. Все данные будут безвозвратно удалены. Вы уверены?`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    delete APP_DATA.journal[exactClass];
    APP_DATA.classes = APP_DATA.classes.filter(c => c !== exactClass);
    
    const currentClass = document.getElementById('journalClass').value;
    if (currentClass === exactClass && APP_DATA.classes.length > 0) {
        document.getElementById('journalClass').value = APP_DATA.classes[0];
    }
    
    populateAllDropdowns();
    renderJournal();
    renderStatsTable();
    renderStatsGraphs();
    saveData();
    showToast(`Класс "${exactClass}" удалён`, 'success');
}

function openDeleteClassModal() {
    if (APP_DATA.classes.length === 0) {
        showToast('Нет классов для удаления', 'error');
        return;
    }
    
    const select = document.getElementById('deleteClassSelect');
    select.innerHTML = '<option value="">-- Выберите класс --</option>';
    APP_DATA.classes.forEach(cls => {
        select.innerHTML += `<option value="${cls.replace(/"/g, '&quot;')}">${cls}</option>`;
    });
    
    document.getElementById('deleteClassModal').classList.remove('hidden');
}

function closeDeleteClassModal() {
    document.getElementById('deleteClassModal').classList.add('hidden');
}

function confirmDeleteClass() {
    const select = document.getElementById('deleteClassSelect');
    const className = select.value;
    if (!className) {
        showToast('Выберите класс для удаления', 'error');
        return;
    }
    closeDeleteClassModal();
    deleteClass(className);
}

function handleAddClassFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;
        if (file.name.endsWith('.xlsx')) {
            const wb = XLSX.read(text, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            text = rows.map(r => r.join('\t')).join('\n');
        }
        const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l);
        const names = lines.map(l => {
            const parts = l.split(/[\t;]/);
            const namePart = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
            return namePart.replace(/^\d+[\.\)\s]+/, '').trim();
        }).filter(n => n);
        document.getElementById('newClassStudents').value = names.join('\n');
    };

    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

// ===== ИМПОРТ =====
function triggerImportMode(mode) {
    importMode = mode;

    document.querySelectorAll('.import-mode-card').forEach(c => {
        c.classList.remove('border-indigo-500', 'border-amber-500', 'border-emerald-500', 'bg-indigo-50/50', 'bg-amber-50/50', 'bg-emerald-50/50');
        c.classList.add('border-slate-200');
    });

    const card = document.getElementById('modeCard' + mode.charAt(0).toUpperCase() + mode.slice(1));
    if (card) {
        card.classList.remove('border-slate-200');
        const colorMap = { classlist: 'indigo', grades: 'amber', full: 'emerald' };
        const color = colorMap[mode] || 'indigo';
        card.classList.add(`border-${color}-500`, `bg-${color}-50/50`);
    }

    const indicator = document.getElementById('importModeIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        const labels = { classlist: '📋 Список класса', grades: '📊 Оценки одного класса', full: '📁 Общий список' };
        const bgMap = { classlist: 'bg-indigo-100 text-indigo-700', grades: 'bg-amber-100 text-amber-700', full: 'bg-emerald-100 text-emerald-700' };
        indicator.className = `mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${bgMap[mode]}`;
        indicator.innerHTML = `<span>${labels[mode]}</span>`;
    }

    const selectorsDiv = document.getElementById('importSelectors');
    const subjectWrap = document.getElementById('importSubjectWrap');
    const newClassWrap = document.getElementById('importNewClassWrap');
    
    if (selectorsDiv) {
        if (mode === 'classlist') {
            selectorsDiv.classList.remove('hidden');
            if (subjectWrap) subjectWrap.classList.add('hidden');
            if (newClassWrap) newClassWrap.classList.remove('hidden');
        } else if (mode === 'grades') {
            selectorsDiv.classList.remove('hidden');
            if (subjectWrap) subjectWrap.classList.remove('hidden');
            if (newClassWrap) newClassWrap.classList.add('hidden');
        } else if (mode === 'full') {
            selectorsDiv.classList.remove('hidden');
            if (subjectWrap) subjectWrap.classList.add('hidden');
            if (newClassWrap) newClassWrap.classList.add('hidden');
        }
    }

    const dropZoneHint = document.getElementById('dropZoneHint');
    if (dropZoneHint) dropZoneHint.textContent = 'Режим выбран — перетащите файл';

    if (mode === 'grades') {
        const subjSel = document.getElementById('importSubject');
        if (subjSel && !subjSel.value) subjSel.selectedIndex = 0;
    }
    
    const modeNames = { classlist: 'Список класса', grades: 'Оценки одного класса', full: 'Общий список' };
    showToast(`Выбран режим: ${modeNames[mode]}`, 'info');
}


function showImportPreview() {
    if (!importedData || importedData.length === 0) {
        showToast('Файл пуст или не удалось прочитать', 'error');
        return;
    }

    const preview = document.getElementById('importPreview');
    const thead = document.getElementById('importTableHead');
    const tbody = document.getElementById('importTableBody');
    const rowCount = document.getElementById('importRowCount');

    preview.classList.remove('hidden');
    document.getElementById('clearImportBtn').classList.remove('hidden');

    const headers = importedData[0] || [];
    const dataRows = importedData.slice(1);

    let headHTML = '<tr>';
    headers.forEach((h, i) => {
        headHTML += `<th>${escapeHTML(String(h || `Кол.${i + 1}`))}</th>`;
    });
    headHTML += '</tr>';
    thead.innerHTML = headHTML;

    let bodyHTML = '';
    dataRows.slice(0, 50).forEach(row => {
        bodyHTML += '<tr>';
        headers.forEach((_, i) => {
            bodyHTML += `<td>${escapeHTML(String(row[i] ?? ''))}</td>`;
        });
        bodyHTML += '</tr>';
    });
    tbody.innerHTML = bodyHTML;

    rowCount.textContent = `${dataRows.length} строк`;
}

function handleImportFileSelect(event) {
    const file = event.target.files[0];
    if (file) processImportFile(file);
}

function handleImportDrop(event) {
    event.preventDefault();
    event.target.closest('#dropZone')?.classList.remove('border-indigo-500', 'bg-indigo-50/50');
    const file = event.dataTransfer.files[0];
    if (file) processImportFile(file);
}

function processImportFile(file) {
    if (!importMode) {
        showToast('Сначала выберите режим загрузки', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        let text = e.target.result;

        if (file.name.endsWith('.xlsx')) {
            const wb = XLSX.read(text, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
            importedData = rows;
        } else {
            const lines = text.split(/[\r\n]+/).filter(l => l.trim());
            importedData = lines.map(line => {
                if (line.includes('\t')) return line.split('\t');
                if (line.includes(';')) return line.split(';');
                return line.split(',');
            });
        }

        showImportPreview();
    };

    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}



function clearImportPreview() {
    importedData = null;
    document.getElementById('importPreview').classList.add('hidden');
    document.getElementById('clearImportBtn').classList.add('hidden');
    document.getElementById('importFileInput').value = '';
}

function importToJournal() {


    if (!importedData || !importMode) {
        showToast('Нет данных для загрузки', 'error');
        return;
    }

    const headers = importedData[0] || [];
    const rows = importedData.slice(1);
    const firstRowHeaders = headers.map(h => String(h).toLowerCase());
    
    let className = document.getElementById('importClass').value;
    
    // ---- РЕЖИМ: Список класса (только ФИО, только полные) ----
if (importMode === 'classlist') {
    // Проверяем, выбран ли класс
    if (className === '__new__') {
        className = document.getElementById('importNewClassName').value.trim();
        if (!className) { 
            showToast('Введите название нового класса', 'error'); 
            return; 
        }
    }
    if (!className || className === '__new__') { 
        showToast('Выберите или введите название класса', 'error'); 
        return; 
    }
    
    if (!isValidClassName(className)) {
        showToast('Ошибка: название класса должно быть в формате "ЦифраБуква" (например: 5А, 9Б, 11В).', 'error');
        return;
    }

    // Создаём класс если его нет
    if (!APP_DATA.classes.includes(className)) {
        APP_DATA.classes.push(className);
        APP_DATA.journal[className] = {};
        for (const subj of APP_DATA.subjects) {
            APP_DATA.journal[className][subj] = {
                students: [],
                dates: generateClassDates(subj).slice(0, 12),
                topics: {},
                homework: {}
            };
        }
    }
    
    let addedCount = 0;
    let invalidCount = 0;
    const newStudentsList = [];
    
    rows.forEach(row => {
        if (!row || row.length === 0) return;
        let name = '';
        if (row.length === 1) {
            name = String(row[0]).trim();
        } else {
            name = row.slice(1).join(' ').trim();
        }
        name = name.replace(/^\d+[\.\)\s]+/, '').trim();
        name = name.replace(/^\uFEFF/, '').trim();
        
        // Проверка на полное ФИО (минимум 2 слова)
        const nameParts = name.split(/\s+/);
        if (nameParts.length < 2) {
            invalidCount++;
            return;
        }
        
        if (name && !newStudentsList.includes(name)) {
            newStudentsList.push(name);
        }
    });
    
    // Добавляем учеников ТОЛЬКО В ОДИН предмет (Алгебра, как основной)
    // Остальные предметы скопируют список позже
    const mainSubj = APP_DATA.subjects[0]; // Алгебра
    const data = APP_DATA.journal[className][mainSubj];
    
    for (const name of newStudentsList) {
        if (data.students.length >= 30) break;
        if (!data.students.some(s => normalizeString(s.name) === normalizeString(name))) {
            data.students.push({ id: data.students.length + 1, name, grades: {} });
            addedCount++;
        }
    }
    sortStudentsInClass(className, mainSubj);
    
    // Копируем список учеников на все остальные предметы
    for (const subj of APP_DATA.subjects) {
        if (subj === mainSubj) continue;
        const targetData = APP_DATA.journal[className][subj];
        if (targetData) {
            targetData.students = data.students.map((s, idx) => ({
                id: idx + 1,
                name: s.name,
                grades: {}
            }));
            sortStudentsInClass(className, subj);
        }
    }
    
    // Принудительно обновляем выпадающие списки
    populateAllDropdowns();
    
    // Автоматически выбираем созданный класс в журнале
    document.getElementById('journalClass').value = className;
    
    if (invalidCount > 0) {
        showToast(`Импортировано ${addedCount} учеников в класс "${className}". ${invalidCount} пропущено (неполное ФИО).`, 'warning');
    } else if (addedCount > 0) {
        showToast(`Импортировано ${addedCount} учеников в класс "${className}"`, 'success');
    } else {
        showToast(`Не добавлено ни одного ученика. Проверьте формат файла (требуется ФИО полностью).`, 'error');
    }
}


    
    // ---- РЕЖИМ: Оценки одного класса (ищем по полному ФИО) ----

   else if (importMode === 'grades') {
    // Берем класс из выпадающего списка импорта
    let targetClass = document.getElementById('importClass').value;
    
    // Проверка: выбран ли класс
    if (!targetClass || targetClass === '__new__') { 
        showToast('Выберите существующий класс из списка', 'error'); 
        return; 
    }
    
    const subj = document.getElementById('importSubject')?.value;
    if (!subj) { showToast('Выберите предмет', 'error'); return; }

    ensureClassSubject(targetClass, subj);
    const data = APP_DATA.journal[targetClass][subj];

    let gradesAdded = 0;
    let notFoundCount = 0;
    let invalidDateCount = 0;

    // Проходим по каждой строке данных (начиная с 1, т.к. 0 - заголовки)
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue;
        
        // Получаем ФИО (первая колонка)
        let name = String(row[0]).trim();
        // Убираем BOM символ если есть
        name = name.replace(/^\uFEFF/, '');
        // Убираем номер в начале если есть (например "1;Иванов")
        name = name.replace(/^\d+[\.\)\s;]+/, '').trim();
        
        // Предмет (вторая колонка)
        const subjectFromFile = String(row[1]).trim();
        
        // Дата (третья колонка)
        const dateStrRaw = String(row[2]).trim();
        
        // Оценка (четвертая колонка)
        const grade = parseInt(row[3]);
        
        // Проверка что предмет совпадает с выбранным
        if (subjectFromFile !== subj) continue;
        
        // Парсим дату
        let dateStr = parseDateFromInput(dateStrRaw);
        if (!dateStr) {
            // Пробуем другой формат: ДД.ММ.ГГГГ
            const parts = dateStrRaw.split('.');
            if (parts.length === 3) {
                const year = parts[2];
                const month = parts[1].padStart(2, '0');
                const day = parts[0].padStart(2, '0');
                if (year && month && day) {
                    dateStr = `${year}-${month}-${day}`;
                }
            }
        }
        
        if (!dateStr) {
            invalidDateCount++;
            continue;
        }
        
        if (isNaN(grade) || grade < 2 || grade > 5) continue;
        
        // Ищем ученика
        let student = data.students.find(s => normalizeString(s.name) === normalizeString(name));
        
        // Если не нашли точно, пробуем по первым двум словам
        if (!student) {
            const nameParts = name.split(/\s+/);
            if (nameParts.length >= 2) {
                const shortName = nameParts.slice(0, 2).join(' ');
                student = data.students.find(s => normalizeString(s.name).includes(normalizeString(shortName)));
            }
        }
        
        if (!student) {
            notFoundCount++;
            continue;
        }
        
        // Добавляем оценку
        if (!student.grades[dateStr]) gradesAdded++;
        student.grades[dateStr] = grade;
        
        // Добавляем дату в список если её нет
        if (!data.dates.includes(dateStr)) {
            data.dates.push(dateStr);
            data.dates.sort();
        }
    }
    
    sortStudentsInClass(targetClass, subj);
    renderJournal();
    saveData();
    
    // Показываем результат
    if (gradesAdded > 0) {
        let message = `Загружено ${gradesAdded} оценок`;
        if (notFoundCount > 0) message += `, ${notFoundCount} учеников не найдено`;
        if (invalidDateCount > 0) message += `, ${invalidDateCount} дат не распознано`;
        showToast(message, 'success');
    } else {
        let message = 'Не загружено ни одной оценки. ';
        if (notFoundCount > 0) message += `Не найдено учеников: ${notFoundCount}. `;
        if (invalidDateCount > 0) message += `Не распознано дат: ${invalidDateCount}. `;
        message += 'Проверьте ФИО (должны совпадать с журналом) и формат даты (ДД.ММ или ДД.ММ.ГГГГ)';
        showToast(message, 'error');
    }
}
    

// ---- РЕЖИМ: Общий список (полный формат: Класс;Предмет;ФИО;Дата;Оценка) ----
else if (importMode === 'full') {
    let gradesAdded = 0;
    let newStudentsCount = 0;
    let newClassesCount = 0;
    let invalidRowsCount = 0;
    let foundBySearchCount = 0; // сколько найдено по поиску без класса
    
    // Для отслеживания уникальных классов и учеников
    const uniqueClasses = new Set();
    const uniqueStudentsPerClass = {};
    
    // Первый проход: собираем уникальные классы и учеников (только где указан класс)
    for (const row of rows) {
        if (!row || row.length < 5) continue;
        
        const cls = String(row[0]).trim();
        let name = String(row[2]).trim().replace(/^\d+[\.\)\s]+/, '');
        name = name.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
        
        if (!cls || !name) continue;
        
        const nameParts = name.split(/\s+/);
        const isFullName = nameParts.length >= 2;
        
        if (!isFullName) {
            invalidRowsCount++;
            continue;
        }
        
        uniqueClasses.add(cls);
        if (!uniqueStudentsPerClass[cls]) uniqueStudentsPerClass[cls] = new Set();
        uniqueStudentsPerClass[cls].add(name);
    }
    
    // Создаём новые классы со всеми предметами (только где указан класс)
    for (const cls of uniqueClasses) {
        if (!APP_DATA.classes.includes(cls)) {
            APP_DATA.classes.push(cls);
            APP_DATA.journal[cls] = {};
            for (const subj of APP_DATA.subjects) {
                APP_DATA.journal[cls][subj] = {
                    students: [],
                    dates: generateClassDates(subj).slice(0, 12),
                    topics: {},
                    homework: {}
                };
            }
            newClassesCount++;
        }
        
        // Добавляем уникальных учеников в основной предмет (Алгебра)
        const mainSubj = APP_DATA.subjects[0];
        const existingNames = new Set(APP_DATA.journal[cls][mainSubj].students.map(s => s.name));
        
        for (const name of (uniqueStudentsPerClass[cls] || [])) {
            if (!existingNames.has(normalizeString(name))) {
                APP_DATA.journal[cls][mainSubj].students.push({
                    id: APP_DATA.journal[cls][mainSubj].students.length + 1,
                    name: name,
                    grades: {}
                });
                newStudentsCount++;
            }
        }
        sortStudentsInClass(cls, mainSubj);
        
        // Копируем учеников на все остальные предметы
        const mainStudents = APP_DATA.journal[cls][mainSubj].students;
        for (const subj of APP_DATA.subjects) {
            if (subj === mainSubj) continue;
            const targetData = APP_DATA.journal[cls][subj];
            if (targetData) {
                targetData.students = mainStudents.map((s, idx) => ({
                    id: idx + 1,
                    name: s.name,
                    grades: {}
                }));
                sortStudentsInClass(cls, subj);
            }
        }
    }
    
    // Второй проход: добавляем оценки (с поддержкой пустого класса)
    for (const row of rows) {
        if (!row || row.length < 5) continue;
        
        const clsRaw = String(row[0]).trim();
        const subj = String(row[1]).trim();
        let name = String(row[2]).trim().replace(/^\d+[\.\)\s]+/, '');
        name = name.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim();
        const dateStrRaw = String(row[3]).trim();
        const grade = parseInt(row[4]);
        
        // Проверка на полное ФИО
        const nameParts = name.split(/\s+/);
        if (nameParts.length < 2) continue;
        
        // Парсим дату
        let dateStr = parseDateFromInput(dateStrRaw);
        if (!dateStr) {
            const parts = dateStrRaw.split('.');
            if (parts.length === 3) {
                const year = parts[2];
                const month = parts[1].padStart(2, '0');
                const day = parts[0].padStart(2, '0');
                if (year && month && day) {
                    dateStr = `${year}-${month}-${day}`;
                }
            }
        }
        
        if (!dateStr || isNaN(grade) || grade < 2 || grade > 5) continue;
        
        // Определяем класс для добавления оценки
        let targetClass = clsRaw;
        let foundStudent = null;
        let foundClass = null;
        
        if (targetClass) {
            // Класс указан — ищем ученика в этом классе
            if (APP_DATA.journal[targetClass] && APP_DATA.journal[targetClass][subj]) {
               foundStudent = APP_DATA.journal[targetClass][subj].students.find(s => normalizeString(s.name) === normalizeString(name));
                if (foundStudent) foundClass = targetClass;
            }
        } else {
            // Класс не указан — ищем ученика по ФИО во всех классах
            for (const cls of APP_DATA.classes) {
                const data = APP_DATA.journal[cls]?.[subj];
                if (data) {
                    const student = data.students.find(s => normalizeString(s.name) === normalizeString(name));
                    if (student) {
                        foundStudent = student;
                        foundClass = cls;
                        foundBySearchCount++;
                        break;
                    }
                }
            }
        }
        
        if (!foundStudent) continue;
        
        // Убеждаемся, что структура для предмета существует
        if (!APP_DATA.journal[foundClass][subj]) {
            APP_DATA.journal[foundClass][subj] = {
                students: APP_DATA.journal[foundClass][APP_DATA.subjects[0]].students.map((s, idx) => ({
                    id: idx + 1,
                    name: s.name,
                    grades: {}
                })),
                dates: generateClassDates(subj).slice(0, 12),
                topics: {},
                homework: {}
            };
        }
        
        const data = APP_DATA.journal[foundClass][subj];
        
        // Добавляем оценку
        if (!foundStudent.grades[dateStr]) gradesAdded++;
        foundStudent.grades[dateStr] = grade;
        
        if (!data.dates.includes(dateStr)) {
            data.dates.push(dateStr);
            data.dates.sort();
        }
    }
    
    // Формируем сообщение
    let messageParts = [];
    if (gradesAdded > 0) messageParts.push(`загружено ${gradesAdded} оценок`);
    if (foundBySearchCount > 0) messageParts.push(`${foundBySearchCount} найдено по ФИО (без класса)`);
    if (newStudentsCount > 0) messageParts.push(`добавлено ${newStudentsCount} учеников`);
    if (newClassesCount > 0) messageParts.push(`создано ${newClassesCount} классов`);
    if (invalidRowsCount > 0) messageParts.push(`пропущено ${invalidRowsCount} строк (неполное ФИО)`);
    
    if (messageParts.length > 0) {
        showToast(messageParts.join(', '), 'success');
    } else {
        showToast('Не загружено никаких данных. Проверьте формат файла.', 'error');
    }
    
    // Обновляем интерфейс
    populateAllDropdowns();
    renderJournal();
    saveData();
}
}

// ===== СКАЧИВАНИЕ ПРИМЕРОВ И ШАБЛОНОВ =====
function downloadSampleCSV(type) {
    let csv = '';
    if (type === 'classlist') {
        csv = 'ФИО\nИванов Иван Иванович\nПетрова Мария Сергеевна\nСидоров Алексей Николаевич';
    } else if (type === 'grades') {
        csv = 'ФИО;Предмет;Дата;Оценка\nИванов Иван Иванович;Алгебра;02.09.2024;5\nИванов Иван Иванович;Алгебра;09.09.2024;4\nПетрова Мария Сергеевна;Алгебра;02.09.2024;4\nПетрова Мария Сергеевна;Алгебра;09.09.2024;5';
    } else if (type === 'full') {
        csv = 'Класс;Предмет;ФИО;Дата;Оценка\n11А;Алгебра;Иванов Иван Иванович;02.09.2024;5\n11А;Алгебра;Иванов Иван Иванович;09.09.2024;4\n11А;Алгебра;Петрова Мария Сергеевна;02.09.2024;4';
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sample_${type}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function downloadEmptyTemplate(type) {
    let csv = '';
    if (type === 'classlist') {
        csv = 'ФИО\n';
    } else if (type === 'grades') {
        csv = 'ФИО;Предмет;Дата;Оценка\n';
    } else if (type === 'full') {
        csv = 'Класс;Предмет;ФИО;Дата;Оценка\n';
    }
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${type}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Шаблон скачан', 'success');
}

// ===== ЭКСПОРТ ЖУРНАЛА =====
function exportJournalCSV() {
    if (!APP_DATA.journal || Object.keys(APP_DATA.journal).length === 0) {
        showToast('Нет данных для экспорта', 'error');
        return;
    }

    let csv = 'Класс;Предмет;ФИО;Дата;Оценка\n';

    for (const cls of Object.keys(APP_DATA.journal)) {
        for (const subj of Object.keys(APP_DATA.journal[cls])) {
            const data = APP_DATA.journal[cls][subj];
            (data.students || []).forEach(student => {
                const grades = student.grades || {};
                for (const [date, grade] of Object.entries(grades)) {
                    if (grade > 0) {
                        const [y, m, d] = date.split('-');
                        csv += `${cls};${subj};${student.name};${d}.${m}.${y};${grade}\n`;
                    }
                }
            });
        }
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gradebook_export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Данные экспортированы', 'success');
}

// ===== СТАТИСТИКА =====
// ===== СТАТИСТИКА =====
function renderStatsTable() {
    const clsVal = document.getElementById('statsClass')?.value;
    const subjVal = document.getElementById('statsSubject')?.value;
    const overallSubjVal = document.getElementById('statsOverallSubject')?.value;

    renderClassStats(clsVal, subjVal);
    renderOverallStats(overallSubjVal);
}

function renderClassStats(clsVal, subjVal) {
    const container = document.getElementById('statsClassContent');
    if (!container) return;

    if (!clsVal || !subjVal) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Выберите класс и предмет</div>';
        return;
    }

    const data = APP_DATA.journal[clsVal]?.[subjVal];
    if (!data || !data.students || data.students.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Нет данных для выбранного класса и предмета</div>';
        return;
    }

    const stats = calcStats(data.students);

    let html = `
        <div class="mb-6">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                <span class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">📓</span>
                ${escapeHTML(clsVal)} — ${escapeHTML(subjVal)}
            </h2>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
                    <div class="text-center"><div class="text-2xl font-bold text-indigo-600">${stats.count}</div><div class="text-xs text-slate-500 mt-1">Студентов</div></div>
                    <div class="text-center"><div class="text-2xl font-bold text-emerald-600">${stats.avg}</div><div class="text-xs text-slate-500 mt-1">Средний балл</div></div>
                    <div class="text-center"><div class="text-2xl font-bold text-blue-600">${stats.median}</div><div class="text-xs text-slate-500 mt-1">Медиана</div></div>
                    <div class="text-center"><div class="text-2xl font-bold text-amber-600">${stats.totalGrades}</div><div class="text-xs text-slate-500 mt-1">Всего оценок</div></div>
                </div>
                <table class="w-full stats-table">
                    <thead><tr><th>Оценка</th><th>Количество</th><th>Процент</th></tr></thead>
                    <tbody>`;
    
    [5, 4, 3, 2].forEach(g => {
        const cnt = stats.distribution[g] || 0;
        const pct = stats.totalGrades > 0 ? ((cnt / stats.totalGrades) * 100).toFixed(1) : '0.0';
        const colors = { 5: 'text-emerald-600', 4: 'text-blue-600', 3: 'text-amber-600', 2: 'text-rose-600' };
        html += `<tr><td class="font-bold ${colors[g]}">${g}</td><td>${cnt}</td><td>${pct}%</td></tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
}

function renderOverallStats(subjVal) {
    const container = document.getElementById('statsOverallContent');
    if (!container) return;

    if (!subjVal) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Выберите предмет</div>';
        return;
    }

    let allGrades = [];
    let studentCount = 0;

    APP_DATA.classes.forEach(cls => {
        const data = APP_DATA.journal[cls]?.[subjVal];
        if (data && data.students) {
            data.students.forEach(s => {
                const grades = Object.values(s.grades || {}).filter(g => g > 0);
                if (grades.length > 0) {
                    allGrades.push(...grades);
                    studentCount++;
                }
            });
        }
    });

    if (allGrades.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Нет данных для выбранного предмета</div>';
        return;
    }

    const avg = (allGrades.reduce((s, g) => s + g, 0) / allGrades.length).toFixed(2);
    const sorted = [...allGrades].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2) : sorted[Math.floor(sorted.length / 2)];
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0 };
    allGrades.forEach(g => dist[g]++);

    let html = `
        <div class="mb-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-slate-100"><h3 class="font-semibold text-slate-800">${escapeHTML(subjVal)} (все классы)</h3></div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                <div class="text-center"><div class="text-xl font-bold text-slate-700">${studentCount}</div><div class="text-xs text-slate-500">Учеников</div></div>
                <div class="text-center"><div class="text-xl font-bold text-emerald-600">${avg}</div><div class="text-xs text-slate-500">Средний</div></div>
                <div class="text-center"><div class="text-xl font-bold text-blue-600">${median}</div><div class="text-xs text-slate-500">Медиана</div></div>
                <div class="text-center"><div class="text-xl font-bold text-amber-600">${allGrades.length}</div><div class="text-xs text-slate-500">Оценок</div></div>
            </div>
            <div class="flex gap-2 px-5 pb-4">${[5,4,3,2].map(g => `<span class="px-2 py-1 rounded-lg text-xs font-medium bg-${g===5?'emerald':g===4?'blue':g===3?'amber':'rose'}-100 text-${g===5?'emerald':g===4?'blue':g===3?'amber':'rose'}-700">${g}: ${dist[g]} (${allGrades.length>0?((dist[g]/allGrades.length)*100).toFixed(0):0}%)</span>`).join('')}</div>
        </div>`;

    container.innerHTML = html;
}

function calcStats(students) {
    const allGrades = [];
    students.forEach(s => {
        Object.values(s.grades || {}).forEach(g => { if (g > 0) allGrades.push(g); });
    });

    const count = students.length;
    const totalGrades = allGrades.length;
    const avg = totalGrades > 0 ? (allGrades.reduce((s, g) => s + g, 0) / totalGrades).toFixed(2) : '—';
    const sorted = [...allGrades].sort((a, b) => a - b);
    let median = '—';
    if (sorted.length > 0) {
        median = sorted.length % 2 === 0 ? ((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2) : sorted[Math.floor(sorted.length / 2)];
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0 };
    allGrades.forEach(g => distribution[g]++);
    return { count, avg, median, totalGrades, distribution };
}

// ===== ГРАФИКИ =====
function renderStatsGraphs() {
    const clsVal = document.getElementById('graphsClass')?.value;
    const subjVal = document.getElementById('graphsSubject')?.value;
    const overallSubjVal = document.getElementById('graphsOverallSubject')?.value;
    
    const container = document.getElementById('graphsContent');
    if (!container) return;

    // Очищаем предыдущие графики
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};
    
    let html = '<div class="grid grid-cols-1 gap-6">';
    
    // График 1: выбранный класс + предмет
    if (clsVal && subjVal) {
        const data = APP_DATA.journal[clsVal]?.[subjVal];
        if (data && data.students && data.students.length > 0) {
            const stats = calcStats(data.students);
            html += `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-3">${escapeHTML(clsVal)} — ${escapeHTML(subjVal)}</h3>
                    <canvas id="chart_class" height="250"></canvas>
                    <div class="mt-3 text-sm text-slate-500">Средний: <span class="font-bold text-emerald-600">${stats.avg}</span> | Учеников: <span class="font-bold">${stats.count}</span> | Оценок: <span class="font-bold">${stats.totalGrades}</span></div>
                </div>`;
        } else {
            html += `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center text-slate-400">Нет данных для выбранного класса и предмета</div>`;
        }
    } else {
        html += `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center text-slate-400">Выберите класс и предмет для просмотра графика</div>`;
    }
    
    // График 2: все классы по выбранному предмету
    if (overallSubjVal) {
        let allGrades = [];
        APP_DATA.classes.forEach(cls => {
            const data = APP_DATA.journal[cls]?.[overallSubjVal];
            if (data && data.students) {
                data.students.forEach(s => {
                    Object.values(s.grades || {}).forEach(g => { if (g > 0) allGrades.push(g); });
                });
            }
        });
        
        if (allGrades.length > 0) {
            const dist = { 5: 0, 4: 0, 3: 0, 2: 0 };
            allGrades.forEach(g => dist[g]++);
            html += `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-3">🌍 ${escapeHTML(overallSubjVal)} (все классы)</h3>
                    <canvas id="chart_overall" height="250"></canvas>
                    <div class="mt-3 text-sm text-slate-500">Всего оценок: <span class="font-bold">${allGrades.length}</span></div>
                </div>`;
        } else {
            html += `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center text-slate-400">Нет данных для выбранного предмета</div>`;
        }
    } else {
        html += `<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center text-slate-400">Выберите предмет для просмотра общей статистики</div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Создаём графики
    if (clsVal && subjVal) {
        const data = APP_DATA.journal[clsVal]?.[subjVal];
        if (data && data.students && data.students.length > 0) {
            const stats = calcStats(data.students);
            createBarChart('chart_class', stats.distribution);
        }
    }
    
    if (overallSubjVal) {
        let allGrades = [];
        APP_DATA.classes.forEach(cls => {
            const data = APP_DATA.journal[cls]?.[overallSubjVal];
            if (data && data.students) {
                data.students.forEach(s => {
                    Object.values(s.grades || {}).forEach(g => { if (g > 0) allGrades.push(g); });
                });
            }
        });
        if (allGrades.length > 0) {
            const dist = { 5: 0, 4: 0, 3: 0, 2: 0 };
            allGrades.forEach(g => dist[g]++);
            createBarChart('chart_overall', dist);
        }
    }
}

function createBarChart(canvasId, distribution) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['5 (отлично)', '4 (хорошо)', '3 (удовл.)', '2 (неудовл.)'],
            datasets: [{
                label: 'Количество оценок',
                data: [distribution[5] || 0, distribution[4] || 0, distribution[3] || 0, distribution[2] || 0],
                backgroundColor: ['#059669', '#2563eb', '#d97706', '#dc2626'],
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: '#f1f5f9' } }, x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false } } }
        }
    });
    chartInstances[canvasId] = chart;
}

// ===== СПРАВКА =====
function toggleHelp(btn) {
    const body = btn.nextElementSibling;
    const chevron = btn.querySelector('.help-chevron');
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        chevron?.classList.add('rotated');
    } else {
        body.classList.add('hidden');
        chevron?.classList.remove('rotated');
    }
}

// ===== СОРТИРОВКА =====
function sortStudentsInClass(cls, subj) {
    const data = APP_DATA.journal[cls]?.[subj];
    if (!data || !data.students) return;
    data.students.sort((a, b) => {
        const nameA = normalizeString(a.name || '').toLowerCase();
	const nameB = normalizeString(b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    data.students.forEach((student, idx) => { student.id = idx + 1; });
}

function sortAllStudents() {
    for (const cls of Object.keys(APP_DATA.journal)) {
        for (const subj of Object.keys(APP_DATA.journal[cls])) {
            sortStudentsInClass(cls, subj);
        }
    }
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const content = document.getElementById('toastContent');
    if (!toast || !content) return;
    const bgMap = { success: 'toast-success', error: 'toast-error', info: 'toast-info' };
    content.className = `px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${bgMap[type] || 'toast-info'}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    content.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${escapeHTML(message)}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Экспорт функций в глобальную область
window.switchTab = switchTab;
window.triggerImportMode = triggerImportMode;
window.handleImportFileSelect = handleImportFileSelect;
window.handleImportDrop = handleImportDrop;
window.importToJournal = importToJournal;
window.downloadSampleCSV = downloadSampleCSV;
window.downloadEmptyTemplate = downloadEmptyTemplate;
window.clearImportPreview = clearImportPreview;
window.addDate = addDate;
window.removeDate = removeDate;
window.openGradeEdit = openGradeEdit;
window.setGrade = setGrade;
window.closeGradeModal = closeGradeModal;
window.openTopicEdit = openTopicEdit;
window.saveTopicEdit = saveTopicEdit;
window.closeTopicModal = closeTopicModal;
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditStudent = saveEditStudent;
window.openAddClassModal = openAddClassModal;
window.closeAddClassModal = closeAddClassModal;
window.confirmAddClass = confirmAddClass;
window.handleAddClassFile = handleAddClassFile;
window.openDeleteClassModal = openDeleteClassModal;
window.closeDeleteClassModal = closeDeleteClassModal;
window.confirmDeleteClass = confirmDeleteClass;
window.deleteClass = deleteClass;
window.exportJournalCSV = exportJournalCSV;
window.onImportClassChange = onImportClassChange;
