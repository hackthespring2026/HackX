<?php
// ============================================================
// DDCETPrepHub — app/models/AnalysisEngine.php
// Evidence-based Learning Diagnostics Engine
// Analyzes ONLY assessed questions — no syllabus assumptions
// ============================================================

class AnalysisEngine {

    // ── Performance Thresholds ───────────────────────────────
    const MASTERED = 75;   // ≥ 75% → Strong (Green)
    const AVERAGE  = 40;   // 40–74% → Average (Yellow)
                           // < 40%  → Weak (Red)

    // ── Heat Level Thresholds ────────────────────────────────
    const HEAT_MASTERED = 80;
    const HEAT_HOT      = 60;
    const HEAT_WARM     = 40;
    // < 40 → cold

    // ────────────────────────────────────────────────────────
    // MAIN ENTRY POINT
    // Called from submit_test → runs appropriate analysis
    // ────────────────────────────────────────────────────────
    public static function compute(array $questions, array $responses, array $statuses, string $testType, int $timeTakenSec): array {
        // Step 1: Evaluate each question
        $evaluated = self::evaluateQuestions($questions, $responses, $statuses, $timeTakenSec);

        // Step 2: Aggregate by topic, chapter, subject
        $topicStats   = self::aggregateByTopic($evaluated);
        $chapterStats = self::aggregateByChapter($evaluated);
        $subjectStats = self::aggregateBySubject($evaluated);
        $diffStats    = self::aggregateByDifficulty($evaluated);

        // Step 3: Overall stats
        $overall = self::computeOverall($evaluated, $timeTakenSec);

        // Step 4: Generate insights by test type
        $insights = self::generateInsights($topicStats, $chapterStats, $subjectStats, $diffStats, $overall, $testType);

        // Step 5: Generate improvement plan
        $plan = self::generateImprovementPlan($topicStats, $chapterStats, $overall, $testType);

        // Step 6: Exam readiness (for full mock)
        $readiness = self::computeExamReadiness($overall['accuracy']);

        // Step 7: Priority index for each topic
        $priorities = self::computePriorityIndex($topicStats);

        return [
            'test_type'     => $testType,
            'overall'       => $overall,
            'topic_stats'   => $topicStats,
            'chapter_stats' => $chapterStats,
            'subject_stats' => $subjectStats,
            'diff_stats'    => $diffStats,
            'insights'      => $insights,
            'plan'          => $plan,
            'readiness'     => $readiness,
            'priorities'    => $priorities,
            'evaluated'     => $evaluated,
        ];
    }

    // ────────────────────────────────────────────────────────
    // STEP 1: Evaluate every question
    // ────────────────────────────────────────────────────────
    private static function evaluateQuestions(array $questions, array $responses, array $statuses, int $totalSec): array {
        $result     = [];
        $perQTime   = count($questions) > 0 ? round($totalSec / count($questions), 1) : 0;

        foreach ($questions as $q) {
            $qid      = $q['id'];
            $selected = $responses[$qid] ?? '';
            $status   = $statuses[$qid]  ?? 'not_visited';
            $isCorrect= ($selected !== '' && $selected === $q['correct_answer']);
            $attempted= ($selected !== '' && !in_array($status, ['skipped','not_visited']));

            $result[] = [
                'id'           => $qid,
                'subject_id'   => $q['subject_id']  ?? 0,
                'chapter_id'   => $q['chapter_id']  ?? 0,
                'topic_id'     => $q['topic_id']    ?? 0,
                'difficulty'   => $q['difficulty']  ?? 'easy',
                'selected'     => $selected,
                'correct_ans'  => $q['correct_answer'],
                'status'       => $status,
                'attempted'    => $attempted,
                'is_correct'   => $isCorrect,
                'time_sec'     => $perQTime, // avg per question (improve later with per-q timing)
                'question_text'=> $q['question_text'] ?? '',
                'explanation'  => $q['explanation']  ?? '',
                'option_a'     => $q['option_a'] ?? '',
                'option_b'     => $q['option_b'] ?? '',
                'option_c'     => $q['option_c'] ?? '',
                'option_d'     => $q['option_d'] ?? '',
            ];
        }
        return $result;
    }

