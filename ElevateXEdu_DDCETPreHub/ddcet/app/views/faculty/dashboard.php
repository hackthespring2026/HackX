<?php
session_start();
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../app/models/Question.php';

$model    = new Question();
$subjects = $model->getAllSubjects();
$error    = $_SESSION['error'] ?? '';
unset($_SESSION['error']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Dashboard - DDCETPrepHub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .sidebar { background: linear-gradient(180deg,#1E3A8A 0%,#1e40af 100%); }
        .nav-active { background:rgba(6,182,212,.2); border-left:3px solid #06B6D4; }
        .btn-cyan  { background:#06B6D4; transition:all .2s; }
        .btn-cyan:hover  { background:#0891b2; transform:translateY(-1px); }
        .btn-navy  { background:#1E3A8A; transition:all .2s; }
        .btn-navy:hover  { background:#1e40af; transform:translateY(-1px); }
        .step-badge { background:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; padding:2px 10px; border-radius:20px; }

        /* ── Multi-select dropdown ── */
        .multi-select-wrapper { position:relative; }
        .multi-select-display {
            border:1.5px solid #e2e8f0; border-radius:12px;
            padding:10px 16px; background:#f8fafc; cursor:pointer;
            min-height:46px; display:flex; align-items:center;
            justify-content:space-between; transition:border-color .2s;
            user-select:none;
        }
        .multi-select-display:hover, .multi-select-display.open { border-color:#06B6D4; box-shadow:0 0 0 3px rgba(6,182,212,.1); }
        .multi-select-dropdown {
            position:absolute; top:calc(100% + 4px); left:0; right:0;
            background:#fff; border:1.5px solid #06B6D4;
            border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,.12);
            z-index:100; max-height:220px; overflow-y:auto; display:none;
        }
        .multi-select-dropdown.open { display:block; }
        .ms-option {
            display:flex; align-items:center; gap:10px;
            padding:10px 14px; cursor:pointer; font-size:14px;
            color:#374151; transition:background .15s;
        }
        .ms-option:hover { background:#f0f9ff; }
        .ms-option input[type="checkbox"] { width:16px; height:16px; accent-color:#06B6D4; cursor:pointer; }
        .ms-select-all { border-bottom:1px solid #e5e7eb; font-weight:600; color:#0369a1; background:#f0f9ff; }
        .ms-empty { padding:12px 14px; color:#9ca3af; font-size:14px; }
        .ms-tag {
            display:inline-flex; align-items:center; gap:5px;
            background:#dbeafe; color:#1d4ed8; border-radius:20px;
            padding:2px 10px; font-size:12px; font-weight:600;
        }
        .ms-tags { display:flex; flex-wrap:wrap; gap:5px; }
        .ms-arrow { flex-shrink:0; color:#9ca3af; transition:transform .2s; }
        .ms-arrow.open { transform:rotate(180deg); }

        /* Topic chips */
        .topic-chip label {
            display:flex; align-items:center; gap:8px; cursor:pointer;
            background:#fff; border:2px solid #e2e8f0;
            border-radius:10px; padding:8px 14px; font-size:13px;
            font-weight:500; color:#374151; transition:all .15s;
        }
        .topic-chip label:hover { border-color:#06B6D4; background:#f0f9ff; }
        .topic-chip input:checked + label,
        .topic-chip label:has(input:checked) { background:#06B6D4; color:#fff; border-color:#06B6D4; }

        select, input[type="text"], input[type="number"] {
            border:1.5px solid #e2e8f0; transition:border-color .2s;
        }
        select:focus, input:focus { outline:none; border-color:#06B6D4; box-shadow:0 0 0 3px rgba(6,182,212,.1); }
    </style>
</head>
<body class="bg-gray-50 font-sans">
<div class="flex h-screen overflow-hidden">

    <!-- SIDEBAR -->
    <div class="sidebar w-64 flex-shrink-0 flex flex-col text-white">
        <div class="px-6 py-5 border-b border-blue-700">
            <div class="flex items-center gap-2">
                <span class="text-2xl">📖</span>
                <div>
                    <span class="text-white font-bold text-lg">DDCET</span><span style="color:#06B6D4" class="font-bold text-lg">PrepHub</span>
                    <p class="text-blue-300 text-xs">Faculty Portal</p>
                </div>
            </div>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-1">
            <a href="dashboard.php" class="nav-active flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Generate Paper
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-700 hover:text-white transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                My Papers
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-700 hover:text-white transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Profile
            </a>
        </nav>
        <div class="px-3 py-4 border-t border-blue-700">
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200 hover:bg-red-600 hover:text-white transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Logout
            </a>
        </div>
    </div>

    <!-- MAIN -->
    <div class="flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto px-8 py-8">

            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">Generate Exam Paper</h1>
                <p class="text-gray-500 mt-1">Create customized MCQ papers from question bank</p>
            </div>

            <?php if ($error): ?>
            <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                <?= htmlspecialchars($error) ?>
            </div>
            <?php endif; ?>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

                <!-- STEP 1 -->
                <div>
                    <div class="flex items-center gap-3 mb-6">
                        <span class="step-badge">STEP 1</span>
                        <h2 class="text-lg font-bold text-gray-800">Subject & Topic Selection</h2>
                    </div>

                    <!-- Subject -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Subject <span class="text-red-500">*</span></label>
                        <select id="subject_id" name="subject_id"
                            class="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm">
                            <option value="">Select Subject</option>
                            <?php foreach ($subjects as $s): ?>
                            <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <!-- Chapters — Custom Multi-select Dropdown -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Chapters <span class="text-red-500">*</span>
                            <span class="text-gray-400 font-normal text-xs ml-1">(Select multiple)</span>
                        </label>
                        <div class="multi-select-wrapper" id="chapter_wrapper">
                            <div class="multi-select-display" id="chapter_display" onclick="toggleChapterDropdown()">
                                <span id="chapter_display_text" class="text-gray-400 text-sm">Select Subject first</span>
                                <svg class="ms-arrow w-4 h-4" id="chapter_arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                            </div>
                            <div class="multi-select-dropdown" id="chapter_dropdown">
                                <div class="ms-empty" id="chapter_empty">Select a subject first</div>
                            </div>
                        </div>
                    </div>

                    <!-- Topics — Chips (multi-select) -->
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            Topics <span class="text-red-500">*</span>
                            <span class="text-gray-400 font-normal text-xs ml-1">(Select multiple)</span>
                        </label>
                        <div id="topics_container" class="min-h-14 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p id="topics_placeholder" class="text-gray-400 text-sm">Select chapters first</p>
                            <div id="topics_list" class="flex flex-wrap gap-2 hidden"></div>
                        </div>
                        <div id="topic_actions" class="mt-2 hidden flex gap-3">
                            <button type="button" onclick="selectAllTopics()" class="text-xs text-cyan-600 font-semibold underline">Select All</button>
                            <button type="button" onclick="deselectAllTopics()" class="text-xs text-gray-500 font-semibold underline">Deselect All</button>
                        </div>
                    </div>
                </div>

                <hr class="border-gray-100">

                <!-- STEP 2 -->
                <div>
                    <div class="flex items-center gap-3 mb-6">
                        <span class="step-badge">STEP 2</span>
                        <h2 class="text-lg font-bold text-gray-800">Difficulty & Question Count</h2>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Difficulty Levels <span class="text-red-500">*</span></label>
                        <div class="flex flex-wrap gap-4">
                            <?php foreach (['easy'=>'Easy','moderate'=>'Moderate','hard'=>'Hard','advanced'=>'Advanced','tricky'=>'Tricky'] as $val=>$label): ?>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="difficulties[]" value="<?= $val ?>" class="w-4 h-4 accent-cyan-500">
                                <span class="text-sm font-medium text-gray-700"><?= $label ?></span>
                            </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Questions <span class="text-red-500">*</span></label>
                            <input type="number" id="num_questions" placeholder="e.g., 25" min="1" max="100"
                                class="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm">
                            <p class="text-xs text-gray-400 mt-1">Maximum 100 questions per paper</p>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Question Order</label>
                            <select id="question_order" class="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm">
                                <option value="random">Random Order</option>
                                <option value="sequential">Sequential Order</option>
                            </select>
                        </div>
                    </div>
                </div>

                <hr class="border-gray-100">

                <!-- STEP 3 -->
                <div>
                    <div class="flex items-center gap-3 mb-6">
                        <span class="step-badge">STEP 3</span>
                        <h2 class="text-lg font-bold text-gray-800">Paper Details</h2>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Institute Name <span class="text-red-500">*</span></label>
                            <input type="text" id="institute_name" placeholder="e.g., ABC Engineering College"
                                class="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Exam Title</label>
                            <input type="text" id="exam_title" value="DDCET Practice Test"
                                class="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm">
                        </div>
                    </div>
                </div>

                <hr class="border-gray-100">

                <div class="flex gap-4">
                    <button type="button" onclick="generatePaper('question_paper')"
                        class="btn-cyan flex items-center gap-2 text-white font-semibold px-8 py-3 rounded-xl text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Generate Question Paper
                    </button>
                    <p class="flex items-center text-xs text-gray-400 italic">
                        💡 Answer Key button will appear after generating question paper
                    </p>
                </div>

            </div><!-- /card -->

            <div class="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <div class="flex items-center gap-2 mb-2"><span>💡</span><h3 class="font-semibold text-blue-800">Tips</h3></div>
                <ul class="text-sm text-blue-700 space-y-1">
                    <li>• Select multiple chapters to mix topics from different chapters</li>
                    <li>• Mix difficulty levels for a balanced question paper</li>
                    <li>• All questions carry 2 marks (DDCET standard)</li>
                    <li>• Answer key includes detailed explanation for each answer</li>
                </ul>
            </div>

        </div>
    </div>
</div>

<!-- Hidden POST form -->
<form id="paper_form" method="POST" action="../../controllers/FacultyController.php" style="display:none">
    <input type="hidden" name="action"          id="f_action">
    <input type="hidden" name="subject_id"      id="f_subject_id">
    <div id="f_chapters"></div>
    <div id="f_topics"></div>
    <div id="f_difficulties"></div>
    <input type="hidden" name="num_questions"   id="f_num_questions">
    <input type="hidden" name="question_order"  id="f_question_order">
    <input type="hidden" name="institute_name"  id="f_institute_name">
    <input type="hidden" name="exam_title"      id="f_exam_title">
</form>

<script>
const CTRL = '../../controllers/FacultyController.php';

// ── State ──────────────────────────────────────────────────
let selectedChapterIds = new Set();
let chapterData        = [];   // [{id, name}]

// ── Close dropdown when clicking outside ──────────────────
document.addEventListener('click', function(e) {
    if (!document.getElementById('chapter_wrapper').contains(e.target)) {
        closeChapterDropdown();
    }
});

// ── SUBJECT CHANGE ─────────────────────────────────────────
document.getElementById('subject_id').addEventListener('change', function () {
    const sid = this.value;
    selectedChapterIds.clear();
    chapterData = [];
    renderChapterDisplay();
    resetTopics();

    const dropdown = document.getElementById('chapter_dropdown');
    dropdown.innerHTML = '<div class="ms-empty">Loading chapters…</div>';

    if (!sid) {
        dropdown.innerHTML = '<div class="ms-empty">Select a subject first</div>';
        document.getElementById('chapter_display_text').textContent = 'Select Subject first';
        document.getElementById('chapter_display_text').classList.add('text-gray-400');
        return;
    }

    fetch(`${CTRL}?action=get_chapters&subject_id=${sid}`)
        .then(r => r.json())
        .then(data => {
            if (!data.success || !data.data.length) {
                dropdown.innerHTML = '<div class="ms-empty">No chapters found</div>';
                return;
            }
            chapterData = data.data;
            renderChapterOptions();
        })
        .catch(() => {
            dropdown.innerHTML = '<div class="ms-empty">Error loading chapters</div>';
        });
});

// ── Render chapter options inside dropdown ─────────────────
function renderChapterOptions() {
    const dropdown = document.getElementById('chapter_dropdown');
    let html = `<div class="ms-option ms-select-all" onclick="toggleAllChapters()">
                    <input type="checkbox" id="chk_all_ch" onclick="event.stopPropagation(); toggleAllChapters()">
                    <span>Select All Chapters</span>
                </div>`;
    chapterData.forEach(ch => {
        const checked = selectedChapterIds.has(ch.id) ? 'checked' : '';
        html += `<div class="ms-option" onclick="toggleChapter(${ch.id}, this)">
                    <input type="checkbox" id="chk_ch_${ch.id}" ${checked}
                           onclick="event.stopPropagation(); toggleChapter(${ch.id}, this.closest('.ms-option'))">
                    <span>${ch.name}</span>
                 </div>`;
    });
    dropdown.innerHTML = html;
    updateSelectAllCheckbox();
}

// ── Toggle single chapter ──────────────────────────────────
function toggleChapter(id, row) {
    const chk = document.getElementById(`chk_ch_${id}`);
    if (selectedChapterIds.has(id)) {
        selectedChapterIds.delete(id);
        if (chk) chk.checked = false;
        if (row) row.style.background = '';
    } else {
        selectedChapterIds.add(id);
        if (chk) chk.checked = true;
        if (row) row.style.background = '#f0f9ff';
    }
    updateSelectAllCheckbox();
    renderChapterDisplay();
    loadTopicsForSelectedChapters();
}

// ── Toggle all chapters ────────────────────────────────────
function toggleAllChapters() {
    const allChecked = selectedChapterIds.size === chapterData.length;
    if (allChecked) {
        selectedChapterIds.clear();
    } else {
        chapterData.forEach(ch => selectedChapterIds.add(ch.id));
    }
    renderChapterOptions();   // re-render to update checkboxes
    renderChapterDisplay();
    loadTopicsForSelectedChapters();
}

function updateSelectAllCheckbox() {
    const chk = document.getElementById('chk_all_ch');
    if (!chk) return;
    chk.checked       = chapterData.length > 0 && selectedChapterIds.size === chapterData.length;
    chk.indeterminate = selectedChapterIds.size > 0 && selectedChapterIds.size < chapterData.length;
}

// ── Render display box (tags) ──────────────────────────────
function renderChapterDisplay() {
    const txt = document.getElementById('chapter_display_text');
    if (selectedChapterIds.size === 0) {
        txt.innerHTML = '<span class="text-gray-400 text-sm">Choose chapters…</span>';
        return;
    }
    const selected = chapterData.filter(c => selectedChapterIds.has(c.id));
    txt.innerHTML = `<div class="ms-tags">${selected.map(c =>
        `<span class="ms-tag">📚 ${c.name}</span>`).join('')}</div>`;
}

// ── Open / close dropdown ──────────────────────────────────
function toggleChapterDropdown() {
    const dd  = document.getElementById('chapter_dropdown');
    const disp= document.getElementById('chapter_display');
    const arr = document.getElementById('chapter_arrow');
    const open= dd.classList.contains('open');
    if (open) { dd.classList.remove('open'); disp.classList.remove('open'); arr.classList.remove('open'); }
    else       { dd.classList.add('open');    disp.classList.add('open');    arr.classList.add('open'); }
}
function closeChapterDropdown() {
    document.getElementById('chapter_dropdown').classList.remove('open');
    document.getElementById('chapter_display').classList.remove('open');
    document.getElementById('chapter_arrow').classList.remove('open');
}

// ── Load topics for all selected chapters ──────────────────
function loadTopicsForSelectedChapters() {
    resetTopics();
    if (selectedChapterIds.size === 0) return;

    const params = [...selectedChapterIds].map(id => `chapter_ids[]=${id}`).join('&');
    document.getElementById('topics_placeholder').textContent = 'Loading topics…';
    document.getElementById('topics_placeholder').classList.remove('hidden');

    fetch(`${CTRL}?action=get_topics&${params}`)
        .then(r => r.json())
        .then(data => {
            if (!data.success || !data.data.length) {
                document.getElementById('topics_placeholder').textContent = 'No topics found';
                return;
            }
            const list = document.getElementById('topics_list');
            list.innerHTML = '';

            // Group by chapter_name for clarity
            const grouped = {};
            data.data.forEach(t => {
                if (!grouped[t.chapter_name]) grouped[t.chapter_name] = [];
                grouped[t.chapter_name].push(t);
            });

            Object.entries(grouped).forEach(([chName, topics]) => {
                // Chapter label
                list.innerHTML += `<div class="w-full mb-1 mt-2">
                    <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">${chName}</span>
                </div>`;
                topics.forEach(t => {
                    list.innerHTML += `
                        <div class="topic-chip">
                            <input type="checkbox" id="topic_${t.id}" value="${t.id}" style="display:none">
                            <label for="topic_${t.id}">${t.name}</label>
                        </div>`;
                });
            });

            list.classList.remove('hidden');
            document.getElementById('topics_placeholder').classList.add('hidden');
            document.getElementById('topic_actions').classList.remove('hidden');
        })
        .catch(() => {
            document.getElementById('topics_placeholder').textContent = 'Error loading topics';
        });
}

function resetTopics() {
    document.getElementById('topics_list').innerHTML = '';
    document.getElementById('topics_list').classList.add('hidden');
    document.getElementById('topics_placeholder').textContent = 'Select chapters first';
    document.getElementById('topics_placeholder').classList.remove('hidden');
    document.getElementById('topic_actions').classList.add('hidden');
}

function selectAllTopics() {
    document.querySelectorAll('#topics_list input[type="checkbox"]')
        .forEach(cb => cb.checked = true);
}
function deselectAllTopics() {
    document.querySelectorAll('#topics_list input[type="checkbox"]')
        .forEach(cb => cb.checked = false);
}

// ── GENERATE ───────────────────────────────────────────────
function generatePaper(type) {
    const subjectId     = document.getElementById('subject_id').value;
    const topicsChecked = document.querySelectorAll('#topics_list input[type="checkbox"]:checked');
    const diffsChecked  = document.querySelectorAll('input[name="difficulties[]"]:checked');
    const numQ          = document.getElementById('num_questions').value;
    const institute     = document.getElementById('institute_name').value.trim();

    if (!subjectId)                  return alert('Please select a Subject.');
    if (selectedChapterIds.size===0) return alert('Please select at least one Chapter.');
    if (topicsChecked.length === 0)  return alert('Please select at least one Topic.');
    if (diffsChecked.length  === 0)  return alert('Please select at least one Difficulty level.');
    if (!numQ || numQ<1 || numQ>100) return alert('Please enter number of questions (1–100).');
    if (!institute)                  return alert('Please enter Institute Name.');

    document.getElementById('f_action').value       = type==='answer_key' ? 'generate_answer_key' : 'generate_paper';
    document.getElementById('f_subject_id').value   = subjectId;
    document.getElementById('f_num_questions').value= numQ;
    document.getElementById('f_question_order').value= document.getElementById('question_order').value;
    document.getElementById('f_institute_name').value= institute;
    document.getElementById('f_exam_title').value   = document.getElementById('exam_title').value || 'DDCET Practice Test';

    // Chapters
    const chDiv = document.getElementById('f_chapters');
    chDiv.innerHTML = '';
    [...selectedChapterIds].forEach(id => {
        chDiv.innerHTML += `<input type="hidden" name="chapter_ids[]" value="${id}">`;
    });

    // Topics
    const tDiv = document.getElementById('f_topics');
    tDiv.innerHTML = '';
    topicsChecked.forEach(cb => {
        tDiv.innerHTML += `<input type="hidden" name="topic_ids[]" value="${cb.value}">`;
    });

    // Difficulties
    const dDiv = document.getElementById('f_difficulties');
    dDiv.innerHTML = '';
    diffsChecked.forEach(cb => {
        dDiv.innerHTML += `<input type="hidden" name="difficulties[]" value="${cb.value}">`;
    });

    document.getElementById('paper_form').submit();
}
</script>
</body>
</html>