<?php
// ============================================================
// DDCETPrepHub — app/views/student/test_window.php
// ============================================================
session_start();
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (empty($_SESSION['active_test'])) {
    header('Location: dashboard.php'); exit;
}

$test      = $_SESSION['active_test'];
$questions = $test['questions'];
$totalQ    = $test['total_q'];
$timeMin   = $test['time_minutes'];
$testType  = $test['test_type'];
$startTime = $test['start_time'];
$elapsed   = time() - $startTime;
$remaining = max(0, ($timeMin * 60) - $elapsed);
$isAdaptive= in_array($testType, ['chapter','subject','full']);

$typeLabels = [
    'topic'   => '🎯 Topic Wise',
    'chapter' => '📚 Chapter Wise',
    'subject' => '📖 Subject Wise',
    'full'    => '🏆 Full Mock Test',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Test — DDCETPrepHub</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
    /* ── Back button: handle BEFORE page renders ── */
    history.pushState(null, null, location.href);
    let testStarted = false;

    window.addEventListener('popstate', () => {
        if (!testStarted) {
            // Still on overlay — cancel cleanly
            fetch('../../controllers/StudentController.php?action=cancel_test', {method:'POST'})
                .finally(() => window.location.replace('dashboard.php'));
        } else {
            history.pushState(null, null, location.href);
            showAutoSubmitPopup('back');
        }
    });

    /* ── Tab switch ── */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && testStarted) showAutoSubmitPopup('tab');
    });

    /* ── Block keyboard nav shortcuts ── */
    /* ── Block keyboard navigation + refresh shortcuts ── */
    document.addEventListener('keydown', (e) => {

        const key = e.key.toLowerCase();

        // -------------------------------------------------
        // REFRESH BLOCKER (MAIN REQUIREMENT)
        // -------------------------------------------------
        if (
            key === 'f5' ||                         // F5
            (e.ctrlKey && key === 'r') ||           // Ctrl+R
            (e.metaKey && key === 'r') ||           // Cmd+R (Mac)
            (e.ctrlKey && e.shiftKey && key === 'r')|| // Ctrl+Shift+R
            (e.ctrlKey && key === 'f5')             // Ctrl+F5
        ) {
            e.preventDefault();
            e.stopPropagation();

            if (testStarted) {
                showAutoSubmitPopup('refresh');
            } else {
                alert('⚠️ Refresh is disabled during test.');
            }
            return;
        }

        // -------------------------------------------------
        // EXISTING BLOCKS (kept same)
        // -------------------------------------------------
        if (e.altKey && (key==='arrowleft'||key==='arrowright')) {
            e.preventDefault();
            return;
        }

        if (key==='backspace' && e.target.tagName!=='INPUT' && e.target.tagName!=='TEXTAREA') {
            e.preventDefault();
            return;
        }

        if (e.ctrlKey && key==='w') {
            e.preventDefault();
            return;
        }

        // block typing during autosubmit popup
        const popup = document.getElementById('as_modal');
        if (popup && !popup.classList.contains('hidden')) {
            e.preventDefault();
            return;
        }

    }, true);

    /* ── Disable right-click/copy/paste ── */
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy',  e => e.preventDefault());
    document.addEventListener('paste', e => e.preventDefault());

    /* ── Fullscreen ── */
    function enterFullscreen() {
        const el = document.documentElement;
        if      (el.requestFullscreen)       el.requestFullscreen();
        else if (el.webkitRequestFullscreen)  el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen)     el.mozRequestFullScreen();
    }

    /* ── Start button clicked ── */
    function startTest() {
        testStarted = true;
        enterFullscreen();
        document.getElementById('overlay').style.display = 'none';
        document.getElementById('exam').style.display    = 'grid';
        initExam(); // start timer + render first question
    }

    /* ── Browser reload protection (backup safety) ── */
    window.addEventListener('beforeunload', function (e) {
        if (testStarted) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
</script>
<style>
body { height:100vh; overflow:hidden; font-family:'Segoe UI',sans-serif; }

.exam-grid {
    display: grid;
    grid-template-rows: 56px 1fr;
    grid-template-columns: 1fr 280px;
    height: 100vh;
}
.topbar    { grid-column:1/-1; grid-row:1; background:#1E3A8A;
             display:flex; align-items:center; justify-content:space-between; padding:0 20px; }
.qpanel    { grid-column:1; grid-row:2; overflow-y:auto; background:#f8fafc; padding:28px; }
.sidepanel { grid-column:2; grid-row:2; overflow-y:auto; background:white; border-left:1px solid #e5e7eb; padding:16px; }

/* Timer */
.timer { background:rgba(255,255,255,.15); border:2px solid rgba(255,255,255,.3);
         border-radius:10px; padding:4px 16px; font-size:20px; font-weight:700;
         color:white; font-family:monospace; letter-spacing:2px; }
.timer.warn { background:rgba(245,158,11,.4); border-color:#F59E0B; }
.timer.crit { background:rgba(239,68,68,.5);  border-color:#EF4444; animation:blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.6} }

/* Question card */
.qcard { background:white; border-radius:20px; border:1px solid #e5e7eb; padding:28px; max-width:760px; }

/* Options */
.opt { display:flex; align-items:center; gap:14px; padding:13px 16px;
       border-radius:12px; border:2px solid #e5e7eb; cursor:pointer;
       transition:all .15s; margin-bottom:10px; background:white; }
.opt:hover    { border-color:#06B6D4; background:#f0fdff; }
.opt.selected { border-color:#06B6D4; background:#e0f9ff; }
.opt-lbl { width:30px; height:30px; border-radius:8px; background:#f1f5f9;
           display:flex; align-items:center; justify-content:center;
           font-weight:700; font-size:13px; color:#64748b; flex-shrink:0; }
.opt.selected .opt-lbl { background:#06B6D4; color:white; }

/* Action bar */
.abar { display:flex; gap:10px; flex-wrap:wrap; margin-top:24px;
        padding-top:20px; border-top:1px solid #e5e7eb; }
.btn { padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600;
       cursor:pointer; border:none; transition:all .2s; display:flex; align-items:center; gap:6px; }
.btn:hover:not(:disabled) { transform:translateY(-1px); }
.btn:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }
.btn-save    { background:#06B6D4; color:white; }
.btn-skip    { background:#fee2e2; color:#dc2626; border:2px solid #fca5a5; }
.btn-review  { background:#f3e8ff; color:#7c3aed; border:2px solid #d8b4fe; }
.btn-prev    { background:#f1f5f9; color:#475569; border:2px solid #e2e8f0; }
.btn-next    { background:#1E3A8A; color:white; margin-left:auto; }

/* Palette */
.pal-btn { width:36px; height:36px; border-radius:8px; font-size:12px; font-weight:700;
           cursor:pointer; border:2px solid transparent; transition:all .15s;
           display:flex; align-items:center; justify-content:center; }
.pal-btn:hover { transform:scale(1.1); }
.pal-not_visited { background:#f1f5f9; color:#64748b; border-color:#e2e8f0; }
.pal-answered    { background:#dcfce7; color:#16a34a; border-color:#86efac; }
.pal-skipped     { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }
.pal-review      { background:#ede9fe; color:#7c3aed; border-color:#c4b5fd; }
.pal-current     { outline:3px solid #06B6D4; outline-offset:2px; }

/* Diff badges */
.diff-badge  { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase; }
.diff-easy      { background:#dcfce7; color:#16a34a; }
.diff-moderate  { background:#dbeafe; color:#1d4ed8; }
.diff-hard      { background:#fed7aa; color:#c2410c; }
.diff-advanced  { background:#fee2e2; color:#dc2626; }
.diff-tricky    { background:#f3e8ff; color:#7c3aed; }

/* Modals */
.overlay-bg { position:fixed; inset:0; background:rgba(0,0,0,.5);
              z-index:200; display:flex; align-items:center; justify-content:center;
              backdrop-filter:blur(3px); }
.modal-box  { background:white; border-radius:20px; padding:32px;
              width:460px; box-shadow:0 24px 64px rgba(0,0,0,.2); }
.hidden { display:none !important; }
</style>
</head>
<body class="bg-gray-50">

<!-- ════════════ START OVERLAY ════════════ -->
<div id="overlay" style="position:fixed;inset:0;background:#1E3A8A;z-index:9999;display:flex;align-items:center;justify-content:center;overflow-y:auto;">
<div style="text-align:center;color:white;max-width:460px;padding:32px;">
    <div style="font-size:52px;margin-bottom:12px;">📖</div>
    <h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">DDCETPrepHub</h1>
    <p style="color:#93c5fd;margin-bottom:16px;"><?= $typeLabels[$testType] ?? 'Practice Test' ?></p>

    <?php if ($isAdaptive): ?>
    <div style="background:linear-gradient(135deg,#06B6D4,#8B5CF6);border-radius:12px;padding:14px 18px;margin-bottom:16px;text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:18px;">🤖</span>
            <strong style="font-size:13px;">Adaptive Learning Engine — ACTIVE</strong>
        </div>
        <p style="font-size:12px;color:#e0f2fe;line-height:1.6;margin:0;">
            This test uses <strong>AI-powered question selection</strong>. After every question the engine
            analyses your performance and auto-adjusts difficulty — harder when you're doing well,
            easier when you're struggling. <strong>Real-time!</strong>
        </p>
    </div>
    <?php endif; ?>

    <div style="background:rgba(255,255,255,.1);border-radius:12px;padding:12px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
        <div><div style="font-size:20px;font-weight:800;color:#fcd34d;"><?= $totalQ ?></div><div style="font-size:11px;color:#93c5fd;">Questions</div></div>
        <div><div style="font-size:20px;font-weight:800;color:#fcd34d;"><?= $timeMin ?>m</div><div style="font-size:11px;color:#93c5fd;">Duration</div></div>
        <div><div style="font-size:20px;font-weight:800;color:#fcd34d;"><?= $test['total_marks'] ?></div><div style="font-size:11px;color:#93c5fd;">Marks</div></div>
    </div>

    <div style="background:rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:24px;text-align:left;font-size:12px;color:#bfdbfe;line-height:2;">
        ⚠️ <strong style="color:white;">Rules:</strong><br>
        • Back button pressed → <strong style="color:#fca5a5;">auto submit</strong><br>
        • Tab switch → <strong style="color:#fca5a5;">auto submit</strong><br>
        • Timer runs even on refresh<br>
        • All answers saved automatically
    </div>

    <button onclick="startTest()" style="background:#06B6D4;color:white;font-size:16px;font-weight:800;padding:16px;border-radius:14px;border:none;cursor:pointer;width:100%;box-shadow:0 8px 24px rgba(6,182,212,.4);">
        🚀 Start Test in Fullscreen
    </button>
    <p style="font-size:11px;color:#60a5fa;margin-top:10px;">Press back now to go back without saving anything</p>
</div>
</div>

<!-- ════════════ EXAM (hidden until Start clicked) ════════════ -->
<div id="exam" style="display:none;" class="exam-grid">

    <!-- TOP BAR -->
    <div class="topbar">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="color:white;font-weight:800;font-size:16px;">📖 DDCETPrepHub</span>
            <span style="color:#3b82f6;">|</span>
            <span style="color:#93c5fd;font-size:13px;"><?= $typeLabels[$testType] ?? 'Test' ?></span>
            <?php if ($isAdaptive): ?>
            <span style="background:rgba(6,182,212,.2);border:1px solid #06B6D4;color:#06B6D4;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">🤖 ADAPTIVE</span>
            <?php endif; ?>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="color:#93c5fd;font-size:13px;" id="progress_text">Q 1 of <?= $totalQ ?></span>
            <div class="timer" id="timer_box"><span id="timer_disp">--:--</span></div>
            <button onclick="openSubmitModal()" style="background:#ef4444;color:white;font-weight:700;font-size:13px;padding:8px 18px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;">
                ✅ Submit Test
            </button>
        </div>
    </div>

    <!-- QUESTION PANEL -->
    <div class="qpanel">
        <div class="qcard">

            <!-- Q Header -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="background:#1E3A8A;color:white;font-weight:800;font-size:13px;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;" id="q_num">1</span>
                    <span class="diff-badge diff-easy" id="q_diff_badge">Easy</span>
                    <span style="color:#9ca3af;font-size:12px;">[2 Marks]</span>
                </div>
                <span style="color:#9ca3af;font-size:12px;" id="q_status">Not Attempted</span>
            </div>

            <!-- Question text -->
            <p style="color:#1f2937;font-weight:500;font-size:15px;line-height:1.7;margin-bottom:20px;" id="q_text">Loading...</p>

            <!-- Options -->
            <?php foreach (['A','B','C','D'] as $l): ?>
            <div class="opt" id="opt_<?=$l?>" onclick="selectOpt('<?=$l?>')">
                <span class="opt-lbl" id="lbl_<?=$l?>"><?=$l?></span>
                <span style="font-size:13px;color:#374151;" id="opt_txt_<?=$l?>">Option <?=$l?></span>
            </div>
            <?php endforeach; ?>

            <!-- Action bar -->
            <div class="abar">
                <button class="btn btn-prev" id="btn_prev" onclick="navigate(-1)">← Previous</button>
                <button class="btn btn-skip" onclick="skipQ()">⏭ Skip</button>
                <button class="btn btn-review" onclick="reviewQ()">🔖 Mark for Review</button>
                <button class="btn btn-save" id="btn_save" onclick="saveNext()" disabled>✅ Save &amp; Next</button>
                <button class="btn btn-next" onclick="navigate(1)">Next →</button>
            </div>
        </div>

        <!-- Jury Panel (HIDDEN — press J key to toggle during jury demo) -->
        <div id="jury_panel" style="display:none;margin-top:16px;max-width:760px;">
            <!-- filled by updateJuryPanel() -->
        </div>
    </div>

    <!-- SIDE PANEL -->
    <div class="sidepanel">
        <!-- Test info -->
        <div style="background:#eff6ff;border-radius:12px;padding:12px;margin-bottom:14px;">
            <p style="font-size:11px;font-weight:700;color:#1e40af;margin-bottom:4px;">📋 Test Summary</p>
            <p style="font-size:11px;color:#1d4ed8;">Total: <strong><?=$totalQ?> Questions</strong></p>
            <p style="font-size:11px;color:#1d4ed8;">Marks: <strong><?=$test['total_marks']?></strong> &nbsp;|&nbsp; Time: <strong><?=$timeMin?> min</strong></p>
        </div>

        <!-- Legend -->
        <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Legend</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#6b7280;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:#e2e8f0;border:1px solid #cbd5e1;"></div>Not Visited</div>
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:#dcfce7;border:1px solid #86efac;"></div>Answered</div>
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:#fee2e2;border:1px solid #fca5a5;"></div>Skipped</div>
            <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:3px;background:#ede9fe;border:1px solid #c4b5fd;"></div>For Review</div>
        </div>

        <!-- Counts -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;text-align:center;font-size:11px;">
            <div style="background:#f0fdf4;border-radius:10px;padding:10px;">
                <p style="font-size:18px;font-weight:800;color:#16a34a;" id="cnt_ans">0</p>
                <p style="color:#15803d;">Answered</p>
            </div>
            <div style="background:#fff1f2;border-radius:10px;padding:10px;">
                <p style="font-size:18px;font-weight:800;color:#dc2626;" id="cnt_skip">0</p>
                <p style="color:#dc2626;">Skipped</p>
            </div>
            <div style="background:#faf5ff;border-radius:10px;padding:10px;">
                <p style="font-size:18px;font-weight:800;color:#7c3aed;" id="cnt_rev">0</p>
                <p style="color:#7c3aed;">For Review</p>
            </div>
            <div style="background:#f8fafc;border-radius:10px;padding:10px;">
                <p style="font-size:18px;font-weight:800;color:#64748b;" id="cnt_nv"><?=$totalQ?></p>
                <p style="color:#64748b;">Not Visited</p>
            </div>
        </div>

        <!-- Palette -->
        <p style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">Question Palette</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;" id="palette">
            <?php for ($i=0;$i<$totalQ;$i++): ?>
            <button class="pal-btn pal-not_visited <?=$i===0?'pal-current':''?>"
                    id="pb_<?=$i?>" onclick="goTo(<?=$i?>)"><?=$i+1?></button>
            <?php endfor; ?>
        </div>
    </div>
</div><!-- /exam -->

<!-- ════════════ AUTO-SUBMIT POPUP ════════════ -->
<div id="as_modal" class="overlay-bg hidden">
    <div class="modal-box" style="text-align:center;">
        <div style="font-size:52px;margin-bottom:12px;" id="as_icon">🚨</div>
        <h2 style="font-size:18px;font-weight:800;color:#dc2626;margin-bottom:8px;" id="as_title">Violation Detected!</h2>
        <p style="color:#6b7280;font-size:13px;margin-bottom:16px;" id="as_msg">You left the test window.</p>
        <div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin-bottom:16px;">
            <p style="color:#dc2626;font-weight:700;font-size:13px;">Submitting in <span id="as_count" style="font-size:22px;font-weight:900;">5</span> seconds...</p>
            <div style="margin-top:10px;background:#fecaca;border-radius:20px;height:8px;overflow:hidden;">
                <div id="as_bar" style="height:8px;background:#dc2626;border-radius:20px;width:100%;transition:width 1s linear;"></div>
            </div>
        </div>
        <p style="font-size:11px;color:#9ca3af;">All saved answers will be evaluated.</p>
    </div>
</div>

<!-- ════════════ SUBMIT CONFIRM MODAL ════════════ -->
<div id="sub_modal" class="overlay-bg hidden">
    <div class="modal-box">
        <div style="text-align:center;margin-bottom:20px;">
            <span style="font-size:40px;">📋</span>
            <h2 style="font-size:18px;font-weight:800;color:#1f2937;margin-top:8px;">Submit Test?</h2>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;text-align:center;">
            <div style="background:#f0fdf4;border-radius:12px;padding:14px;"><p style="font-size:24px;font-weight:800;color:#16a34a;" id="sm_ans">0</p><p style="font-size:11px;color:#15803d;">Answered</p></div>
            <div style="background:#fff1f2;border-radius:12px;padding:14px;"><p style="font-size:24px;font-weight:800;color:#dc2626;" id="sm_skip">0</p><p style="font-size:11px;color:#dc2626;">Skipped</p></div>
            <div style="background:#faf5ff;border-radius:12px;padding:14px;"><p style="font-size:24px;font-weight:800;color:#7c3aed;" id="sm_rev">0</p><p style="font-size:11px;color:#7c3aed;">For Review</p></div>
            <div style="background:#f8fafc;border-radius:12px;padding:14px;"><p style="font-size:24px;font-weight:800;color:#64748b;"><?=$totalQ?></p><p style="font-size:11px;color:#64748b;">Total</p></div>
        </div>
        <p style="font-size:12px;color:#92400e;background:#fffbeb;border-radius:8px;padding:10px;margin-bottom:16px;">
            ⚠️ Marked-for-review questions will be evaluated based on saved answer (if any).
        </p>
        <div style="display:flex;gap:10px;">
            <button onclick="closeSubmitModal()" style="flex:1;background:#f1f5f9;color:#475569;font-weight:600;padding:12px;border-radius:10px;border:none;cursor:pointer;font-size:13px;">← Continue Test</button>
            <button onclick="submitTest()" style="flex:1;background:#dc2626;color:white;font-weight:700;padding:12px;border-radius:10px;border:none;cursor:pointer;font-size:13px;">Submit ✅</button>
        </div>
    </div>
</div>

<!-- Hidden form for final submission -->
<form id="sub_form" method="POST" action="../../controllers/StudentController.php">
    <input type="hidden" name="action" value="submit_test">
    <div id="sub_inputs"></div>
</form>

<script>
// ════════════════════════════════════════════════════
// CONSTANTS FROM PHP
// ════════════════════════════════════════════════════
const ALL_Q       = <?= json_encode(array_values($questions)) ?>;
const TOTAL_Q     = <?= (int)$totalQ ?>;
const TOTAL_SEC   = <?= (int)$remaining ?>;
const IS_ADAPTIVE = <?= $isAdaptive ? 'true' : 'false' ?>;
const CTRL        = '../../controllers/StudentController.php';

// Session restore data
const S_RESPONSES = <?= json_encode((object)($test['responses'] ?? [])) ?>;
const S_STATUSES  = <?= json_encode((object)($test['statuses']  ?? [])) ?>;
const S_INDEX     = <?= (int)($test['current_index'] ?? 0) ?>;
const S_SEQ       = <?= json_encode(array_values($test['question_sequence'] ?? [])) ?>;

// ════════════════════════════════════════════════════
// CORE STATE
// ════════════════════════════════════════════════════
let curIdx    = S_INDEX;
let responses = {};   // idx → 'A'|'B'|'C'|'D'
let statuses  = {};   // idx → 'not_visited'|'answered'|'skipped'|'review'

for (let i = 0; i < TOTAL_Q; i++) statuses[i] = 'not_visited';
Object.keys(S_RESPONSES).forEach(k => { responses[parseInt(k)] = S_RESPONSES[k]; });
Object.keys(S_STATUSES).forEach(k  => { statuses[parseInt(k)]  = S_STATUSES[k]; });

// ════════════════════════════════════════════════════
// ADAPTIVE ENGINE (fully isolated in try-catch)
// ════════════════════════════════════════════════════
const DIFFS  = ['easy','moderate','hard','advanced','tricky'];
const DCLRS  = {easy:'#16a34a',moderate:'#2563eb',hard:'#c2410c',advanced:'#dc2626',tricky:'#7c3aed'};
const DLBLS  = {easy:'Easy 😊',moderate:'Moderate 🤔',hard:'Hard 💪',advanced:'Advanced 🔥',tricky:'Tricky 🧩'};

let pool        = {easy:[],moderate:[],hard:[],advanced:[],tricky:[]};
let diffIdx     = 1;   // current difficulty index (0-4)
let perfHist    = [];  // last 5 performance scores
let juryVisible = false;
let shownQ      = [];  // question sequence shown to student

try {
    // Build pool
    ALL_Q.forEach(q => { if (pool[q.difficulty]) pool[q.difficulty].push({...q}); });
    // Shuffle
    Object.keys(pool).forEach(d => pool[d].sort(() => Math.random() - 0.5));
    // START FROM EASY ALWAYS (exam style adaptive)
    if (pool['easy'].length > 0) {
        diffIdx = DIFFS.indexOf('easy');
    } else {
        // fallback if no easy available
        for (const d of ['moderate','hard','advanced','tricky']) {
            if (pool[d].length > 0) {
                diffIdx = DIFFS.indexOf(d);
                break;
            }
        }
    }

    if (S_SEQ.length > 0) {
        // Refresh: restore saved sequence
        shownQ = S_SEQ;
        shownQ.forEach(q => {
            if (pool[q.difficulty])
                pool[q.difficulty] = pool[q.difficulty].filter(p => p.id !== q.id);
        });
    } else if (IS_ADAPTIVE) {
        // Fresh: seed first question
        const first = pickFromPool(diffIdx);
        if (first) shownQ.push(first);
    } else {
        // Topic-wise: fixed order
        shownQ = [...ALL_Q];
    }
} catch(e) {
    console.warn('Adaptive init failed, using fixed order:', e.message);
    shownQ = [...ALL_Q];
}

// Guarantee at least first question exists
if (!shownQ[0] && ALL_Q[0]) shownQ = [...ALL_Q];

function pickFromPool(tIdx) {
    for (let delta = 0; delta <= 4; delta++) {
        for (const dir of [0, 1, -1]) {
            const i = tIdx + (delta === 0 ? 0 : dir * delta);
            if (i < 0 || i > 4) continue;
            const d = DIFFS[i];
            if (pool[d] && pool[d].length > 0) return pool[d].shift();
        }
    }
    // Absolute fallback
    for (const d of DIFFS) if (pool[d] && pool[d].length > 0) return pool[d].shift();
    return null;
}

// ════════════════════════════════════════════════════
// AUTO-SAVE
// ════════════════════════════════════════════════════
function autoSave() {
    fetch(CTRL + '?action=autosave_test', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            responses: responses, statuses: statuses,
            current_index: curIdx, question_sequence: shownQ,
        }),
    }).catch(() => {});
}
setInterval(autoSave, 30000);

// ════════════════════════════════════════════════════
// TIMER
// ════════════════════════════════════════════════════
let secsLeft     = TOTAL_SEC;
let timerInterval = null;

function startTimer() {
    renderTimer();
    timerInterval = setInterval(() => {
        secsLeft--;
        renderTimer();
        if (secsLeft <= 0) { clearInterval(timerInterval); autoTimeSubmit(); }
    }, 1000);
}

function renderTimer() {
    const h = Math.floor(secsLeft / 3600);
    const m = Math.floor((secsLeft % 3600) / 60);
    const s = secsLeft % 60;
    const p = n => String(n).padStart(2,'0');
    const el = document.getElementById('timer_disp');
    if (el) el.textContent = h > 0 ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
    const box = document.getElementById('timer_box');
    if (!box) return;
    box.className = 'timer' + (secsLeft<=60?' crit':secsLeft<=300?' warn':'');
}

// ════════════════════════════════════════════════════
// RENDER QUESTION
// ════════════════════════════════════════════════════
function renderQ(idx) {
    const q = shownQ[idx];
    if (!q) { console.error('No q at idx', idx); return; }
    curIdx = idx;

    // Header
    const qn = document.getElementById('q_num');
    if (qn) qn.textContent = idx + 1;
    const pt = document.getElementById('progress_text');
    if (pt) pt.textContent = `Q ${idx+1} of ${TOTAL_Q}`;

    // Diff badge
    const b = document.getElementById('q_diff_badge');
    if (b) { b.textContent = q.difficulty[0].toUpperCase()+q.difficulty.slice(1); b.className = 'diff-badge diff-'+q.difficulty; }

    // Question text
    const qt = document.getElementById('q_text');
    if (qt) qt.textContent = q.question_text;

    // Options
    const opts = {A:q.option_a, B:q.option_b, C:q.option_c, D:q.option_d};
    const saved = responses[idx];
    ['A','B','C','D'].forEach(l => {
        const row = document.getElementById('opt_'+l);
        const txt = document.getElementById('opt_txt_'+l);
        if (txt) txt.textContent = opts[l] || '';
        if (row) row.className = 'opt' + (saved===l?' selected':'');
    });

    // Status
    const smap = {not_visited:'Not Attempted',answered:'Answered',skipped:'Skipped',review:'Marked for Review'};
    const st = document.getElementById('q_status');
    if (st) st.textContent = smap[statuses[idx]] || 'Not Attempted';

    // Buttons
    const sb = document.getElementById('btn_save');
    if (sb) sb.disabled = !saved;
    const pb = document.getElementById('btn_prev');
    if (pb) pb.disabled = idx === 0;

    // Hide jury panel on question change
    const jp = document.getElementById('jury_panel');
    if (jp && !juryVisible) jp.style.display = 'none';

    updatePaletteHL(idx);
}

// ════════════════════════════════════════════════════
// OPTION SELECT
// ════════════════════════════════════════════════════
function selectOpt(letter) {
    responses[curIdx] = letter;
    ['A','B','C','D'].forEach(l => {
        const row = document.getElementById('opt_'+l);
        if (row) row.className = 'opt' + (l===letter?' selected':'');
    });
    const sb = document.getElementById('btn_save');
    if (sb) sb.disabled = false;
    const st = document.getElementById('q_status');
    if (st) st.textContent = 'Answered';
}

// ════════════════════════════════════════════════════
// ACTION BUTTONS
// ════════════════════════════════════════════════════
function saveNext() {
    if (!responses[curIdx]) return;
    statuses[curIdx] = 'answered';
    updatePaletteBtn(curIdx);
    updateCounts();
    runAdaptive(curIdx, 'answered');
    autoSave();
    advance();
}

function skipQ() {
    if (!responses[curIdx]) statuses[curIdx] = 'skipped';
    updatePaletteBtn(curIdx);
    updateCounts();
    runAdaptive(curIdx, 'skipped');
    autoSave();
    advance();
}

function reviewQ() {
    statuses[curIdx] = 'review';
    updatePaletteBtn(curIdx);
    updateCounts();
    runAdaptive(curIdx, 'review');
    autoSave();
    advance();
}

function navigate(dir) {
    const next = curIdx + dir;
    if (next < 0 || next >= shownQ.length) return;
    markSkippedIfUntouched(curIdx);
    renderQ(next);
}

function advance() {
    const next = curIdx + 1;
    if (next >= TOTAL_Q) return; // last question
    // Ensure next question exists in shownQ
    if (!shownQ[next] && IS_ADAPTIVE) {
        try { const q = pickFromPool(diffIdx); if (q) shownQ.push(q); } catch(e) {}
    }
    if (shownQ[next]) renderQ(next);
}

function goTo(idx) {
    if (idx >= shownQ.length) return; // can't jump ahead of adaptive sequence
    markSkippedIfUntouched(curIdx);
    renderQ(idx);
}

function markSkippedIfUntouched(idx) {
    if (statuses[idx] === 'not_visited') {
        statuses[idx] = 'skipped';
        updatePaletteBtn(idx);
        updateCounts();
    }
}

// ════════════════════════════════════════════════════
// ADAPTIVE ENGINE
// ════════════════════════════════════════════════════
function runAdaptive(idx, action) {
    if (!IS_ADAPTIVE) return;

    try {
        const q   = shownQ[idx];
        const sel = responses[idx];
        const correct = sel && q && sel === q.correct_answer;

        // ------------------------------------------------
        // STEP 1 — Immediate performance signal
        // ------------------------------------------------
        let signal = 0;

        if (!sel || action === 'skipped') signal = -1;
        else if (correct) signal = +1;
        else signal = -1;

        // ------------------------------------------------
        // STEP 2 — Rolling stability (last 3 only)
        // ------------------------------------------------
        perfHist.push(signal);
        if (perfHist.length > 3) perfHist.shift();

        const avg = perfHist.reduce((a,b)=>a+b,0) / perfHist.length;

        const oldDiff = diffIdx;

        // ------------------------------------------------
        // STEP 3 — Decision logic (clear & explainable)
        // ------------------------------------------------
        if (avg >= 0.6 && diffIdx < 4) {
            diffIdx++;   // student performing well
        }
        else if (avg <= -0.3 && diffIdx > 0) {
            diffIdx--;   // student struggling
        }
        // else maintain

        // ------------------------------------------------
        // STEP 4 — Jury explanation
        // ------------------------------------------------
        updateJuryPanel({
            qNum: idx+1,
            action: action,
            score: signal,
            isCorrect: correct,
            selected: sel || 'None',
            correct: q?.correct_answer || '?',
            hist: [...perfHist],
            avg: avg.toFixed(2),
            oldD: DIFFS[oldDiff],
            newD: DIFFS[diffIdx],
            decision:
                diffIdx > oldDiff ? 'INCREASE ⬆️' :
                diffIdx < oldDiff ? 'DECREASE ⬇️' :
                'MAINTAIN ➡️',
            dColor:
                diffIdx > oldDiff ? '#16a34a' :
                diffIdx < oldDiff ? '#dc2626' :
                '#d97706',
        });

    } catch(e) {
        console.warn('Adaptive engine error:', e.message);
    }
}

// ════════════════════════════════════════════════════
// JURY PANEL — Press J to toggle (hidden from student)
// ════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
    if ((e.key==='j'||e.key==='J') && e.target.tagName!=='INPUT') {
        juryVisible = !juryVisible;
        const jp = document.getElementById('jury_panel');
        if (jp) jp.style.display = juryVisible ? 'block' : 'none';
    }
}, true);

function updateJuryPanel(d) {
    const panel = document.getElementById('jury_panel');
    if (!panel) return;

    const aIcon = d.action==='answered' ? (d.isCorrect?'✅':'❌') : d.action==='review'?'🔖':'⏭️';
    const sClr  = d.score >= 0.7 ? '#16a34a' : d.score >= 0 ? '#d97706' : '#dc2626';
    const sSign = d.score >= 0 ? '+' : '';

    const bars = d.hist.map((s,i) => {
        const c = s>=0.7?'#16a34a':s>=0?'#d97706':'#dc2626';
        const h = Math.max(4, Math.abs(s)*44);
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="font-size:9px;color:${c};font-weight:700;">${s>=0?'+':''}${s.toFixed(1)}</div>
          <div style="width:22px;height:${h}px;background:${c};border-radius:3px;"></div>
          <div style="font-size:9px;color:#94a3b8;">Q${d.qNum-d.hist.length+i+1}</div>
        </div>`;
    }).join('');

    panel.innerHTML = `
    <div style="background:#0f172a;border-radius:16px;padding:18px;font-family:monospace;font-size:12px;color:#e2e8f0;border:2px solid #06B6D4;position:relative;">
      <div style="position:absolute;top:-11px;left:16px;background:#06B6D4;color:white;font-size:10px;font-weight:700;padding:2px 12px;border-radius:20px;">
        🤖 ADAPTIVE ENGINE — JURY VIEW &nbsp;|&nbsp; Press J to hide
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
        <!-- Step 1 -->
        <div style="background:#1e293b;border-radius:10px;padding:12px;">
          <div style="color:#06B6D4;font-size:10px;font-weight:700;margin-bottom:8px;">① ACTION — Q${d.qNum}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span>${aIcon} ${d.action.toUpperCase()}</span>
            <span style="background:${sClr};color:white;padding:1px 10px;border-radius:20px;font-weight:700;">${sSign}${d.score.toFixed(2)}</span>
          </div>
          <div style="color:#64748b;font-size:10px;">Selected: <strong style="color:#e2e8f0;">${d.selected}</strong> | Correct: <strong style="color:#4ade80;">${d.correct}</strong></div>
          <div style="color:#64748b;font-size:10px;margin-top:4px;">
            ${d.score===1.0?'Correct Answer → +1.00':d.score===-0.5?'Wrong Answer → −0.50':d.score===0.6?'Review + Correct → +0.60':d.score===0.1?'Review + Wrong → +0.10':'Skipped → −0.30'}
          </div>
        </div>
        <!-- Step 2 -->
        <div style="background:#1e293b;border-radius:10px;padding:12px;">
          <div style="color:#06B6D4;font-size:10px;font-weight:700;margin-bottom:8px;">② ROLLING WINDOW (last ${d.hist.length})</div>
          <div style="display:flex;align-items:flex-end;gap:4px;height:52px;">${bars}</div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:10px;">avg(${d.hist.map(s=>`${s>=0?'+':''}${s.toFixed(1)}`).join(',')})</span>
            <span style="color:#f59e0b;font-weight:700;">${d.avg}</span>
          </div>
        </div>
        <!-- Step 3 -->
        <div style="background:#1e293b;border-radius:10px;padding:12px;">
          <div style="color:#06B6D4;font-size:10px;font-weight:700;margin-bottom:8px;">③ DECISION LOGIC</div>
          <div style="display:flex;gap:4px;font-size:10px;text-align:center;margin-bottom:8px;">
            <div style="flex:1;background:#0f172a;border-radius:5px;padding:5px;border:1px solid ${parseFloat(d.avg)<0.40?'#dc2626':'#1e293b'}">
              <div style="color:#dc2626;font-weight:700;">DECREASE ⬇️</div><div style="color:#475569;">avg &lt; 0.40</div>
            </div>
            <div style="flex:1;background:#0f172a;border-radius:5px;padding:5px;border:1px solid ${parseFloat(d.avg)>=0.40&&parseFloat(d.avg)<0.70?'#d97706':'#1e293b'}">
              <div style="color:#d97706;font-weight:700;">MAINTAIN ➡️</div><div style="color:#475569;">0.40–0.69</div>
            </div>
            <div style="flex:1;background:#0f172a;border-radius:5px;padding:5px;border:1px solid ${parseFloat(d.avg)>=0.70?'#16a34a':'#1e293b'}">
              <div style="color:#16a34a;font-weight:700;">INCREASE ⬆️</div><div style="color:#475569;">avg ≥ 0.70</div>
            </div>
          </div>
          <div style="text-align:center;padding:7px;background:#0f172a;border-radius:7px;border:1px solid ${d.dColor};">
            <span style="color:#94a3b8;font-size:11px;">${d.avg} → </span>
            <span style="color:${d.dColor};font-weight:700;font-size:13px;">${d.decision}</span>
          </div>
        </div>
        <!-- Step 4 -->
        <div style="background:#1e293b;border-radius:10px;padding:12px;">
          <div style="color:#06B6D4;font-size:10px;font-weight:700;margin-bottom:8px;">④ NEXT QUESTION</div>
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">Difficulty transition:</div>
          <div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:10px;">
            <span style="color:${DCLRS[d.oldD]};font-weight:700;">${DLBLS[d.oldD]}</span>
            <span style="color:#06B6D4;font-size:18px;">→</span>
            <span style="color:${DCLRS[d.newD]};font-weight:700;">${DLBLS[d.newD]}</span>
          </div>
          <div style="text-align:center;">
            <span style="background:${DCLRS[d.newD]};color:white;font-size:10px;font-weight:700;padding:3px 14px;border-radius:20px;">
              Q${d.qNum+1} → ${d.newD.toUpperCase()} pool
            </span>
          </div>
        </div>
      </div>
    </div>`;

    panel.style.display = juryVisible ? 'block' : 'none';
}

// ════════════════════════════════════════════════════
// PALETTE
// ════════════════════════════════════════════════════
function updatePaletteBtn(idx) {
    const btn = document.getElementById('pb_' + idx);
    if (btn) btn.className = 'pal-btn pal-' + statuses[idx];
}

function updatePaletteHL(activeIdx) {
    for (let i=0; i<TOTAL_Q; i++) {
        const b = document.getElementById('pb_'+i);
        if (!b) continue;
        if (i === activeIdx) b.classList.add('pal-current');
        else b.classList.remove('pal-current');
    }
}

function restorePalette() {
    for (let i=0; i<TOTAL_Q; i++) updatePaletteBtn(i);
    updateCounts();
}

// ════════════════════════════════════════════════════
// COUNTS
// ════════════════════════════════════════════════════
function updateCounts() {
    let a=0, sk=0, r=0, nv=0;
    for (let i=0;i<TOTAL_Q;i++) {
        if      (statuses[i]==='answered') a++;
        else if (statuses[i]==='skipped')  sk++;
        else if (statuses[i]==='review')   r++;
        else nv++;
    }
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('cnt_ans',a); set('cnt_skip',sk); set('cnt_rev',r); set('cnt_nv',nv);
}

// ════════════════════════════════════════════════════
// SUBMIT MODAL
// ════════════════════════════════════════════════════
function openSubmitModal() {
    let a=0,sk=0,r=0;
    for (let i=0;i<TOTAL_Q;i++) {
        if(statuses[i]==='answered') a++;
        else if(statuses[i]==='review') r++;
        else sk++;
    }
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('sm_ans',a); set('sm_skip',sk); set('sm_rev',r);
    document.getElementById('sub_modal').classList.remove('hidden');
}

function closeSubmitModal() {
    document.getElementById('sub_modal').classList.add('hidden');
}

// ════════════════════════════════════════════════════
// SUBMIT TEST
// ════════════════════════════════════════════════════
function submitTest() {
    clearInterval(timerInterval);
    const div = document.getElementById('sub_inputs');
    div.innerHTML = '';
    const qs = shownQ.length > 0 ? shownQ : ALL_Q;
    qs.forEach((q, i) => {
        div.innerHTML += `<input type="hidden" name="responses[${q.id}]" value="${responses[i]||''}">`;
        div.innerHTML += `<input type="hidden" name="statuses[${q.id}]"  value="${statuses[i]||'not_visited'}">`;
    });
    document.getElementById('sub_form').submit();
}

function autoTimeSubmit() {
    alert('⏰ Time is up! Submitting automatically.');
    submitTest();
}

// ════════════════════════════════════════════════════
// AUTO-SUBMIT POPUP (back / tab switch)
// ════════════════════════════════════════════════════
let asTriggered = false;

function showAutoSubmitPopup(reason) {
    if (asTriggered) return;
    asTriggered = true;
    autoSave();

    const icons = {
        back:'↩️',
        tab:'🚨',
        refresh:'🔄'
    };

    const titles = {
        back:'Back Button Detected!',
        tab:'Tab Switch Detected!',
        refresh:'Page Refresh Attempted!'
    };

    const msgs = {
        back:'You pressed the back button during the test.',
        tab:'You switched away from the test window.',
        refresh:'Refreshing the page is not allowed during the test.'
    };
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('as_icon',  icons[reason]  || '🚨');
    set('as_title', titles[reason] || 'Violation!');
    set('as_msg',   msgs[reason]   || '');

    document.getElementById('as_modal').classList.remove('hidden');

    let cnt = 5;
    const cntEl = document.getElementById('as_count');
    const barEl = document.getElementById('as_bar');
    const iv = setInterval(() => {
        cnt--;
        if(cntEl) cntEl.textContent = cnt;
        if(barEl) barEl.style.width = (cnt/5*100)+'%';
        if(cnt <= 0) { clearInterval(iv); submitTest(); }
    }, 1000);
}

// ════════════════════════════════════════════════════
// INIT — called by startTest() when overlay button clicked
// ════════════════════════════════════════════════════
function initExam() {
    renderQ(curIdx);
    restorePalette();
    startTimer();
}
</script>
</body>
</html>