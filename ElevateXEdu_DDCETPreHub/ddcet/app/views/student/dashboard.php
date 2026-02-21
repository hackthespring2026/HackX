<?php
// ============================================================
// DDCETPrepHub — app/views/student/dashboard.php
// DUAL MODE: Normal (Beginner) + Adaptive (Advanced)
// ============================================================
session_start();

if (!empty($_SESSION['active_test']) && isset($_SESSION['active_test']['start_time'])) {
    $elapsed = time() - $_SESSION['active_test']['start_time'];
    if ($elapsed > 10) {
        header('Location: resume_test.php');
        exit;
    } else {
        unset($_SESSION['active_test']);
    }
}

$studentName = $_SESSION['student_name'] ?? 'Student';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Dashboard — DDCETPrepHub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .sidebar { background: linear-gradient(180deg, #1E3A8A 0%, #1e40af 100%); }
        .nav-active { background: rgba(6,182,212,.2); border-left: 3px solid #06B6D4; }

        /* Test Cards */
        .test-card {
            border: 2px solid #e5e7eb;
            border-radius: 20px;
            padding: 24px;
            cursor: pointer;
            transition: all 0.25s ease;
            background: #fff;
            position: relative;
        }
        .test-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(0,0,0,.12);
            border-color: #06B6D4;
        }

        .mode-badge {
            display: inline-block;
            font-size: 10px; font-weight: 800;
            padding: 4px 12px; border-radius: 20px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge-beginner { background: #dbeafe; color: #1e40af; }
        .badge-advanced { background: linear-gradient(135deg,#06B6D4,#8B5CF6); color: white; }

        .start-btn {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 16px;
        }
        .btn-normal { background: #3b82f6; color: white; }
        .btn-adaptive { background: linear-gradient(135deg,#06B6D4,#8B5CF6); color: white; }
        .start-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .info-banner {
            background: linear-gradient(135deg, #1E3A8A, #8B5CF6);
            border-radius: 16px;
            padding: 20px 24px;
            color: white;
            margin-bottom: 24px;
        }
        
        .guide-box {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
        }
        
        .guide-section {
            display: flex;
            gap: 16px;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 12px;
        }
        .guide-beginner { background: #eff6ff; border-left: 4px solid #3b82f6; }
        .guide-advanced { background: #f0fdff; border-left: 4px solid #06B6D4; }
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
                    <p class="text-blue-300 text-xs">Student Portal</p>
                </div>
            </div>
        </div>

        <div class="px-5 py-4 border-b border-blue-700">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center text-blue-900 font-bold text-lg">
                    <?= strtoupper(substr($studentName, 0, 1)) ?>
                </div>
                <div>
                    <p class="font-semibold text-sm text-white"><?= htmlspecialchars($studentName) ?></p>
                    <p class="text-blue-300 text-xs">DDCET Aspirant</p>
                </div>
            </div>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
            <a href="dashboard.php" class="nav-active flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Dashboard
            </a>
            <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-700 hover:text-white transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                My Tests
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
        <div class="max-w-5xl mx-auto px-8 py-8">

            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">Practice Tests</h1>
                <p class="text-gray-500 mt-1">Choose test type and mode that matches your skill level</p>
            </div>

            <!-- Guide Box -->
            <div class="guide-box">
                <div class="flex items-center gap-2 mb-4">
                    <span class="text-2xl">🎓</span>
                    <h2 class="text-lg font-bold text-gray-800">Which Mode Should I Choose?</h2>
                </div>

                <div class="guide-section guide-beginner">
                    <div class="text-4xl">👶</div>
                    <div class="flex-1">
                        <h3 class="font-bold text-blue-900 mb-1">📘 Normal Mode — For Beginners</h3>
                        <p class="text-sm text-blue-800 mb-2">
                            <strong>Best for:</strong> First-time learners, concept revision, focused topic practice
                        </p>
                        <div class="text-sm text-blue-700 space-y-1">
                            <p>✓ <strong>You control difficulty</strong> — Pick Easy, Moderate, Hard, etc.</p>
                            <p>✓ <strong>Fixed sequence</strong> — Questions in order, predictable</p>
                            <p>✓ <strong>Confidence building</strong> — Start easy, progress at your pace</p>
                            <p>✓ <strong>Perfect for chapter study</strong> — Cover concepts systematically</p>
                        </div>
                        <div class="mt-3 bg-blue-100 rounded-lg px-3 py-2 text-xs text-blue-900">
                            <strong>💡 Recommended if:</strong> You're new to a topic | Revising after class | Want predictable practice
                        </div>
                    </div>
                </div>

                <div class="guide-section guide-advanced">
                    <div class="text-4xl">🤖</div>
                    <div class="flex-1">
                        <h3 class="font-bold text-cyan-900 mb-1">🚀 Adaptive Mode — AI-Powered</h3>
                        <p class="text-sm text-cyan-800 mb-2">
                            <strong>Best for:</strong> Exam preparation, weak area discovery, personalized learning
                        </p>
                        <div class="text-sm text-cyan-700 space-y-1">
                            <p>✓ <strong>AI controls difficulty</strong> — Adjusts in real-time based on performance</p>
                            <p>✓ <strong>Smart sequencing</strong> — Harder when you're doing well, easier when struggling</p>
                            <p>✓ <strong>Optimal challenge</strong> — Keeps you in "flow zone" (not too easy, not too hard)</p>
                            <p>✓ <strong>Efficient learning</strong> — Identifies weak topics automatically</p>
                        </div>
                        <div class="mt-3 bg-cyan-100 rounded-lg px-3 py-2 text-xs text-cyan-900">
                            <strong>💡 Recommended if:</strong> Preparing for exam | Confident in basics | Want realistic challenge
                        </div>
                    </div>
                </div>
            </div>

            <!-- Test Type Cards -->
            <div class="flex items-center gap-3 mb-6">
                <div class="h-6 w-1 bg-cyan-500 rounded"></div>
                <h2 class="text-lg font-bold text-gray-800">Select Test Type</h2>
            </div>

            <div class="grid grid-cols-2 gap-6">

                <!-- Topic Wise -->
                <div class="test-card">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-3xl">🎯</span>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-800">Topic Wise Test</h3>
                            <p class="text-xs text-gray-500">Focused practice on specific topics</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        Select specific topics within a subject. Great for mastering individual concepts.
                    </p>
                    <div class="grid grid-cols-1 gap-2">
                    <button onclick="startTest('topic','normal')" class="start-btn btn-normal">
                        <div class="text-xs opacity-80 mb-1">📘 Normal Mode</div>
                        <div class="font-bold">You Pick Difficulty</div>
                    </button>
                    </div>
                </div>

                <!-- Chapter Wise -->
                <div class="test-card">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-3xl">📚</span>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-800">Chapter Wise Test</h3>
                            <p class="text-xs text-gray-500">All topics from selected chapters</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        Select one or more chapters. Perfect for chapter-end revision.
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="startTest('chapter','normal')" class="start-btn btn-normal">
                            <div class="text-xs opacity-80 mb-1">📘 Normal Mode</div>
                            <div class="font-bold">Fixed Difficulty</div>
                        </button>
                        <button onclick="startTest('chapter','adaptive')" class="start-btn btn-adaptive">
                            <div class="text-xs opacity-90 mb-1">🤖 Adaptive Mode</div>
                            <div class="font-bold">Smart Questions</div>
                        </button>
                    </div>
                </div>

                <!-- Subject Wise -->
                <div class="test-card">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-3xl">📖</span>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-800">Subject Wise Test</h3>
                            <p class="text-xs text-gray-500">Entire subject — all chapters</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        Complete subject coverage. Best for subject-level assessment.
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="startTest('subject','normal')" class="start-btn btn-normal">
                            <div class="text-xs opacity-80 mb-1">📘 Normal Mode</div>
                            <div class="font-bold">You Control</div>
                        </button>
                        <button onclick="startTest('subject','adaptive')" class="start-btn btn-adaptive">
                            <div class="text-xs opacity-90 mb-1">🤖 Adaptive Mode</div>
                            <div class="font-bold">AI Personalizes</div>
                        </button>
                    </div>
                </div>

                <!-- Full Mock -->
                <div class="test-card">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-3xl">🏆</span>
                        <div class="flex-1">
                            <h3 class="text-lg font-bold text-gray-800">Full Mock Test</h3>
                            <p class="text-xs text-gray-500">100 questions — all subjects</p>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        Complete DDCET simulation. Real exam environment.
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="startTest('full','normal')" class="start-btn btn-normal">
                            <div class="text-xs opacity-80 mb-1">📘 Normal Mode</div>
                            <div class="font-bold">Mixed Difficulty</div>
                        </button>
                        <button onclick="startTest('full','adaptive')" class="start-btn btn-adaptive">
                            <div class="text-xs opacity-90 mb-1">🤖 Adaptive Mode</div>
                            <div class="font-bold">Exam Realistic</div>
                        </button>
                    </div>
                </div>

            </div>

            <!-- Quick Comparison -->
            <div class="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-5">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-lg">⚡</span>
                    <h3 class="font-bold text-gray-800">Quick Comparison</h3>
                </div>
                <div class="grid grid-cols-2 gap-6 text-sm">
                    <div>
                        <div class="font-bold text-blue-900 mb-2">📘 Normal Mode</div>
                        <div class="space-y-1 text-gray-700">
                            <p>• You select: Easy, Moderate, Hard, etc.</p>
                            <p>• Questions in fixed order</p>
                            <p>• Time based on your selection</p>
                            <p>• Great for: Beginners, Revision</p>
                        </div>
                    </div>
                    <div>
                        <div class="font-bold text-cyan-900 mb-2">🤖 Adaptive Mode</div>
                        <div class="space-y-1 text-gray-700">
                            <p>• AI selects: Based on your performance</p>
                            <p>• Questions adapt difficulty live</p>
                            <p>• Time auto-calculated by engine</p>
                            <p>• Great for: Exam prep, Assessment</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function startTest(type, mode) {
    window.location.href = `test_setup.php?type=${type}&mode=${mode}`;
}
</script>
</body>
</html>