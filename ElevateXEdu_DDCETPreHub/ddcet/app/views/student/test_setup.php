<?php
// ============================================================
// DDCETPrepHub — app/views/student/test_setup.php
// DUAL MODE: Normal (User picks difficulty) + Adaptive (AI)
// ============================================================
session_start();
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../app/models/Question.php';

if (!empty($_SESSION['active_test'])) {
    header('Location: resume_test.php'); exit;
}

$model    = new Question();
$subjects = $model->getAllSubjects();
$type     = $_GET['type'] ?? 'topic';
$mode     = $_GET['mode'] ?? 'normal'; // NEW: normal or adaptive

// Validate type and mode
if (!in_array($type, ['topic','chapter','subject','full'])) {
    header('Location: dashboard.php'); exit;
}
if (!in_array($mode, ['normal', 'adaptive'])) {
    $mode = 'normal';
}

// Topic test can NEVER be adaptive (hard rule)
if ($type === 'topic') {
    $mode = 'normal';
    $isAdaptive = false;
} else {
    $isAdaptive = ($mode === 'adaptive');
}

$typeConfig = [
    'topic'   => ['label'=>'Topic Wise Test',    'icon'=>'🎯', 'color'=>'cyan',   'hex'=>'#06B6D4'],
    'chapter' => ['label'=>'Chapter Wise Test',  'icon'=>'📚', 'color'=>'purple', 'hex'=>'#8B5CF6'],
    'subject' => ['label'=>'Subject Wise Test',  'icon'=>'📖', 'color'=>'green',  'hex'=>'#10B981'],
    'full'    => ['label'=>'Full Mock Test',     'icon'=>'🏆', 'color'=>'amber',  'hex'=>'#F59E0B'],
];
$cfg = $typeConfig[$type];

