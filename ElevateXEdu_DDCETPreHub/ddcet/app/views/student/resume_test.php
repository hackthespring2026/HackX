<?php
// ============================================================
// DDCETPrepHub — app/views/student/resume_test.php
// Shown when student tries to navigate away during active test
// ============================================================
session_start();

if (empty($_SESSION['active_test'])) {
    header('Location: dashboard.php'); exit;
}

$test      = $_SESSION['active_test'];
$elapsed   = time() - $test['start_time'];
$remaining = max(0, ($test['time_minutes'] * 60) - $elapsed);
$remMin    = intdiv($remaining, 60);
$remSec    = $remaining % 60;

// Count progress from saved state
$answered = 0; $skipped = 0; $review = 0;
$statuses = $test['statuses'] ?? [];
foreach ($statuses as $s) {
    if ($s === 'answered')    $answered++;
    elseif ($s === 'skipped') $skipped++;
    elseif ($s === 'review')  $review++;
}
$notAttempted = $test['total_q'] - $answered - $skipped - $review;

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
    <title>Resume Test — DDCETPrepHub</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 min-h-screen flex items-center justify-center">
<div class="max-w-md w-full mx-4">

    <!-- Warning Card -->
    <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">

        <!-- Red Header -->
        <div class="bg-red-500 px-8 py-6 text-center">
            <div class="text-5xl mb-2">🚨</div>
            <h1 class="text-xl font-black text-white">Active Test Detected!</h1>
            <p class="text-red-100 text-sm mt-1">You navigated away from your test</p>
        </div>

        <!-- Test Info -->
        <div class="px-8 py-6">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p class="text-xs font-bold text-amber-700 uppercase mb-2">Your test is still running</p>
                <p class="text-sm text-amber-800 font-semibold">
                    <?= $typeLabels[$test['test_type']] ?? 'Practice Test' ?>
                </p>
                <p class="text-sm text-amber-700 mt-1">
                    Total: <strong><?= $test['total_q'] ?> questions</strong> |
                    <?= $test['time_minutes'] ?> minutes
                </p>
            </div>

            <!-- Timer still running -->
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-center">
                <p class="text-xs text-red-600 font-semibold mb-1">⏱ TIME REMAINING</p>
                <p class="text-3xl font-black text-red-600 font-mono">
                    <?= sprintf('%02d:%02d', $remMin, $remSec) ?>
                </p>
                <p class="text-xs text-red-400 mt-1">Timer is still counting down!</p>
            </div>

            <!-- Progress so far -->
            <div class="grid grid-cols-3 gap-2 mb-6 text-center text-xs">
                <div class="bg-green-50 rounded-lg p-2">
                    <p class="text-lg font-black text-green-700"><?= $answered ?></p>
                    <p class="text-green-600">Answered</p>
                </div>
                <div class="bg-purple-50 rounded-lg p-2">
                    <p class="text-lg font-black text-purple-700"><?= $review ?></p>
                    <p class="text-purple-600">For Review</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-2">
                    <p class="text-lg font-black text-gray-600"><?= $notAttempted ?></p>
                    <p class="text-gray-500">Remaining</p>
                </div>
            </div>

            <!-- Buttons -->
            <a href="test_window.php"
               class="block w-full bg-blue-900 hover:bg-blue-800 text-white text-center font-black py-4 rounded-xl text-base transition mb-3">
                ▶ Resume Test Now
            </a>

            <!-- Submit from here -->
            <form method="POST" action="../../controllers/StudentController.php" id="abandon_form">
                <input type="hidden" name="action" value="submit_test">
                <?php
                $responses = $test['responses'] ?? [];
                $statuses  = $test['statuses']  ?? [];
                foreach ($responses as $qid => $ans): ?>
                <input type="hidden" name="responses[<?= $qid ?>]" value="<?= htmlspecialchars($ans) ?>">
                <?php endforeach; ?>
                <?php foreach ($statuses as $qid => $s): ?>
                <input type="hidden" name="statuses[<?= $qid ?>]" value="<?= htmlspecialchars($s) ?>">
                <?php endforeach; ?>
                <button type="submit"
                    onclick="return confirm('Are you sure? This will submit your test with current answers.')"
                    class="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold py-3 rounded-xl text-sm transition">
                    ✅ Submit Test With Current Answers
                </button>
            </form>

        </div>
    </div>

    <p class="text-center text-gray-500 text-xs mt-4">
        DDCETPrepHub — Do not close the browser during the test
    </p>
</div>
</body>
</html>