    // ────────────────────────────────────────────────────────
    // STEP 2A: Aggregate by Topic
    // ────────────────────────────────────────────────────────
    private static function aggregateByTopic(array $evaluated): array {
        $topics = [];
        foreach ($evaluated as $q) {
            $tid = $q['topic_id'];
            if (!isset($topics[$tid])) {
                $topics[$tid] = [
                    'topic_id'   => $tid,
                    'chapter_id' => $q['chapter_id'],
                    'subject_id' => $q['subject_id'],
                    'total'      => 0,
                    'attempted'  => 0,
                    'correct'    => 0,
                    'wrong'      => 0,
                    'skipped'    => 0,
                ];
            }
            $topics[$tid]['total']++;
            if ($q['attempted']) {
                $topics[$tid]['attempted']++;
                if ($q['is_correct']) $topics[$tid]['correct']++;
                else                  $topics[$tid]['wrong']++;
            } else {
                $topics[$tid]['skipped']++;
            }
        }
        // Compute accuracy + heat + insight
        foreach ($topics as &$t) {
            $t['accuracy']  = $t['attempted'] > 0 ? round(($t['correct'] / $t['attempted']) * 100, 1) : 0;
            $t['heat']      = self::getHeatLevel($t['accuracy']);
            $t['color']     = self::getColor($t['accuracy']);
            $t['label']     = self::getLabel($t['accuracy']);
            $t['insight']   = self::getTopicInsight($t['heat']);
            $t['priority']  = round((1 - $t['accuracy']/100) * $t['attempted'], 2);
        }
        return $topics;
    }

    // ────────────────────────────────────────────────────────
    // STEP 2B: Aggregate by Chapter
    // ────────────────────────────────────────────────────────
    private static function aggregateByChapter(array $evaluated): array {
        $chapters = [];
        foreach ($evaluated as $q) {
            $cid = $q['chapter_id'];
            if (!isset($chapters[$cid])) {
                $chapters[$cid] = [
                    'chapter_id' => $cid,
                    'subject_id' => $q['subject_id'],
                    'total'      => 0,
                    'attempted'  => 0,
                    'correct'    => 0,
                    'wrong'      => 0,
                    'skipped'    => 0,
                ];
            }
            $chapters[$cid]['total']++;
            if ($q['attempted']) {
                $chapters[$cid]['attempted']++;
                if ($q['is_correct']) $chapters[$cid]['correct']++;
                else                  $chapters[$cid]['wrong']++;
            } else {
                $chapters[$cid]['skipped']++;
            }
        }
        foreach ($chapters as &$c) {
            $c['accuracy'] = $c['attempted'] > 0 ? round(($c['correct'] / $c['attempted']) * 100, 1) : 0;
            $c['heat']     = self::getHeatLevel($c['accuracy']);
            $c['color']    = self::getColor($c['accuracy']);
            $c['label']    = self::getLabel($c['accuracy']);
            $c['insight']  = self::getChapterInsight($c['accuracy']);
        }
        // Sort worst first
        uasort($chapters, fn($a,$b) => $a['accuracy'] <=> $b['accuracy']);
        return $chapters;
    }

    // ────────────────────────────────────────────────────────
    // STEP 2C: Aggregate by Subject
    // ────────────────────────────────────────────────────────
    private static function aggregateBySubject(array $evaluated): array {
        $subjects = [];
        foreach ($evaluated as $q) {
            $sid = $q['subject_id'];
            if (!isset($subjects[$sid])) {
                $subjects[$sid] = [
                    'subject_id' => $sid,
                    'total'      => 0,
                    'attempted'  => 0,
                    'correct'    => 0,
                    'wrong'      => 0,
                    'skipped'    => 0,
                ];
            }
            $subjects[$sid]['total']++;
            if ($q['attempted']) {
                $subjects[$sid]['attempted']++;
                if ($q['is_correct']) $subjects[$sid]['correct']++;
                else                  $subjects[$sid]['wrong']++;
            } else {
                $subjects[$sid]['skipped']++;
            }
        }
        foreach ($subjects as &$s) {
            $s['accuracy'] = $s['attempted'] > 0 ? round(($s['correct'] / $s['attempted']) * 100, 1) : 0;
            $s['color']    = self::getColor($s['accuracy']);
            $s['label']    = self::getLabel($s['accuracy']);
        }
        return $subjects;
    }

