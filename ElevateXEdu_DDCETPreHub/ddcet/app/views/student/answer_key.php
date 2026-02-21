<?php
// ============================================================
// DDCETPrepHub — app/views/student/answer_key.php
// Printable Answer Key with Explanations
// ============================================================
session_start();
if (empty($_SESSION['test_result'])) {
    die('<h2>No test result found. Please complete a test first.</h2>');
}

$r         = $_SESSION['test_result'];
$analysis  = $r['analysis'];
$o         = $analysis['overall'];
$questions = $r['questions'];
$responses = $r['responses'];
$statuses  = $r['statuses'];
$testType  = $r['test_type'];
$names     = $r['names'];

$typeLabels = ['topic'=>'Topic Wise','chapter'=>'Chapter Wise','subject'=>'Subject Wise','full'=>'Full Mock Test'];
$testDate   = date('d F Y, g:i A');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Answer Key — DDCETPrepHub</title>
<style>
/* ── Screen styles ── */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #f1f5f9;
    color: #1e293b;
    font-size: 14px;
    line-height: 1.6;
}

.page-wrap { max-width: 820px; margin: 0 auto; padding: 24px 16px; }

/* Header banner */
.header-banner {
    background: linear-gradient(135deg, #1E3A8A, #1e40af);
    color: white;
    border-radius: 16px;
    padding: 24px 28px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}
.header-logo { font-size: 22px; font-weight: 900; }
.header-sub  { font-size: 13px; color: #93c5fd; margin-top: 3px; }

/* Quick stats strip */
.stats-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}
.stat-pill {
    background: white;
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.stat-val  { font-size: 22px; font-weight: 900; }
.stat-lbl  { font-size: 11px; color: #64748b; margin-top: 2px; }

/* Print action bar */
.print-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    border-radius: 12px;
    padding: 14px 20px;
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 10px;
}
.btn-print {
    background: #7c3aed;
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}
.btn-back {
    background: #f1f5f9;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 18px;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    cursor: pointer;
    text-decoration: none;
}

/* Answer key section */
.section-head {
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .07em;
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Question card */
.q-card {
    background: white;
    border-radius: 14px;
    padding: 20px 22px;
    margin-bottom: 14px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
    page-break-inside: avoid;
}
.q-card.correct { border-left: 5px solid #16a34a; }
.q-card.wrong   { border-left: 5px solid #dc2626; }
.q-card.skipped { border-left: 5px solid #94a3b8; }

.q-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}
.q-num {
    background: #1e293b;
    color: white;
    font-size: 11px;
    font-weight: 800;
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.result-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
}
.rb-correct { background: #dcfce7; color: #16a34a; }
.rb-wrong   { background: #fee2e2; color: #dc2626; }
.rb-skipped { background: #f1f5f9; color: #64748b; }

.diff-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    text-transform: uppercase;
}
.diff-easy      { background: #dcfce7; color: #16a34a; }
.diff-moderate  { background: #dbeafe; color: #1d4ed8; }
.diff-hard      { background: #fed7aa; color: #c2410c; }
.diff-advanced  { background: #fee2e2; color: #dc2626; }
.diff-tricky    { background: #f3e8ff; color: #7c3aed; }

.q-text {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 14px;
    line-height: 1.7;
}

/* Option rows */
.opt {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 9px;
    margin-bottom: 7px;
    border: 1.5px solid #e5e7eb;
    background: white;
    font-size: 13px;
    color: #374151;
}
.opt.opt-correct {
    background: #f0fdf4;
    border-color: #86efac;
    font-weight: 700;
}
.opt.opt-selected-wrong {
    background: #fff1f2;
    border-color: #fca5a5;
}
.opt-lbl {
    width: 26px; height: 26px;
    border-radius: 7px;
    background: #f1f5f9;
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.opt.opt-correct .opt-lbl {
    background: #16a34a;
    color: white;
}
.opt.opt-selected-wrong .opt-lbl {
    background: #dc2626;
    color: white;
}
.opt-tag {
    font-size: 10px;
    font-weight: 700;
    margin-left: auto;
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 20px;
}
.tag-correct  { background: #16a34a; color: white; }
.tag-yours    { background: #dc2626; color: white; }

/* Explanation box */
.explanation {
    margin-top: 12px;
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 0 10px 10px 0;
    padding: 12px 14px;
    font-size: 13px;
    color: #1e3a8a;
    line-height: 1.6;
}
.explanation-label {
    font-size: 11px;
    font-weight: 800;
    color: #1d4ed8;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Quick Answer Key Box */
.quick-key-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
    margin-bottom: 24px;
}
.qk-cell {
    text-align: center;
    padding: 8px 6px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 12px;
}
.qk-cell .qk-num { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
.qk-cell .qk-ans { font-size: 15px; font-weight: 900; }
.qk-correct { background: #f0fdf4; border-color: #86efac; }
.qk-correct .qk-ans { color: #16a34a; }
.qk-wrong   { background: #fff1f2; border-color: #fca5a5; }
.qk-wrong   .qk-ans { color: #dc2626; }
.qk-skipped { background: #f8fafc; border-color: #e2e8f0; }
.qk-skipped .qk-ans { color: #94a3b8; }

/* ── PRINT STYLES ── */
@media print {
    body { background: white !important; font-size: 12px; }
    .page-wrap { max-width: 100%; padding: 0; }
    .print-bar, .no-print { display: none !important; }
    .header-banner {
        background: #1E3A8A !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        border-radius: 10px;
        margin-bottom: 16px;
        padding: 18px 22px;
    }
    .stats-strip { gap: 6px; margin-bottom: 12px; }
    .stat-pill { padding: 8px; }
    .q-card { margin-bottom: 10px; padding: 14px 18px; border-radius: 8px; }
    .q-card.correct { border-left: 5px solid #16a34a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .q-card.wrong   { border-left: 5px solid #dc2626 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .q-card.skipped { border-left: 5px solid #94a3b8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .opt.opt-correct { background: #f0fdf4 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .opt.opt-selected-wrong { background: #fff1f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .opt-lbl, .opt.opt-correct .opt-lbl, .opt.opt-selected-wrong .opt-lbl { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .explanation { background: #eff6ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .qk-correct, .qk-wrong, .qk-skipped { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-head { margin: 16px 0 10px; }
}
</style>
</head>
<body>
<div class="page-wrap">

    <!-- Action Bar (screen only) -->
    <div class="print-bar">
        <div style="display:flex;align-items:center;gap:10px;">
            <a href="test_result.php" class="btn-back">← Back to Report</a>
            <p style="font-size:13px;color:#64748b;">📋 Answer Key with Explanations — <?= $typeLabels[$testType] ?? 'Test' ?></p>
        </div>
        <button class="btn-print" onclick="window.print()">🖨️ Print Answer Key</button>
    </div>

    <!-- Header Banner (shows on print too) -->
    <div class="header-banner">
        <div>
            <div class="header-logo">📖 DDCETPrepHub</div>
            <div class="header-sub">Answer Key with Explanations · <?= $typeLabels[$testType] ?? 'Test' ?></div>
            <div style="font-size:11px;color:#bfdbfe;margin-top:4px;">Generated: <?= $testDate ?></div>
        </div>
        <div style="text-align:right;color:white;">
            <div style="font-size:30px;font-weight:900;"><?= $o['score'] ?>/<?= $o['max_score'] ?></div>
            <div style="font-size:12px;color:#bfdbfe;">Score · <?= $o['accuracy'] ?>% accuracy</div>
            <div style="font-size:11px;color:#93c5fd;margin-top:4px;">
                ✅ <?= $o['correct'] ?> Correct &nbsp;·&nbsp; ❌ <?= $o['wrong'] ?> Wrong &nbsp;·&nbsp; ⏭ <?= $o['skipped'] ?> Skipped
            </div>
        </div>
    </div>

    <!-- Quick Stats Strip -->
    <div class="stats-strip">
        <div class="stat-pill">
            <div class="stat-val" style="color:#1E3A8A;"><?= $o['total'] ?></div>
            <div class="stat-lbl">Total Qs</div>
        </div>
        <div class="stat-pill">
            <div class="stat-val" style="color:#16a34a;"><?= $o['correct'] ?></div>
            <div class="stat-lbl">Correct</div>
        </div>
        <div class="stat-pill">
            <div class="stat-val" style="color:#dc2626;"><?= $o['wrong'] ?></div>
            <div class="stat-lbl">Wrong</div>
        </div>
        <div class="stat-pill">
            <div class="stat-val" style="color:#94a3b8;"><?= $o['skipped'] ?></div>
            <div class="stat-lbl">Skipped</div>
        </div>
        <div class="stat-pill">
            <div class="stat-val" style="color:#7c3aed;"><?= $o['accuracy'] ?>%</div>
            <div class="stat-lbl">Accuracy</div>
        </div>
    </div>

    <!-- Quick Answer Key Grid -->
    <div class="section-head">⚡ Quick Answer Key</div>
    <div class="quick-key-grid">
    <?php foreach ($questions as $idx => $q):
        $qid      = $q['id'];
        $selected = $responses[$qid] ?? '';
        $status   = $statuses[$qid]  ?? 'not_visited';
        $isCorrect= ($selected !== '' && $selected === $q['correct_answer']);
        $isWrong  = ($selected !== '' && $selected !== $q['correct_answer']);
        $isSkipped= !$selected || in_array($status, ['skipped','not_visited']);
        $cls      = $isCorrect ? 'qk-correct' : ($isWrong ? 'qk-wrong' : 'qk-skipped');
        $icon     = $isCorrect ? '✅' : ($isWrong ? '❌' : '—');
    ?>
    <div class="qk-cell <?= $cls ?>">
        <div class="qk-num">Q<?= $idx+1 ?></div>
        <div class="qk-ans"><?= $q['correct_answer'] ?></div>
        <div style="font-size:10px;"><?= $icon ?></div>
    </div>
    <?php endforeach; ?>
    </div>

    <!-- Full Detailed Answer Key -->
    <div class="section-head">📝 Detailed Answer Key with Explanations</div>

    <?php foreach ($questions as $idx => $q):
        $qid      = $q['id'];
        $selected = $responses[$qid] ?? '';
        $status   = $statuses[$qid]  ?? 'not_visited';
        $isCorrect= ($selected !== '' && $selected === $q['correct_answer']);
        $isWrong  = ($selected !== '' && $selected !== $q['correct_answer']);
        $isSkipped= !$selected || in_array($status, ['skipped','not_visited']);
        $cardCls  = $isCorrect ? 'correct' : ($isWrong ? 'wrong' : 'skipped');

        $topicName  = $names['topics'][$q['topic_id']   ?? 0] ?? '';
        $chapterName= $names['chapters'][$q['chapter_id'] ?? 0] ?? '';
    ?>
    <div class="q-card <?= $cardCls ?>">

        <!-- Meta row -->
        <div class="q-meta">
            <div class="q-num"><?= $idx+1 ?></div>
            <?php if ($isCorrect): ?>
                <span class="result-badge rb-correct">✅ Correct</span>
            <?php elseif ($isWrong): ?>
                <span class="result-badge rb-wrong">❌ Wrong</span>
            <?php else: ?>
                <span class="result-badge rb-skipped">⏭ Not Attempted</span>
            <?php endif; ?>
            <span class="diff-badge diff-<?= $q['difficulty'] ?>"><?= ucfirst($q['difficulty']) ?></span>
            <?php if ($topicName): ?>
                <span style="font-size:11px;color:#94a3b8;background:#f8fafc;padding:2px 8px;border-radius:20px;"><?= htmlspecialchars($topicName) ?></span>
            <?php endif; ?>
            <?php if ($chapterName): ?>
                <span style="font-size:11px;color:#94a3b8;">· <?= htmlspecialchars($chapterName) ?></span>
            <?php endif; ?>
        </div>

        <!-- Question text -->
        <div class="q-text"><?= htmlspecialchars($q['question_text']) ?></div>

        <!-- Options -->
        <?php foreach (['A'=>$q['option_a'],'B'=>$q['option_b'],'C'=>$q['option_c'],'D'=>$q['option_d']] as $letter => $text):
            $isCA = ($letter === $q['correct_answer']);
            $isSA = ($letter === $selected);
            $optCls = $isCA ? 'opt-correct' : ($isSA && $isWrong ? 'opt-selected-wrong' : '');
        ?>
        <div class="opt <?= $optCls ?>">
            <span class="opt-lbl"><?= $letter ?></span>
            <span style="flex:1;"><?= htmlspecialchars($text) ?></span>
            <?php if ($isCA): ?>
                <span class="opt-tag tag-correct">✓ Correct Answer</span>
            <?php elseif ($isSA && $isWrong): ?>
                <span class="opt-tag tag-yours">✗ Your Answer</span>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>

        <!-- Explanation -->
        <div class="explanation">
            <div class="explanation-label">💡 Explanation</div>
            <?= htmlspecialchars($q['explanation'] ?? 'No explanation available for this question.') ?>
        </div>

    </div>
    <?php endforeach; ?>

    <div style="text-align:center;padding:20px;font-size:12px;color:#94a3b8;" class="no-print">
        <p>End of Answer Key — DDCETPrepHub © <?= date('Y') ?></p>
    </div>

    <!-- Footer for print -->
    <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
        DDCETPrepHub · Diagnostic Answer Key · <?= $testDate ?> · Page generated automatically
    </div>

</div>

<script>
// Auto trigger print dialog (optional — comment out if not wanted)
// window.addEventListener('load', () => setTimeout(() => window.print(), 600));
</script>
</body>
</html>