<?php
// ============================================================
// DDCETPrepHub — app/controllers/StudentController.php
// Handles:
//   AJAX: get_chapters, get_all_topics_by_subject, get_topics
//   POST: setup_test → loads questions into session → redirect to test_window
// ============================================================

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../models/Question.php';
session_start();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$conn   = getDBConnection();
$model  = new Question();

switch ($action) {

    // --------------------------------------------------------
    // AJAX: Get chapters by subject
    // --------------------------------------------------------
    case 'get_chapters':
        header('Content-Type: application/json');
        $sid = intval($_GET['subject_id'] ?? 0);
        if (!$sid) { echo json_encode(['success'=>false]); exit; }
        $chapters = $model->getChaptersBySubject($sid);
        echo json_encode(['success'=>true, 'data'=>$chapters]);
        exit;

    // --------------------------------------------------------
    // AJAX: Get ALL topics of a subject (grouped by chapter)
    // Used in topic-wise setup — student picks topics
    // --------------------------------------------------------
    case 'get_all_topics_by_subject':
        header('Content-Type: application/json');
        $sid = intval($_GET['subject_id'] ?? 0);
        if (!$sid) { echo json_encode(['success'=>false]); exit; }

        $stmt = $conn->prepare(
            "SELECT t.id, t.name, c.name AS chapter_name, c.id AS chapter_id
             FROM topics t
             JOIN chapters c ON t.chapter_id = c.id
             WHERE c.subject_id = ?
             ORDER BY c.name, t.name"
        );
        $stmt->bind_param('i', $sid);
        $stmt->execute();
        $topics = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['success'=>true, 'data'=>$topics]);
        exit;

    // --------------------------------------------------------
    // AJAX: Get topics by multiple chapter IDs (chapter-wise setup)
    // --------------------------------------------------------
    case 'get_topics':
        header('Content-Type: application/json');
        $chapter_ids = isset($_GET['chapter_ids']) ? array_map('intval', (array)$_GET['chapter_ids']) : [];
        if (empty($chapter_ids)) { echo json_encode(['success'=>false]); exit; }
        $topics = $model->getTopicsByChapters($chapter_ids);
        echo json_encode(['success'=>true, 'data'=>$topics]);
        exit;

    // --------------------------------------------------------
    // POST: Setup test — fetch questions, store in session
    // --------------------------------------------------------
    case 'setup_test':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../views/student/dashboard.php'); exit;
        }

        $test_type    = $_POST['test_type'] ?? 'topic';
        $subject_id   = intval($_POST['subject_id'] ?? 0);
        $chapter_ids  = isset($_POST['chapter_ids'])  ? array_map('intval', (array)$_POST['chapter_ids'])  : [];
        $topic_ids    = isset($_POST['topic_ids'])    ? array_map('intval', (array)$_POST['topic_ids'])    : [];
        $difficulties = isset($_POST['difficulties']) ? (array)$_POST['difficulties'] : [];
        $num_q        = intval($_POST['num_questions'] ?? 25);
        $time_min     = intval($_POST['time_minutes']  ?? 30);

        // Allowed difficulties
        $allowed_diff = ['easy','moderate','hard','advanced','tricky'];
        $difficulties = array_filter($difficulties, fn($d) => in_array($d, $allowed_diff));

        // ── Fetch questions based on test type ──────────────
        $questions = [];

        if ($test_type === 'full') {
            // Full mock: 100 questions from ALL subjects, balanced 20/subject
            $questions = fetchFullMockQuestions($conn, 100);

        } elseif ($test_type === 'subject') {
            // Subject wise: all topics of subject
            if (!$subject_id || empty($difficulties)) {
                $_SESSION['test_error'] = 'Missing subject or difficulty.';
                header('Location: ../views/student/test_setup.php?type=subject'); exit;
            }
            $topic_ids = getTopicIdsBySubject($conn, $subject_id);
            $questions = fetchQuestions($conn, $topic_ids, $difficulties, $num_q);

        } elseif ($test_type === 'chapter') {
            // Chapter wise: all topics of selected chapters
            if (empty($chapter_ids) || empty($difficulties)) {
                $_SESSION['test_error'] = 'Missing chapters or difficulty.';
                header('Location: ../views/student/test_setup.php?type=chapter'); exit;
            }
            $topic_ids = getTopicIdsByChapters($conn, $chapter_ids);
            $questions = fetchQuestions($conn, $topic_ids, $difficulties, $num_q);

        } elseif ($test_type === 'topic') {
            // Topic wise: selected topics only
            if (empty($topic_ids) || empty($difficulties)) {
                $_SESSION['test_error'] = 'Missing topics or difficulty.';
                header('Location: ../views/student/test_setup.php?type=topic'); exit;
            }
            $questions = fetchQuestions($conn, $topic_ids, $difficulties, $num_q);
        }

        if (empty($questions)) {
            $_SESSION['test_error'] = 'No questions found for your selection. Try different topics or difficulty.';
            header("Location: ../views/student/test_setup.php?type={$test_type}"); exit;
        }

        // Store test in session
        $_SESSION['active_test'] = [
            'test_type'    => $test_type,
            'subject_id'   => $subject_id,
            'total_q'      => count($questions),
            'total_marks'  => count($questions) * 2,
            'time_minutes' => $time_min,
            'difficulties' => implode(', ', $difficulties),
            'questions'    => $questions,
            'start_time'   => time(),
            'responses'    => [], // question_id => selected_answer
            'statuses'     => [], // question_id => 'answered'|'skipped'|'review'|'not_visited'
        ];

        header('Location: ../views/student/test_window.php');
        exit;

    // --------------------------------------------------------
    // POST: Cancel test — student went back from overlay
    // Clears session completely, no record saved
    // --------------------------------------------------------
    case 'cancel_test':
        header('Content-Type: application/json');
        unset($_SESSION['active_test']);
        echo json_encode(['success' => true]);
        exit;

    // --------------------------------------------------------
    // AJAX POST: Auto-save responses + statuses to session
    // Called every 30s + on every answer action
    // --------------------------------------------------------
    case 'autosave_test':
        header('Content-Type: application/json');
        if (empty($_SESSION['active_test'])) {
            echo json_encode(['success' => false, 'message' => 'No active test']);
            exit;
        }
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            exit;
        }
        // Save responses, statuses, current_index into session
        $_SESSION['active_test']['responses']         = $body['responses']        ?? [];
        $_SESSION['active_test']['statuses']          = $body['statuses']         ?? [];
        $_SESSION['active_test']['current_index']     = intval($body['current_index'] ?? 0);
        $_SESSION['active_test']['question_sequence'] = $body['question_sequence'] ?? [];

        echo json_encode(['success' => true]);
        exit;
    case 'submit_test':
        if (empty($_SESSION['active_test'])) {
            header('Location: ../views/student/dashboard.php'); exit;
        }
        require_once __DIR__ . '/../models/AnalysisEngine.php';

        $test      = $_SESSION['active_test'];
        // Use saved question_sequence (adaptive order) if available, else original questions
        $questions = !empty($test['question_sequence']) ? $test['question_sequence'] : $test['questions'];
        $responses = $_POST['responses'] ?? [];
        $statuses  = $_POST['statuses']  ?? [];
        $timeTaken = time() - $test['start_time'];

        // ── Run Analysis Engine ──────────────────────────────
        $analysis = AnalysisEngine::compute(
            $questions, $responses, $statuses,
            $test['test_type'], $timeTaken
        );

        // ── Save to DB (if student is logged in) ─────────────
        $studentId = $_SESSION['student_id'] ?? 0;
        if ($studentId > 0) {
            AnalysisEngine::saveToDB($conn, $studentId, $analysis, $test);
        }

        // ── Load topic/chapter/subject names ─────────────────
        $names = AnalysisEngine::loadNames($conn, $analysis);

        // ── Store full result in session ─────────────────────
        $_SESSION['test_result'] = [
            'test_type'          => $test['test_type'],
            'questions'          => $questions,
            'responses'          => $responses,
            'statuses'           => $statuses,
            'time_taken_seconds' => $timeTaken,
            'time_minutes'       => $test['time_minutes'],
            'analysis'           => $analysis,
            'names'              => $names,
        ];

        unset($_SESSION['active_test']);
        header('Location: ../views/student/test_result.php');
        exit;

    default:
        header('Location: ../views/student/dashboard.php');
        exit;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function fetchQuestions($conn, $topic_ids, $difficulties, $limit) {
    if (empty($topic_ids) || empty($difficulties) || $limit <= 0) return [];

    $topic_ids    = array_map('intval', $topic_ids);
    $limit        = min(intval($limit), 100);
    $tPH          = implode(',', array_fill(0, count($topic_ids), '?'));
    $dPH          = implode(',', array_fill(0, count($difficulties), '?'));
    $types        = str_repeat('i', count($topic_ids)) . str_repeat('s', count($difficulties)) . 'i';
    $params       = array_merge($topic_ids, $difficulties, [$limit]);

    $stmt = $conn->prepare(
        "SELECT id, question_text, option_a, option_b, option_c, option_d,
                correct_answer, difficulty, marks, explanation, topic_id, chapter_id, subject_id
         FROM questions
         WHERE topic_id IN ($tPH) AND difficulty IN ($dPH)
         ORDER BY subject_id, chapter_id, topic_id, difficulty, id
         LIMIT ?"
    );
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function fetchFullMockQuestions($conn, $total = 100) {
    // 20 questions per subject, all difficulties, balanced
    $stmt = $conn->prepare(
        "SELECT id, question_text, option_a, option_b, option_c, option_d,
                correct_answer, difficulty, marks, explanation, topic_id, chapter_id, subject_id
         FROM (
             SELECT *, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY RAND()) as rn
             FROM questions
         ) ranked
         WHERE rn <= 20
         ORDER BY subject_id, RAND()
         LIMIT ?"
    );
    $stmt->bind_param('i', $total);
    $stmt->execute();
    $questions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Fallback if ROW_NUMBER() not supported (MySQL < 8.0 / MariaDB)
    if (empty($questions)) {
        $result = $conn->query(
            "SELECT id, question_text, option_a, option_b, option_c, option_d,
                    correct_answer, difficulty, marks, explanation, topic_id, chapter_id, subject_id
             FROM questions ORDER BY subject_id, RAND() LIMIT $total"
        );
        $questions = $result->fetch_all(MYSQLI_ASSOC);
    }
    return $questions;
}

function getTopicIdsBySubject($conn, $subject_id) {
    $subject_id = intval($subject_id);
    $result = $conn->query(
        "SELECT t.id FROM topics t
         JOIN chapters c ON t.chapter_id = c.id
         WHERE c.subject_id = $subject_id"
    );
    return array_column($result->fetch_all(MYSQLI_ASSOC), 'id');
}

function getTopicIdsByChapters($conn, $chapter_ids) {
    $chapter_ids  = array_map('intval', $chapter_ids);
    $ph           = implode(',', $chapter_ids);
    $result       = $conn->query("SELECT id FROM topics WHERE chapter_id IN ($ph)");
    return array_column($result->fetch_all(MYSQLI_ASSOC), 'id');
}