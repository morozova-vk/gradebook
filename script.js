/* ===== Custom Scrollbar ===== */
.journal-scroll::-webkit-scrollbar {
    height: 6px;
    width: 6px;
}
.journal-scroll::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 3px;
}
.journal-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}
.journal-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* ===== Tab Styles ===== */
.tab-btn {
    color: #64748b;
    background: transparent;
}
.tab-btn:hover {
    color: #4f46e5;
    background: #eef2ff;
}
.tab-btn.active {
    color: #4f46e5;
    background: #eef2ff;
    font-weight: 600;
}

/* ===== Journal Table — Grid Notebook Style ===== */
.journal-notebook {
    background: #ffffff;
    position: relative;
}

.journal-table {
    border-collapse: collapse;
    font-size: 0.8rem;
}

.journal-table thead th {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #f0f4ff;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    color: #64748b;
    padding: 6px 8px;
    border: 1px solid #d1d9e6;
    white-space: nowrap;
}

.journal-table tbody td {
    padding: 4px 6px;
    border: 1px solid #e8ecf2;
    white-space: nowrap;
    color: #334155;
    background: #ffffff;
}

.journal-table tbody tr:nth-child(even) td {
    background: #fafbfe;
}

.journal-table tbody tr:hover td {
    background: #f0f4ff !important;
}

/* Sticky columns */
.journal-table .sticky-col {
    position: sticky;
    z-index: 10;
}
.journal-table .sticky-col-0 { left: 0; min-width: 36px; background: #fff; }
.journal-table .sticky-col-1 { left: 36px; min-width: 180px; background: #fff; }
.journal-table .sticky-col-2 { left: 216px; min-width: 56px; background: #fff; }

.journal-table thead th.sticky-col {
    z-index: 25;
}
.journal-table thead th.sticky-col-0 { left: 0; background: #f0f4ff; }
.journal-table thead th.sticky-col-1 { left: 36px; background: #f0f4ff; }
.journal-table thead th.sticky-col-2 { left: 216px; background: #f0f4ff; }

/* Row stripe for sticky cols */
.journal-table tbody tr:nth-child(even) td.sticky-col { background: #fafbfe; }
.journal-table tbody tr:nth-child(odd) td.sticky-col { background: #ffffff; }
.journal-table tbody tr:hover td.sticky-col { background: #f0f4ff !important; }

/* Shadow for last sticky col */
.journal-table .sticky-col-2::after {
    content: '';
    position: absolute;
    top: 0;
    right: -5px;
    bottom: 0;
    width: 5px;
    background: linear-gradient(to right, rgba(0,0,0,0.05), transparent);
    pointer-events: none;
}

/* Name cell */
.name-cell {
    font-weight: 500;
    font-size: 0.78rem;
}

/* Date column header */
.date-col {
    min-width: 42px;
}
.date-label {
    font-size: 0.6rem;
    color: #94a3b8;
}

/* Actions column */
.act-col {
    min-width: 64px;
}

/* Grade cell */
.grade-cell {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    transition: all 0.12s;
    font-weight: 600;
    font-size: 0.8rem;
}
.grade-cell:hover {
    background: #e0e7ff !important;
    transform: scale(1.1);
}
.grade-cell.empty-grade {
    color: #cbd5e1;
    font-weight: 400;
}
.grade-cell.grade-5 { color: #059669; background: #ecfdf5; }
.grade-cell.grade-4 { color: #2563eb; background: #eff6ff; }
.grade-cell.grade-3 { color: #d97706; background: #fffbeb; }
.grade-cell.grade-2 { color: #dc2626; background: #fef2f2; }

/* Action buttons */
.act-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 0.7rem;
    transition: all 0.12s;
    border: none;
    background: transparent;
    cursor: pointer;
}
.edit-btn:hover { background: #e0e7ff; }
.del-btn:hover { background: #ffe4e6; }

/* ===== Help Accordion ===== */
.help-body {
    animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}

.help-chevron.rotated {
    transform: rotate(180deg);
}

/* ===== Tab Content Transition ===== */
.tab-content {
    animation: fadeIn 0.25s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ===== Stats Table ===== */
.stats-table {
    border-collapse: separate;
    border-spacing: 0;
}
.stats-table th {
    background: #f8fafc;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    padding: 10px 14px;
    border-bottom: 2px solid #e2e8f0;
}
.stats-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.875rem;
    color: #334155;
}

/* ===== Toast ===== */
.toast-success { background: #065f46; color: white; }
.toast-error { background: #991b1b; color: white; }
.toast-info { background: #1e40af; color: white; }

/* ===== Drop Zone Active ===== */
.drop-active {
    border-color: #6366f1 !important;
    background: #eef2ff !important;
}

/* ===== Import Table ===== */
#importTable th {
    background: #f8fafc;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    padding: 10px 14px;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
    position: sticky;
    top: 0;
}
#importTable td {
    padding: 8px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.8rem;
    color: #334155;
    white-space: nowrap;
}

/* ===== Grade Pick Buttons ===== */
.grade-pick-btn {
    cursor: pointer;
    border: 2px solid transparent;
}
.grade-pick-btn:hover {
    transform: scale(1.08);
}
.grade-pick-btn.ring-2 {
    border-width: 2px;
    border-color: currentColor;
}

/* ===== Topic / Homework Rows ===== */
.topic-row td, .homework-row td {
    font-size: 0.7rem !important;
}
.topic-row td:hover, .homework-row td:hover {
    background: #f0f4ff !important;
}

/* ===== Date Remove Button ===== */
.date-col button {
    line-height: 1;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
    .journal-table .sticky-col-1 { min-width: 130px; left: 32px; }
    .journal-table .sticky-col-2 { left: 162px; min-width: 48px; }
    .journal-table thead th.sticky-col-1 { left: 32px; }
    .journal-table thead th.sticky-col-2 { left: 162px; }
    .journal-table .sticky-col-0 { min-width: 32px; }
    .journal-table { font-size: 0.72rem; }
    .grade-cell { width: 24px; height: 24px; font-size: 0.72rem; }
}

/* Исправление для графиков */
#graphsContent {
    min-height: 400px;
}
#graphsContent canvas {
    max-height: 250px !important;
    width: 100% !important;
}
/* Выравнивание таблицы статистики по правому краю */
.stats-table th,
.stats-table td {
    text-align: left !important;
}

.stats-table th:first-child,
.stats-table td:first-child {
    text-align: left !important;
}
/* Центрирование карточек статистики */
#statsClassContent .grid div,
#statsOverallContent .grid div {
    text-align: center;
}
/* ===== Цветовая схема ===== */
/* Основные цвета берутся из tailwind.config.brand */
.tab-btn.active {
    background: #eef2ff;
    color: #4f46e5;
}

/* Адаптация под выбранный цвет */
.bg-indigo-600, .bg-indigo-500, .bg-indigo-100, 
.text-indigo-600, .text-indigo-500, 
.border-indigo-500, .ring-indigo-500 {
    transition: all 0.2s ease;
}

/* Кнопка сохранения */
.bg-emerald-600 {
    background: #16a34a;
}
.bg-emerald-600:hover {
    background: #15803d;
}