    // ────────────────────────────────────────────────────────
    // STEP 2D: Aggregate by Difficulty
    // ────────────────────────────────────────────────────────
    private static function aggregateByDifficulty(array $evaluated): array {
        $diffs = ['easy'=>[], 'moderate'=>[], 'hard'=>[], 'advanced'=>[], 'tricky'=>[]];
        foreach ($evaluated as $q) {
            $d = $q['difficulty'];
            if (!isset($diffs[$d])) continue;
            $diffs[$d][] = $q;
        }
        $result = [];
        foreach ($diffs as $diff => $qs) {
            if (empty($qs)) continue;
            $attempted = array_filter($qs, fn($q) => $q['attempted']);
            $correct   = array_filter($qs, fn($q) => $q['is_correct']);
            $total     = count($qs);
            $att       = count($attempted);
            $cor       = count($correct);
            $acc       = $att > 0 ? round(($cor / $att) * 100, 1) : 0;
            $result[$diff] = [
                'difficulty' => $diff,
                'total'      => $total,
                'attempted'  => $att,
                'correct'    => $cor,
                'accuracy'   => $acc,
                'color'      => self::getColor($acc),
                'label'      => self::getLabel($acc),
                'insight'    => self::getDiffInsight($diff, $acc),
            ];
        }
        return $result;
    }

    // ────────────────────────────────────────────────────────
    // STEP 3: Overall stats
    // ────────────────────────────────────────────────────────
    private static function computeOverall(array $evaluated, int $timeSec): array {
        $total    = count($evaluated);
        $attempted= count(array_filter($evaluated, fn($q) => $q['attempted']));
        $correct  = count(array_filter($evaluated, fn($q) => $q['is_correct']));
        $wrong    = $attempted - $correct;
        $skipped  = $total - $attempted;
        $accuracy = $attempted > 0 ? round(($correct / $attempted) * 100, 1) : 0;
        $score    = $correct * 2;
        $maxScore = $total  * 2;
        $attemptRate = $total > 0 ? round(($attempted / $total) * 100, 1) : 0;
        $avgTimeSec  = $attempted > 0 ? round($timeSec / $attempted, 1) : 0;

        // Overconfidence: answered quickly but wrong
        // (Using simple heuristic: wrong > 30% of attempted)
        $overconfident = ($attempted > 0 && ($wrong / $attempted) > 0.3 && $avgTimeSec < 45);

        // Mastery level
        $mastery = match(true) {
            $accuracy >= 80 => 'Advanced',
            $accuracy >= 60 => 'Proficient',
            $accuracy >= 40 => 'Developing',
            default         => 'Beginner',
        };

        return [
            'total'         => $total,
            'attempted'     => $attempted,
            'correct'       => $correct,
            'wrong'         => $wrong,
            'skipped'       => $skipped,
            'accuracy'      => $accuracy,
            'score'         => $score,
            'max_score'     => $maxScore,
            'attempt_rate'  => $attemptRate,
            'time_sec'      => $timeSec,
            'time_str'      => sprintf('%02d:%02d', intdiv($timeSec, 60), $timeSec % 60),
            'avg_time_sec'  => $avgTimeSec,
            'overconfident' => $overconfident,
            'mastery'       => $mastery,
            'color'         => self::getColor($accuracy),
            'label'         => self::getLabel($accuracy),
        ];
    }