$modeLabel = $isAdaptive ? '🤖 Adaptive Mode' : '📘 Normal Mode';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $cfg['label'] ?> (<?= $modeLabel ?>) — DDCETPrepHub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .sidebar { background: linear-gradient(180deg, #1E3A8A 0%, #1e40af 100%); }
        .step-badge { background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700;
                      padding: 2px 10px; border-radius: 20px; }
        .multi-select-wrapper { position: relative; }
        .multi-select-display {
            border: 1.5px solid #e2e8f0; border-radius: 12px;
            padding: 10px 16px; background: #f8fafc; cursor: pointer;
            min-height: 46px; display: flex; align-items: center;
            justify-content: space-between; user-select: none; transition: border-color .2s;
        }
        .multi-select-display:hover,
        .multi-select-display.open { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(6,182,212,.1); }
        .multi-select-dropdown {
            position: absolute; top: calc(100% + 4px); left: 0; right: 0;
            background: #fff; border: 1.5px solid var(--accent);
            border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
            z-index: 100; max-height: 220px; overflow-y: auto; display: none;
        }
        .multi-select-dropdown.open { display: block; }
        .ms-option {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; cursor: pointer; font-size: 14px;
            color: #374151; transition: background .15s;
        }
        .ms-option:hover { background: #f0f9ff; }
        .ms-option input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
        .ms-select-all { border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #0369a1; background: #f0f9ff; }
        .ms-empty { padding: 12px 14px; color: #9ca3af; font-size: 14px; }
        .ms-tag {
            display: inline-flex; align-items: center; gap: 4px;
            background: #dbeafe; color: #1d4ed8; border-radius: 20px;
            padding: 2px 10px; font-size: 12px; font-weight: 600;
        }
        .ms-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .diff-chip input { display: none; }
        .diff-chip label {
            display: inline-flex; align-items: center; gap: 6px;
            border: 2px solid #e2e8f0; border-radius: 24px;
            padding: 6px 16px; font-size: 13px; font-weight: 600;
            cursor: pointer; transition: all .15s; background: #fff; color: #374151;
        }
        .diff-chip label:hover { border-color: var(--accent); }
        .diff-chip input:checked + label { background: var(--accent); color: #fff; border-color: var(--accent); }
        .time-preview {
            background: linear-gradient(135deg, #1E3A8A, #1e40af);
            color: white; border-radius: 16px; padding: 20px 24px;
        }
        select, input[type="number"], input[type="text"] {
            border: 1.5px solid #e2e8f0; transition: border-color .2s; border-radius: 12px;
        }
        select:focus, input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(6,182,212,.1); }
        .start-btn {
            background: var(--accent);
            color: white; font-weight: 700; font-size: 16px;
            border: none; border-radius: 14px; padding: 14px 40px;
            cursor: pointer; transition: all .2s; width: 100%;
        }
        .start-btn:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.15); }
        .start-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }
        
        .mode-badge {
            display: inline-block;
            font-size: 11px; font-weight: 800;
            padding: 4px 14px; border-radius: 20px;
            text-transform: uppercase;
        }
        .badge-normal { background: #dbeafe; color: #1e40af; }
        .badge-adaptive { background: linear-gradient(135deg,#06B6D4,#8B5CF6); color: white; }
        
        .adaptive-info {
            background: linear-gradient(135deg, #e0f9ff, #ede9fe);
            border: 2px solid #06B6D4;
            border-radius: 12px;
            padding: 14px 18px;
            margin-top: 16px;
            color: #1e40af;
        }
    </style>
    <script>
        document.documentElement.style.setProperty('--accent', '<?= $cfg['hex'] ?>');
        const MODE = '<?= $mode ?>';
        const IS_ADAPTIVE = <?= $isAdaptive ? 'true' : 'false' ?>;
    </script>
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
                    <p class="text-blue-300 text-xs">Student Portal</p>
                </div>
            </div>
        </div>
        <nav class="flex-1 px-3 py-4">
            <a href="dashboard.php" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-700 hover:text-white transition">
                ← Back to Dashboard
            </a>
        </nav>
    </div>

    <!-- MAIN -->
    <div class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto px-8 py-8">

            <!-- Header -->
            <div class="flex items-center gap-4 mb-4">
                <div class="text-4xl"><?= $cfg['icon'] ?></div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <h1 class="text-2xl font-bold text-gray-800"><?= $cfg['label'] ?></h1>
                        <span class="mode-badge badge-<?= $mode ?>"><?= $modeLabel ?></span>
                    </div>
                    <p class="text-gray-500 text-sm">Configure your test and start practicing</p>
                </div>
            </div>

            <?php if ($type === 'topic'): ?>
            <div class="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6">
                <p class="text-yellow-800 text-sm font-medium">
                    ⚠️ Adaptive mode is disabled for topic tests.
                    You can manually choose difficulty for focused practice.
                </p>
            </div>
            <?php endif; ?>

            <?php if ($isAdaptive): ?>
            <!-- Adaptive Mode Info -->
            <div class="adaptive-info mb-6">
                <div class="flex items-start gap-3">
                    <div class="text-3xl">🤖</div>
                    <div class="flex-1">
                        <p class="font-bold mb-1 text-base">AI-Powered Adaptive Learning Active</p>
                        <p class="text-sm leading-relaxed">
                            The system will analyze your performance after each question and automatically adjust 
                            difficulty in real-time. Questions get harder when you're doing well, easier when you're 
                            struggling. This keeps you in the optimal learning zone!
                        </p>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- FULL MOCK — no config needed -->
            <?php if ($type === 'full'): ?>
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                <h2 class="text-lg font-bold text-gray-800 mb-4">📋 Full Mock Test — Information</h2>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-amber-50 rounded-xl p-4">
                        <p class="text-xs text-amber-700 font-semibold uppercase">Questions</p>
                        <p class="text-2xl font-bold text-amber-800">100</p>
                    </div>
                    <div class="bg-amber-50 rounded-xl p-4">
                        <p class="text-xs text-amber-700 font-semibold uppercase">Total Marks</p>
                        <p class="text-2xl font-bold text-amber-800">200</p>
                    </div>
                    <div class="bg-amber-50 rounded-xl p-4">
                        <p class="text-xs text-amber-700 font-semibold uppercase">Time Limit</p>
                        <p class="text-2xl font-bold text-amber-800">120 min</p>
                    </div>
                    <div class="bg-amber-50 rounded-xl p-4">
                        <p class="text-xs text-amber-700 font-semibold uppercase">Marks per Q</p>
                        <p class="text-2xl font-bold text-amber-800">2</p>
                    </div>
                </div>
                
                <?php if ($isAdaptive): ?>
                <div class="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6">
                    <p class="font-bold text-cyan-800 mb-2">🤖 Adaptive Engine Details:</p>
                    <p class="text-sm text-cyan-700">✓ AI will auto-select difficulty based on your performance</p>
                    <p class="text-sm text-cyan-700">✓ Questions adapt in real-time across all subjects</p>
                    <p class="text-sm text-cyan-700">✓ Most realistic exam preparation experience</p>
                </div>
                <?php else: ?>
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p class="font-bold text-blue-800 mb-2">📘 Normal Mode Details:</p>
                    <p class="text-sm text-blue-700">✓ Mixed difficulty: All levels included</p>
                    <p class="text-sm text-blue-700">✓ Balanced distribution across subjects</p>
                    <p class="text-sm text-blue-700">✓ 20 questions per subject</p>
                </div>
                <?php endif; ?>

                <div class="border border-amber-200 rounded-xl p-4 mb-6 bg-amber-50">
                    <p class="font-bold text-amber-800 mb-2">⚠️ Instructions:</p>
                    <ol class="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                        <li>Each question carries <strong>2 marks</strong>. No negative marking.</li>
                        <li>Navigate freely between questions using the palette.</li>
                        <li>Mark for Review if you want to revisit later.</li>
                        <li>Timer auto-submits when time ends.</li>
                        <li>Do not refresh during the test.</li>
                    </ol>
                </div>

                <form method="POST" action="../../controllers/StudentController.php">
                    <input type="hidden" name="action" value="setup_test">
                    <input type="hidden" name="test_type" value="full">
                    <input type="hidden" name="mode" value="<?= $mode ?>">
                    <input type="hidden" name="num_questions" value="100">
                    <input type="hidden" name="time_minutes" value="120">
                    <button type="submit" class="start-btn">🚀 Start Full Mock Test Now</button>
                </form>
            </div>

            <?php else: ?>
            <!-- CONFIG FORM for topic / chapter / subject -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">

                <!-- STEP 1: Subject -->
                <div>
                    <div class="flex items-center gap-3 mb-4">
                        <span class="step-badge">STEP 1</span>
                        <h2 class="text-base font-bold text-gray-800">Select Subject</h2>
                    </div>
                    <select id="subject_id" class="w-full px-4 py-3 bg-gray-50 text-gray-800 text-sm">
                        <option value="">Choose Subject</option>
                        <?php foreach ($subjects as $s): ?>
                        <option value="<?= $s['id'] ?>"><?= htmlspecialchars($s['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <!-- STEP 2a: Chapter selection -->
                <?php if ($type === 'chapter' || $type === 'subject'): ?>
                <div id="step_chapter" class="<?= $type === 'subject' ? 'hidden' : '' ?>">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="step-badge">STEP 2</span>
                        <h2 class="text-base font-bold text-gray-800">
                            <?= $type === 'chapter' ? 'Select Chapters (multiple allowed)' : 'All Chapters Included' ?>
                        </h2>
                    </div>
                    <?php if ($type === 'chapter'): ?>
                    <div class="multi-select-wrapper" id="chapter_wrapper">
                        <div class="multi-select-display" id="chapter_display" onclick="toggleDropdown('chapter')">
                            <span id="chapter_display_text" class="text-gray-400 text-sm">Select subject first</span>
                            <svg class="w-4 h-4 text-gray-400" id="chapter_arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="multi-select-dropdown" id="chapter_dropdown">
                            <div class="ms-empty">Select a subject first</div>
                        </div>
                    </div>
                    <?php else: ?>
                    <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                        ✅ All chapters from selected subject will be included automatically.
                    </div>
                    <?php endif; ?>
                </div>
                <?php endif; ?>

                <!-- STEP 2b: Topic selection -->
                <?php if ($type === 'topic'): ?>
                <div id="step_topic">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="step-badge">STEP 2</span>
                        <h2 class="text-base font-bold text-gray-800">Select Topics (multiple allowed)</h2>
                    </div>
                    <div class="multi-select-wrapper" id="topic_wrapper">
                        <div class="multi-select-display" id="topic_display" onclick="toggleDropdown('topic')">
                            <span id="topic_display_text" class="text-gray-400 text-sm">Select subject first</span>
                            <svg class="w-4 h-4 text-gray-400" id="topic_arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        <div class="multi-select-dropdown" id="topic_dropdown">
                            <div class="ms-empty">Select a subject first</div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <!-- STEP 3: Questions -->
                <div id="step_questions" class="hidden">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="step-badge">STEP 3</span>
                        <h2 class="text-base font-bold text-gray-800">Number of Questions</h2>
                    </div>
                    <?php if ($type === 'topic'): ?>
                    <div class="flex items-center gap-4">
                        <div class="flex-1">
                            <label class="block text-xs text-gray-500 mb-1">Questions per topic</label>
                            <input type="number" id="questions_per_topic" min="1" max="20" value="5"
                                class="w-full px-4 py-3 bg-gray-50 text-gray-800 text-sm"
                                oninput="updateTotalQuestions()">
                        </div>
                        <div class="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
                            <p class="text-xs text-gray-500">Total Questions</p>
                            <p class="text-2xl font-bold text-blue-900" id="total_q_display">—</p>
                            <p class="text-xs text-gray-400" id="total_q_note">—</p>
                        </div>
                    </div>
                    <?php else: ?>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1">Total questions (max 100)</label>
                        <input type="number" id="num_questions" min="5" max="100" value="25"
                            class="w-full px-4 py-3 bg-gray-50 text-gray-800 text-sm"
                            oninput="updateTime()">
                    </div>
                    <?php endif; ?>
                </div>

                <!-- STEP 4: Difficulty (only in NORMAL mode) -->
                <div id="step_difficulty" class="hidden">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="step-badge">STEP 4</span>
                        <h2 class="text-base font-bold text-gray-800">
                            <?= $isAdaptive ? 'Difficulty (AI-Controlled)' : 'Select Difficulty Levels' ?>
                        </h2>
                    </div>
                    
                    <?php if ($isAdaptive): ?>
                    <!-- Adaptive: Show info, no selection -->
                    <div class="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                        <p class="text-sm text-cyan-800 font-semibold mb-2">🤖 AI will select difficulty automatically</p>
                        <p class="text-sm text-cyan-700">
                            The adaptive engine will include all difficulty levels (Easy, Moderate, Hard, Advanced, Tricky) 
                            and choose appropriate questions based on your real-time performance.
                        </p>
                    </div>
                    <?php else: ?>
                    <!-- Normal: User picks -->
                    <div class="flex flex-wrap gap-3">
                        <?php foreach (['easy'=>'😊 Easy','moderate'=>'🤔 Moderate','hard'=>'💪 Hard','advanced'=>'🔥 Advanced','tricky'=>'🧩 Tricky'] as $val=>$label): ?>
                        <div class="diff-chip">
                            <input type="checkbox" id="diff_<?= $val ?>" value="<?= $val ?>" onchange="updateTime()">
                            <label for="diff_<?= $val ?>"><?= $label ?></label>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">Select at least one difficulty level</p>
                    <?php endif; ?>
                </div>

                <!-- Time Preview -->
                <div id="time_preview" class="hidden time-preview">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-blue-200 text-sm font-medium">Estimated Time</p>
                            <p class="text-3xl font-bold mt-1" id="time_display">—</p>
                            <p class="text-blue-300 text-xs mt-1" id="time_breakdown">—</p>
                        </div>
                        <div class="text-right">
                            <p class="text-blue-200 text-sm font-medium">Total Marks</p>
                            <p class="text-3xl font-bold mt-1" id="marks_display">—</p>
                            <p class="text-blue-300 text-xs mt-1">2 marks per question</p>
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div id="step_instructions" class="hidden border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p class="font-bold text-gray-700 mb-2">⚠️ Instructions:</p>
                    <ol class="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Each question carries <strong>2 marks</strong>. No negative marking.</li>
                        <li>Navigate freely using the question palette.</li>
                        <li>Use <strong>Mark for Review</strong> to revisit later.</li>
                        <li>Timer auto-submits when time ends.</li>
                        <li>Do not refresh during the test.</li>
                    </ol>
                </div>

                <!-- START FORM -->
                <form id="start_form" method="POST" action="../../controllers/StudentController.php" style="display:none">
                    <input type="hidden" name="action" value="setup_test">
                    <input type="hidden" name="test_type" value="<?= $type ?>">
                    <input type="hidden" name="mode" value="<?= $mode ?>">
                    <input type="hidden" name="subject_id" id="f_subject_id">
                    <div id="f_chapters_div"></div>
                    <div id="f_topics_div"></div>
                    <input type="hidden" name="num_questions" id="f_num_questions">
                    <input type="hidden" name="time_minutes" id="f_time_minutes">
                    <div id="f_difficulties_div"></div>
                    <button type="submit" class="start-btn" id="start_btn" disabled>🚀 Start Test</button>
                </form>
                <div id="start_btn_wrapper" class="hidden">
                    <button type="button" class="start-btn" onclick="submitStartForm()" id="start_btn_display" disabled>
                        🚀 Start Test
                    </button>
                </div>

            </div>
            <?php endif; ?>

        </div>
    </div>
</div>

<script>
const TYPE = '<?= $type ?>';
const CTRL = '../../controllers/StudentController.php';
const selectedChaps = new Set();
const selectedTopics = new Set();
let chapterData = [];
let topicData = [];
let numTopicsSelected = 0;

const diffTime = { easy:1, moderate:1.5, hard:2, advanced:2.5, tricky:2 };

document.addEventListener('click', e => {
    ['chapter','topic'].forEach(name => {
        const wrap = document.getElementById(`${name}_wrapper`);
        if (wrap && !wrap.contains(e.target)) {
            document.getElementById(`${name}_dropdown`)?.classList.remove('open');
            document.getElementById(`${name}_display`)?.classList.remove('open');
        }
    });
});

document.getElementById('subject_id').addEventListener('change', function() {
    const sid = this.value;
    selectedChaps.clear();
    selectedTopics.clear();
    chapterData = []; topicData = [];

    if (!sid) return resetAll();

    if (TYPE === 'topic') {
        fetch(`${CTRL}?action=get_all_topics_by_subject&subject_id=${sid}`)
            .then(r => r.json()).then(data => {
                if (!data.success) return;
                topicData = data.data;
                renderTopicDropdown();
                showStep('step_questions', false);
                showStep('step_difficulty', false);
                hidePreview();
            });
    } else if (TYPE === 'chapter') {
        fetch(`${CTRL}?action=get_chapters&subject_id=${sid}`)
            .then(r => r.json()).then(data => {
                if (!data.success) return;
                chapterData = data.data;
                renderChapterDropdown();
            });
        showStep('step_questions', false);
        showStep('step_difficulty', false);
        hidePreview();
    } else if (TYPE === 'subject') {
        showStep('step_chapter', true);
        showStep('step_questions', true);
        showStep('step_difficulty', true);
        showStep('step_instructions', true);
        hidePreview();
    }
});

function renderChapterDropdown() {
    const dd = document.getElementById('chapter_dropdown');
    let html = `<div class="ms-option ms-select-all" onclick="toggleAllItems('chapter')">
        <input type="checkbox" id="chk_all_ch" onclick="event.stopPropagation();toggleAllItems('chapter')">
        <span>Select All Chapters</span></div>`;
    chapterData.forEach(ch => {
        html += `<div class="ms-option" onclick="toggleItem('chapter',${ch.id},this)">
            <input type="checkbox" id="chk_ch_${ch.id}" onclick="event.stopPropagation();toggleItem('chapter',${ch.id},this.closest('.ms-option'))">
            <span>${ch.name}</span></div>`;
    });
    dd.innerHTML = html;
}

function renderTopicDropdown() {
    const dd = document.getElementById('topic_dropdown');
    if (!topicData.length) { dd.innerHTML = '<div class="ms-empty">No topics found</div>'; return; }

    const grouped = {};
    topicData.forEach(t => {
        if (!grouped[t.chapter_name]) grouped[t.chapter_name] = [];
        grouped[t.chapter_name].push(t);
    });

    let html = `<div class="ms-option ms-select-all" onclick="toggleAllTopics()">
        <input type="checkbox" id="chk_all_topics" onclick="event.stopPropagation();toggleAllTopics()">
        <span>Select All Topics</span></div>`;
    Object.entries(grouped).forEach(([chName, topics]) => {
        html += `<div style="padding:6px 14px;font-size:11px;font-weight:700;color:#0369a1;background:#f8fafc;border-bottom:1px solid #f1f5f9;text-transform:uppercase;">${chName}</div>`;
        topics.forEach(t => {
            html += `<div class="ms-option" onclick="toggleTopicItem(${t.id},this)">
                <input type="checkbox" id="chk_t_${t.id}" onclick="event.stopPropagation();toggleTopicItem(${t.id},this.closest('.ms-option'))">
                <span>${t.name}</span></div>`;
        });
    });
    dd.innerHTML = html;
}

function toggleItem(type, id, row) {
    const set = type === 'chapter' ? selectedChaps : selectedTopics;
    const chk = document.getElementById(type === 'chapter' ? `chk_ch_${id}` : `chk_t_${id}`);
    if (set.has(id)) { set.delete(id); if(chk) chk.checked=false; if(row) row.style.background=''; }
    else { set.add(id); if(chk) chk.checked=true; if(row) row.style.background='#f0f9ff'; }
    updateDisplay(type);
    onSelectionChange(type);
}
function toggleTopicItem(id, row) { toggleItem('topic', id, row); }

function toggleAllItems(type) {
    const set = type === 'chapter' ? selectedChaps : selectedTopics;
    const data = type === 'chapter' ? chapterData : topicData;
    const allChecked = set.size === data.length;
    if (allChecked) set.clear(); else data.forEach(d => set.add(d.id));
    if (type === 'chapter') renderChapterDropdown(); else renderTopicDropdown();
    updateDisplay(type);
    onSelectionChange(type);
}
function toggleAllTopics() { toggleAllItems('topic'); }

function updateDisplay(type) {
    const set = type === 'chapter' ? selectedChaps : selectedTopics;
    const data = type === 'chapter' ? chapterData : topicData;
    const txt = document.getElementById(`${type}_display_text`);
    if (!txt) return;
    if (set.size === 0) { txt.innerHTML = `<span class="text-gray-400 text-sm">Choose ${type}s…</span>`; return; }
    const selected = data.filter(d => set.has(d.id));
    txt.innerHTML = `<div class="ms-tags">${selected.map(d=>`<span class="ms-tag">📌 ${d.name}</span>`).join('')}</div>`;
}

function onSelectionChange(type) {
    if (TYPE === 'chapter' && type === 'chapter') {
        const anySelected = selectedChaps.size > 0;
        showStep('step_questions', anySelected);
        showStep('step_difficulty', anySelected);
        showStep('step_instructions', anySelected);
        if (!anySelected) hidePreview();
        else updateTime();
    }
    if (TYPE === 'topic' && type === 'topic') {
        numTopicsSelected = selectedTopics.size;
        const anySelected = numTopicsSelected > 0;
        showStep('step_questions', anySelected);
        showStep('step_difficulty', anySelected);
        showStep('step_instructions', anySelected);
        if (!anySelected) hidePreview();
        else updateTotalQuestions();
    }
}

function toggleDropdown(name) {
    const dd = document.getElementById(`${name}_dropdown`);
    const disp = document.getElementById(`${name}_display`);
    const open = dd.classList.contains('open');
    dd.classList.toggle('open', !open);
    disp.classList.toggle('open', !open);
}

function getSelectedDifficulties() {
    if (IS_ADAPTIVE) return ['easy','moderate','hard','advanced','tricky'];
    return [...document.querySelectorAll('.diff-chip input:checked')].map(i => i.value);
}

function avgDiffTime(diffs) {
    if (!diffs.length) return 0;
    return diffs.reduce((s, d) => s + (diffTime[d]||1), 0) / diffs.length;
}

function updateTotalQuestions() {
    const perTopic = parseInt(document.getElementById('questions_per_topic')?.value || 5);
    const total = Math.min(perTopic * numTopicsSelected, 100);
    const el = document.getElementById('total_q_display');
    const note = document.getElementById('total_q_note');
    if (el) el.textContent = total || '—';
    if (note && numTopicsSelected) {
        note.textContent = `${perTopic}/topic × ${numTopicsSelected} topics${total === 100 ? ' (capped)' : ''}`;
    }
    updateTime();
}

function updateTime() {
    const diffs = getSelectedDifficulties();
    if (!IS_ADAPTIVE && !diffs.length) { hidePreview(); updateStartBtn(false); return; }

    let totalQ = 0;
    if (TYPE === 'topic') {
        const perTopic = parseInt(document.getElementById('questions_per_topic')?.value || 5);
        totalQ = Math.min(perTopic * numTopicsSelected, 100);
    } else {
        totalQ = parseInt(document.getElementById('num_questions')?.value || 25);
    }

    if (!totalQ) { hidePreview(); updateStartBtn(false); return; }

    const avgTime = avgDiffTime(diffs);
    const minutes = Math.round(totalQ * avgTime);
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${minutes} minutes`;

    document.getElementById('time_preview').classList.remove('hidden');
    document.getElementById('time_display').textContent = timeStr;
    document.getElementById('marks_display').textContent = `${totalQ * 2} Marks`;
    
    if (IS_ADAPTIVE) {
        document.getElementById('time_breakdown').textContent = 
            `${totalQ} questions × ${avgTime.toFixed(1)} min/q (AI mixed difficulty)`;
    } else {
        document.getElementById('time_breakdown').textContent = 
            `${totalQ} questions × ${avgTime.toFixed(1)} min/q (${diffs.join('+')})`;
    }

    document.getElementById('f_time_minutes').value = minutes;
    document.getElementById('f_num_questions').value = totalQ;
    showStep('start_btn_wrapper', true);
    updateStartBtn(true);
}

function hidePreview() {
    document.getElementById('time_preview')?.classList.add('hidden');
    showStep('start_btn_wrapper', false);
}

function updateStartBtn(enable) {
    const btn = document.getElementById('start_btn_display');
    if (!btn) return;
    btn.disabled = !enable;
}

function submitStartForm() {
    const diffs = getSelectedDifficulties();
    if (!IS_ADAPTIVE && !diffs.length) return alert('Please select at least one difficulty level.');

    const sid = document.getElementById('subject_id').value;
    if (!sid) return alert('Please select a subject.');

    if (TYPE === 'chapter' && selectedChaps.size === 0) return alert('Please select at least one chapter.');
    if (TYPE === 'topic' && selectedTopics.size === 0) return alert('Please select at least one topic.');

    document.getElementById('f_subject_id').value = sid;

    const chDiv = document.getElementById('f_chapters_div'); chDiv.innerHTML = '';
    [...selectedChaps].forEach(id => { chDiv.innerHTML += `<input type="hidden" name="chapter_ids[]" value="${id}">`; });

    const tDiv = document.getElementById('f_topics_div'); tDiv.innerHTML = '';
    [...selectedTopics].forEach(id => { tDiv.innerHTML += `<input type="hidden" name="topic_ids[]" value="${id}">`; });

    const dDiv = document.getElementById('f_difficulties_div'); dDiv.innerHTML = '';
    diffs.forEach(d => { dDiv.innerHTML += `<input type="hidden" name="difficulties[]" value="${d}">`; });

    document.getElementById('start_form').submit();
}

function showStep(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) el.classList.remove('hidden'); else el.classList.add('hidden');
}

function resetAll() {
    ['step_questions','step_difficulty','step_instructions','start_btn_wrapper'].forEach(id => showStep(id, false));
    hidePreview();
}

<?php if ($type === 'subject'): ?>
document.getElementById('subject_id').addEventListener('change', function() {
    const sid = this.value;
    if (sid) {
        showStep('step_questions', true);
        showStep('step_difficulty', true);
        showStep('step_instructions', true);
    }
});
<?php endif; ?>
</script>
</body>
</html>