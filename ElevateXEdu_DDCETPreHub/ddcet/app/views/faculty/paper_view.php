<?php
// ============================================================
// DDCETPrepHub — app/views/faculty/paper_view.php
// Renders printable Question Paper OR Answer Key
// Uses session data set by FacultyController
// ============================================================
session_start();

$view = $_GET['view'] ?? 'question_paper';

if ($view === 'answer_key') {
    // Showing Answer Key — read from answer_key_data session
    if (empty($_SESSION['answer_key_data'])) {
        header('Location: dashboard.php');
        exit;
    }
    $data        = $_SESSION['answer_key_data'];
    $isAnswerKey = true;
    // Back button should go to Question Paper view (if it exists), else dashboard
    $backUrl  = !empty($_SESSION['paper_data']) ? 'paper_view.php?view=question_paper' : 'dashboard.php';
    $backText = !empty($_SESSION['paper_data']) ? '← Back to Question Paper' : '← Back to Dashboard';
} else {
    // Showing Question Paper — read from paper_data session
    if (empty($_SESSION['paper_data'])) {
        header('Location: dashboard.php');
        exit;
    }
    $data        = $_SESSION['paper_data'];
    $isAnswerKey = false;
    // Back button always goes to dashboard from question paper
    $backUrl  = 'dashboard.php';
    $backText = '← Back to Dashboard';
}