    // ────────────────────────────────────────────────────────
    // STEP 4: Insights by test type
    // ────────────────────────────────────────────────────────
    private static function generateInsights(array $topicStats, array $chapterStats, array $subjectStats, array $diffStats, array $overall, string $testType): array {
        $insights = [];

        // Overall performance insight
        if ($overall['accuracy'] >= self::MASTERED) {
            $insights[] = ['type'=>'success', 'icon'=>'🏆', 'text'=>"Excellent performance! You scored {$overall['accuracy']}% accuracy across {$overall['attempted']} questions. You demonstrate strong conceptual mastery."];
        } elseif ($overall['accuracy'] >= self::AVERAGE) {
            $insights[] = ['type'=>'warning', 'icon'=>'📈', 'text'=>"Moderate performance at {$overall['accuracy']}% accuracy. You have foundational understanding but need targeted practice to improve consistency."];
        } else {
            $insights[] = ['type'=>'danger', 'icon'=>'📚', 'text'=>"Accuracy at {$overall['accuracy']}% indicates conceptual gaps. Focus on theory revision before attempting more practice tests."];
        }

        // Attempt rate insight
        if ($overall['attempt_rate'] < 70) {
            $insights[] = ['type'=>'warning', 'icon'=>'⏭️', 'text'=>"You attempted only {$overall['attempt_rate']}% of questions ({$overall['attempted']}/{$overall['total']}). Low attempt rate may indicate time management issues or knowledge gaps."];
        }

        // Overconfidence detection
        if ($overall['overconfident']) {
            $insights[] = ['type'=>'danger', 'icon'=>'⚡', 'text'=>"Overconfidence pattern detected — you answered quickly but made several mistakes. Slow down and verify calculations before marking your answer."];
        }

        // Difficulty pattern insights
        if (isset($diffStats['easy']) && $diffStats['easy']['accuracy'] < 60) {
            $insights[] = ['type'=>'danger', 'icon'=>'🚨', 'text'=>"Critical: Low accuracy on Easy questions ({$diffStats['easy']['accuracy']}%). This suggests fundamental concept gaps that must be addressed immediately."];
        }
        if (isset($diffStats['hard']) && $diffStats['hard']['accuracy'] > 60) {
            $insights[] = ['type'=>'success', 'icon'=>'🌟', 'text'=>"Impressive! You scored {$diffStats['hard']['accuracy']}% on Hard questions — significantly above average. You are ready for advanced content."];
        }

        // Topic-specific insights
        $weakTopics = array_filter($topicStats, fn($t) => $t['accuracy'] < self::AVERAGE);
        $strongTopics = array_filter($topicStats, fn($t) => $t['accuracy'] >= self::MASTERED);

        if (count($weakTopics) > 0 && count($topicStats) > 0) {
            $weakPct = round(count($weakTopics) / count($topicStats) * 100);
            $insights[] = ['type'=>'danger', 'icon'=>'🎯', 'text'=>"{$weakPct}% of your topics are in the weak zone (accuracy < 40%). Prioritize these for immediate revision — they are your biggest score improvement opportunity."];
        }
        if (count($strongTopics) > 0) {
            $insights[] = ['type'=>'success', 'icon'=>'✅', 'text'=>count($strongTopics)." topic(s) mastered with ≥75% accuracy. Maintain these with periodic revision and try harder problems."];
        }

        // Chapter-specific (chapter + subject + full mock)
        if (in_array($testType, ['chapter', 'subject', 'full'])) {
            $weakChapters = array_filter($chapterStats, fn($c) => $c['accuracy'] < 50);
            if (count($weakChapters) > 0) {
                $wc = reset($weakChapters);
                $insights[] = ['type'=>'danger', 'icon'=>'📖', 'text'=>"Most urgent: Chapter with " . count($weakChapters) . " chapter(s) below 50% accuracy. Chapters needing immediate attention are your highest-priority study areas."];
            }
        }

        // Speed vs accuracy
        if ($overall['avg_time_sec'] > 0) {
            if ($overall['avg_time_sec'] > 120) {
                $insights[] = ['type'=>'warning', 'icon'=>'🐢', 'text'=>"Average time per question: {$overall['avg_time_sec']}s — too slow for exam conditions. Practice timed sessions to improve speed."];
            } elseif ($overall['avg_time_sec'] < 20 && $overall['accuracy'] < 50) {
                $insights[] = ['type'=>'danger', 'icon'=>'🎲', 'text'=>"Very fast responses with low accuracy ({$overall['accuracy']}%) suggests guessing behavior. Read questions carefully before answering."];
            }
        }

        return $insights;
    }

    // ────────────────────────────────────────────────────────
    // STEP 5: Improvement Plan (3 actionable steps)
    // ────────────────────────────────────────────────────────
    private static function generateImprovementPlan(array $topicStats, array $chapterStats, array $overall, string $testType): array {
        $plan = [];

        // Step 1: Weakest topic/chapter
        $weakTopics = array_filter($topicStats, fn($t) => $t['heat'] === 'cold');
        if (!empty($weakTopics)) {
            $plan[] = [
                'step'  => 1,
                'icon'  => '📚',
                'title' => 'Revise Weak Concepts',
                'desc'  => count($weakTopics) . ' topic(s) scored below 40%. Revisit the theory, watch concept explanations, and solve basic problems step-by-step before attempting practice again.',
                'color' => '#dc2626',
            ];
        } else {
            $plan[] = [
                'step'  => 1,
                'icon'  => '🔁',
                'title' => 'Reinforce Core Topics',
                'desc'  => 'No critically weak topics detected. Continue regular revision to maintain your knowledge base, especially for topics you scored between 40–70%.',
                'color' => '#d97706',
            ];
        }

        // Step 2: Medium difficulty practice
        $plan[] = [
            'step'  => 2,
            'icon'  => '🎯',
            'title' => 'Practice Mixed Difficulty',
            'desc'  => $overall['accuracy'] < 60
                ? 'After theory revision, solve Moderate-level problems in your weak areas. Focus on understanding why each wrong answer was incorrect.'
                : 'You are ready for Hard and Advanced level problems. Challenge yourself with complex application-based questions to push your score higher.',
            'color' => '#2563eb',
        ];

        // Step 3: Speed/consistency
        $plan[] = [
            'step'  => 3,
            'icon'  => '⏱️',
            'title' => $overall['avg_time_sec'] > 90 ? 'Improve Speed' : 'Attempt Full Mock',
            'desc'  => $overall['avg_time_sec'] > 90
                ? 'Your average time per question is high. Practice solving known topics under time pressure. Aim for under 90 seconds per moderate question.'
                : 'Your speed is good! Take a full mock test to simulate real exam conditions and identify any remaining weak areas before your exam.',
            'color' => '#7c3aed',
        ];

        return $plan;
    }

    // ────────────────────────────────────────────────────────
    // STEP 6: Exam Readiness
    // ────────────────────────────────────────────────────────
    private static function computeExamReadiness(float $accuracy): array {
        if ($accuracy >= 80) return [
            'level' => 'Exam Ready ✅',
            'desc'  => 'Your performance indicates strong exam readiness. Focus on maintaining accuracy under time pressure.',
            'color' => '#16a34a', 'pct' => 100,
        ];
        if ($accuracy >= 60) return [
            'level' => 'Nearly Ready 🟡',
            'desc'  => 'Good foundation! Address 2–3 weak topic areas and you will be fully exam-ready.',
            'color' => '#d97706', 'pct' => 70,
        ];
        if ($accuracy >= 40) return [
            'level' => 'Needs Improvement 📈',
            'desc'  => 'Systematic revision of weak chapters needed. Plan 2–3 focused study sessions per week.',
            'color' => '#f97316', 'pct' => 40,
        ];
        return [
            'level' => 'Not Ready Yet 🔴',
            'desc'  => 'Significant conceptual gaps detected. Prioritize theory learning and basic problem solving.',
            'color' => '#dc2626', 'pct' => 15,
        ];
    }

    // ────────────────────────────────────────────────────────
    // STEP 7: Priority Index (Learning Priority Order)
    // priority = (1 - accuracy) × attempts
    // Highest = study first
    // ────────────────────────────────────────────────────────
    private static function computePriorityIndex(array $topicStats): array {
        $priorities = [];
        foreach ($topicStats as $t) {
            $pri = round((1 - $t['accuracy']/100) * max($t['attempted'], 1), 3);
            $priorities[$t['topic_id']] = $pri;
        }
        arsort($priorities);
        return $priorities;
    }