$type = $data['type'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $isAnswerKey ? 'Answer Key' : 'Question Paper' ?> — <?= htmlspecialchars($data['exam_title']) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap');

        body { font-family: 'Source Sans 3', sans-serif; }
        .paper-title { font-family: 'Merriweather', serif; }

        /* ===== PRINT STYLES ===== */
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            .paper-container {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 20px !important;
                max-width: 100% !important;
            }
            .question-block { page-break-inside: avoid; }
        }

        .option-label {
            display: inline-block;
            width: 22px; height: 22px;
            border: 1.5px solid #cbd5e1;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
            flex-shrink: 0;
        }
        .correct-option .option-label {
            background: #dcfce7;
            border-color: #16a34a;
            color: #16a34a;
        }
        .correct-option { color: #15803d; font-weight: 600; }

        .difficulty-badge {
            font-size: 10px; font-weight: 700;
            padding: 2px 8px; border-radius: 20px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .diff-easy     { background:#dcfce7; color:#16a34a; }
        .diff-moderate { background:#dbeafe; color:#1d4ed8; }
        .diff-hard     { background:#fed7aa; color:#c2410c; }
        .diff-advanced { background:#fee2e2; color:#dc2626; }
        .diff-tricky   { background:#f3e8ff; color:#7c3aed; }
    </style>
</head>
<body class="bg-gray-100 min-h-screen py-8">

<!-- ===== ACTION BAR (no print) ===== -->
<div class="no-print fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
    <div class="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <span class="text-2xl">📖</span>
            <div>
                <p class="font-bold text-gray-800 text-sm">DDCETPrepHub</p>
                <p class="text-xs text-gray-500"><?= $isAnswerKey ? 'Answer Key Generated' : 'Question Paper Generated' ?></p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <a href="<?= $backUrl ?>"
               class="text-sm text-gray-600 hover:text-gray-800 border border-gray-300 px-4 py-2 rounded-lg transition">
                <?= $backText ?>
            </a>

            <?php if (!$isAnswerKey): ?>
            <!-- Generate Answer Key from same questions — no need to go to dashboard -->
            <form method="POST" action="../../controllers/FacultyController.php" style="display:inline">
                <input type="hidden" name="action" value="make_answer_key_from_session">
                <button type="submit"
                    class="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Generate Answer Key
                </button>
            </form>
            <?php endif; ?>

            <button onclick="window.print()"
                class="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Save / Print as PDF
            </button>
        </div>
    </div>
</div>

<!-- ===== PAPER ===== -->
<div class="paper-container max-w-4xl mx-auto mt-20 no-print:mt-20 bg-white shadow-lg rounded-xl p-10">

    <!-- Paper Header -->
    <div class="text-center border-b-2 border-gray-800 pb-6 mb-6">
        <h1 class="paper-title text-2xl font-bold text-gray-900 uppercase tracking-wide">
            <?= htmlspecialchars($data['institute_name']) ?>
        </h1>
        <h2 class="paper-title text-xl font-bold text-gray-800 mt-1">
            <?= htmlspecialchars($data['exam_title']) ?>
        </h2>
        <?php if ($isAnswerKey): ?>
        <div class="mt-2">
            <span class="bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full text-sm uppercase tracking-wider">
                ✓ Answer Key with Explanations
            </span>
        </div>
        <?php endif; ?>
    </div>

    <!-- Paper Info Row -->
    <div class="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 mb-6 text-sm">
        <div>
            <p class="text-gray-500 font-medium">Subject</p>
            <p class="font-bold text-gray-800"><?= htmlspecialchars($data['subject_name']) ?></p>
        </div>
        <div>
            <p class="text-gray-500 font-medium">Chapter</p>
            <p class="font-bold text-gray-800"><?= htmlspecialchars($data['chapter_names']) ?></p>
        </div>
        <div>
            <p class="text-gray-500 font-medium">Topics Covered</p>
            <p class="font-bold text-gray-800"><?= htmlspecialchars($data['topic_names']) ?></p>
        </div>
        <div>
            <p class="text-gray-500 font-medium">Total Questions</p>
            <p class="font-bold text-gray-800"><?= $data['total_questions'] ?></p>
        </div>
        <div>
            <p class="text-gray-500 font-medium">Total Marks</p>
            <p class="font-bold text-gray-800"><?= $data['total_marks'] ?> Marks</p>
        </div>
        <div>
            <p class="text-gray-500 font-medium">Generated On</p>
            <p class="font-bold text-gray-800"><?= $data['generated_at'] ?></p>
        </div>
    </div>

    <!-- Instructions -->
    <?php if (!$isAnswerKey): ?>
    <div class="border border-gray-300 rounded-lg p-4 mb-6 text-sm text-gray-700">
        <p class="font-bold mb-2 text-gray-800">Instructions:</p>
        <ol class="list-decimal list-inside space-y-1">
            <li>All questions are compulsory.</li>
            <li>Each question carries <strong>2 marks</strong>. There is no negative marking.</li>
            <li>Choose the most appropriate answer from the given options (A, B, C, D).</li>
            <li>Use Black/Blue pen for marking answers.</li>
        </ol>
    </div>
    <?php endif; ?>

    <!-- ===== QUESTIONS ===== -->
    <div class="space-y-6">
        <?php foreach ($data['questions'] as $index => $q): ?>
        <div class="question-block <?= $isAnswerKey ? 'border border-gray-200 rounded-xl p-5' : '' ?>">

            <!-- Question Header -->
            <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex items-start gap-3 flex-1">
                    <span class="flex-shrink-0 w-8 h-8 bg-gray-800 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                        <?= $index + 1 ?>
                    </span>
                    <p class="text-gray-800 font-medium leading-relaxed pt-1">
                        <?= htmlspecialchars($q['question_text']) ?>
                    </p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="difficulty-badge diff-<?= $q['difficulty'] ?>">
                        <?= ucfirst($q['difficulty']) ?>
                    </span>
                    <span class="text-xs text-gray-500 font-medium">[<?= $q['marks'] ?> Marks]</span>
                </div>
            </div>

            <!-- Options -->
            <div class="ml-11 grid grid-cols-2 gap-2">
                <?php
                $opts = ['A'=>$q['option_a'], 'B'=>$q['option_b'], 'C'=>$q['option_c'], 'D'=>$q['option_d']];
                foreach ($opts as $letter => $text):
                    $isCorrect = $isAnswerKey && ($letter === $q['correct_answer']);
                ?>
                <div class="flex items-center gap-1 py-1 <?= $isCorrect ? 'correct-option' : '' ?>">
                    <span class="option-label <?= $isCorrect ? '' : '' ?>"><?= $letter ?></span>
                    <span class="text-sm <?= $isCorrect ? 'font-semibold text-green-700' : 'text-gray-700' ?>">
                        <?= htmlspecialchars($text) ?>
                        <?= $isCorrect ? ' ✓' : '' ?>
                    </span>
                </div>
                <?php endforeach; ?>
            </div>

            <!-- Explanation (Answer Key only) -->
            <?php if ($isAnswerKey): ?>
            <div class="ml-11 mt-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg px-4 py-2">
                <p class="text-xs font-bold text-green-700 mb-1">
                    Correct Answer: <?= $q['correct_answer'] ?> | Explanation:
                </p>
                <p class="text-sm text-green-800"><?= htmlspecialchars($q['explanation']) ?></p>
            </div>
            <?php endif; ?>

        </div>

        <?php if (!$isAnswerKey && ($index + 1) % 2 === 0 && $index + 1 < count($data['questions'])): ?>
        <hr class="border-gray-100">
        <?php endif; ?>

        <?php endforeach; ?>
    </div>

    <!-- Footer -->
    <div class="mt-10 pt-6 border-t-2 border-gray-300 flex justify-between items-center text-sm text-gray-500">
        <p>📖 DDCETPrepHub — <?= htmlspecialchars($data['institute_name']) ?></p>
        <p><?= $isAnswerKey ? 'Answer Key' : 'Question Paper' ?> | <?= $data['total_questions'] ?> Questions | <?= $data['total_marks'] ?> Marks</p>
    </div>

</div><!-- /paper -->

<div class="no-print h-16"></div>

</body>
</html>