    // ────────────────────────────────────────────────────────
    // DB OPERATIONS — Save to DB after test
    // ────────────────────────────────────────────────────────
    public static function saveToDB(mysqli $conn, int $studentId, array $analysis, array $testMeta): void {
        try {
            self::savePracticeSession($conn, $studentId, $analysis, $testMeta);
            self::updateTopicHeatmap($conn, $studentId, $analysis);
            self::updateStudentProgress($conn, $studentId, $analysis, $testMeta);
        } catch (Exception $e) {
            error_log('AnalysisEngine::saveToDB error: ' . $e->getMessage());
        }
    }

    private static function savePracticeSession(mysqli $conn, int $studentId, array $analysis, array $testMeta): void {
        $typeMap = ['topic'=>'chapter_wise','chapter'=>'chapter_wise','subject'=>'subject_wise','full'=>'full_mock'];
        $type    = $typeMap[$testMeta['test_type']] ?? 'subject_wise';
        $o       = $analysis['overall'];

        $stmt = $conn->prepare(
            "INSERT INTO practice_sessions
             (student_id, test_type, total_questions, correct_count, wrong_count, skipped_count,
              time_limit_minutes, time_taken_minutes, session_score, status, session_start, session_end)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW() - INTERVAL ? SECOND, NOW())"
        );
        $timeTakenMin  = round($o['time_sec'] / 60, 2);
        $sessionScore  = $o['accuracy'];
        $timeLimitMin  = $testMeta['time_minutes'] ?? 30;

        $stmt->bind_param('isiiiididii',
            $studentId, $type,
            $o['total'], $o['correct'], $o['wrong'], $o['skipped'],
            $timeLimitMin, $timeTakenMin, $sessionScore,
            $o['time_sec']
        );
        $stmt->execute();
    }

    private static function updateTopicHeatmap(mysqli $conn, int $studentId, array $analysis): void {
        foreach ($analysis['topic_stats'] as $t) {
            $accuracy = $t['accuracy'];
            $heat     = self::getHeatLevel($accuracy);

            $stmt = $conn->prepare(
                "INSERT INTO student_topic_heatmap
                 (student_id, subject_id, chapter_id, topic_id, total_attempts, correct_attempts, wrong_attempts, accuracy_percent, heat_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 total_attempts   = total_attempts   + VALUES(total_attempts),
                 correct_attempts = correct_attempts + VALUES(correct_attempts),
                 wrong_attempts   = wrong_attempts   + VALUES(wrong_attempts),
                 accuracy_percent = correct_attempts / total_attempts * 100,
                 heat_level       = VALUES(heat_level)"
            );
            $stmt->bind_param('iiiiiiids',
                $studentId, $t['subject_id'], $t['chapter_id'], $t['topic_id'],
                $t['total'], $t['correct'], $t['wrong'],
                $accuracy, $heat
            );
            $stmt->execute();
        }
    }

    private static function updateStudentProgress(mysqli $conn, int $studentId, array $analysis, array $testMeta): void {
        $o = $analysis['overall'];
        foreach ($analysis['subject_stats'] as $subjectId => $s) {
            $stmt = $conn->prepare(
                "INSERT INTO student_progress
                 (student_id, subject_id, total_sessions, total_questions_attempted, total_correct, total_wrong, overall_accuracy, last_session_date)
                 VALUES (?, ?, 1, ?, ?, ?, ?, CURDATE())
                 ON DUPLICATE KEY UPDATE
                 total_sessions            = total_sessions + 1,
                 total_questions_attempted = total_questions_attempted + VALUES(total_questions_attempted),
                 total_correct             = total_correct + VALUES(total_correct),
                 total_wrong               = total_wrong   + VALUES(total_wrong),
                 overall_accuracy          = total_correct / total_questions_attempted * 100,
                 last_session_date         = CURDATE()"
            );
            $stmt->bind_param('iiiid',
                $studentId, $subjectId,
                $s['attempted'], $s['correct'],
                $s['accuracy']
            );
            $stmt->execute();
        }
    }

    // ────────────────────────────────────────────────────────
    // LOAD TOPIC/CHAPTER NAMES from DB
    // ────────────────────────────────────────────────────────
    public static function loadNames(mysqli $conn, array $analysis): array {
        $topicIds   = array_keys($analysis['topic_stats']);
        $chapterIds = array_keys($analysis['chapter_stats']);
        $subjectIds = array_keys($analysis['subject_stats']);

        $names = ['topics'=>[], 'chapters'=>[], 'subjects'=>[]];

        if ($topicIds) {
            $ph   = implode(',', array_map('intval', $topicIds));
            $rows = $conn->query("SELECT id, name FROM topics WHERE id IN ($ph)");
            while ($r = $rows->fetch_assoc()) $names['topics'][$r['id']] = $r['name'];
        }
        if ($chapterIds) {
            $ph   = implode(',', array_map('intval', $chapterIds));
            $rows = $conn->query("SELECT id, name FROM chapters WHERE id IN ($ph)");
            while ($r = $rows->fetch_assoc()) $names['chapters'][$r['id']] = $r['name'];
        }
        if ($subjectIds) {
            $ph   = implode(',', array_map('intval', $subjectIds));
            $rows = $conn->query("SELECT id, name FROM subjects WHERE id IN ($ph)");
            while ($r = $rows->fetch_assoc()) $names['subjects'][$r['id']] = $r['name'];
        }
        return $names;
    }

    // ────────────────────────────────────────────────────────
    // HELPERS
    // ────────────────────────────────────────────────────────
    public static function getHeatLevel(float $acc): string {
        if ($acc >= self::HEAT_MASTERED) return 'mastered';
        if ($acc >= self::HEAT_HOT)      return 'hot';
        if ($acc >= self::HEAT_WARM)     return 'warm';
        return 'cold';
    }

    public static function getColor(float $acc): string {
        if ($acc >= self::MASTERED) return '#16a34a'; // Green
        if ($acc >= self::AVERAGE)  return '#d97706'; // Yellow
        return '#dc2626';                              // Red
    }

    public static function getLabel(float $acc): string {
        if ($acc >= self::MASTERED) return 'Strong';
        if ($acc >= self::AVERAGE)  return 'Average';
        return 'Weak';
    }

    private static function getTopicInsight(string $heat): string {
        return match($heat) {
            'mastered' => '🟢 Excellent command. Try advanced problems and maintain with periodic revision.',
            'hot'      => '🟡 Good understanding. Practice mixed difficulty to push towards mastery.',
            'warm'     => '🟠 Basic understanding present but inconsistent. Solve more varied problems.',
            default    => '🔴 Concept not clear. Revise fundamentals and solve basic examples first.',
        };
    }

    private static function getChapterInsight(float $acc): string {
        if ($acc >= 85) return 'Your conceptual clarity in this chapter is strong. Continue with advanced practice problems.';
        if ($acc >= 70) return 'Good command of this chapter. Focus on application-based and tricky problems.';
        if ($acc >= 50) return 'You understand fundamentals but struggle with application. Solve more mixed problems.';
        return 'This chapter requires serious conceptual revision. Revisit theory and basic worked examples.';
    }

    private static function getDiffInsight(string $diff, float $acc): string {
        if ($acc >= 75) return "Strong at {$diff} level. Ready for higher complexity.";
        if ($acc >= 40) return "Moderate performance on {$diff} questions. More practice needed.";
        return "Weak on {$diff} questions. Focus on " . match($diff) {
            'easy'     => 'basic concept clarity and formula recall.',
            'moderate' => 'application of concepts to standard problems.',
            'hard'     => 'multi-step problem solving strategies.',
            'advanced' => 'integrated concept problems and edge cases.',
            'tricky'   => 'reading questions carefully and eliminating wrong options.',
            default    => 'concept revision.',
        };
    }
}