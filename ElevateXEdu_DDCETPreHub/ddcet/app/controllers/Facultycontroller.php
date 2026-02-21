<?php
// ============================================================
// DDCETPrepHub — app/controllers/FacultyController.php
// UPDATED: Multi-chapter support
// Actions:
//   get_chapters      → chapters by subject (AJAX)
//   get_topics        → topics by MULTIPLE chapters (AJAX)
//   generate_paper    → question paper (POST)
//   generate_answer_key → answer key (POST)
// ============================================================

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../models/Question.php';
session_start();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$model  = new Question();

switch ($action) {

    // --------------------------------------------------------
    // AJAX: Subject → Chapters
    // GET: ?action=get_chapters&subject_id=1
    // --------------------------------------------------------
    case 'get_chapters':
        header('Content-Type: application/json');
        $subject_id = intval($_GET['subject_id'] ?? 0);
        if ($subject_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid subject']);
            exit;
        }
        $chapters = $model->getChaptersBySubject($subject_id);
        echo json_encode(['success' => true, 'data' => $chapters]);
        exit;

    // --------------------------------------------------------
    // AJAX: Multiple Chapters → Combined Topics
    // GET: ?action=get_topics&chapter_ids[]=1&chapter_ids[]=2
    // --------------------------------------------------------
    case 'get_topics':
        header('Content-Type: application/json');
        $chapter_ids = isset($_GET['chapter_ids']) ? (array)$_GET['chapter_ids'] : [];
        $chapter_ids = array_map('intval', array_filter($chapter_ids));

        if (empty($chapter_ids)) {
            echo json_encode(['success' => false, 'message' => 'No chapters selected']);
            exit;
        }
        $topics = $model->getTopicsByChapters($chapter_ids);
        echo json_encode(['success' => true, 'data' => $topics]);
        exit;

    // --------------------------------------------------------
    // POST: Generate Question Paper
    // --------------------------------------------------------
    case 'generate_paper':
    case 'generate_answer_key':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: ../views/faculty/dashboard.php');
            exit;
        }

        $subject_id     = intval($_POST['subject_id'] ?? 0);
        $chapter_ids    = isset($_POST['chapter_ids']) ? array_map('intval', (array)$_POST['chapter_ids']) : [];
        $topic_ids      = isset($_POST['topic_ids'])   ? (array)$_POST['topic_ids']   : [];
        $difficulties   = isset($_POST['difficulties'])? (array)$_POST['difficulties'] : [];
        $num_questions  = intval($_POST['num_questions']  ?? 25);
        $question_order = $_POST['question_order']  ?? 'random';
        $institute_name = htmlspecialchars(trim($_POST['institute_name'] ?? ''));
        $exam_title     = htmlspecialchars(trim($_POST['exam_title']     ?? 'DDCET Practice Test'));

        // Validation
        if (empty($chapter_ids) || empty($topic_ids) || empty($difficulties)
            || $num_questions <= 0 || empty($institute_name)) {
            $_SESSION['error'] = 'Please fill all required fields — Subject, Chapters, Topics, Difficulty and Institute Name.';
            header('Location: ../views/faculty/dashboard.php');
            exit;
        }

        $questions = $model->getQuestionsForPaper(
            $topic_ids, $difficulties, $num_questions, $question_order
        );

        if (empty($questions)) {
            $_SESSION['error'] = 'No questions found for selected filters. Try different topics or difficulty levels.';
            header('Location: ../views/faculty/dashboard.php');
            exit;
        }

        $paperData = [
            'type'            => ($action === 'generate_answer_key') ? 'answer_key' : 'question_paper',
            'institute_name'  => $institute_name,
            'exam_title'      => $exam_title,
            'subject_name'    => $model->getSubjectName($subject_id),
            'chapter_names'   => $model->getChapterNames($chapter_ids),
            'topic_names'     => $model->getTopicNames($topic_ids),
            'difficulties'    => implode(', ', $difficulties),
            'total_questions' => count($questions),
            'total_marks'     => count($questions) * 2,
            'questions'       => $questions,
            'generated_at'    => date('d M Y, h:i A'),
        ];

        if ($action === 'generate_answer_key') {
            // Store answer key separately — keeps question paper session alive
            $_SESSION['answer_key_data'] = $paperData;
            header('Location: ../views/faculty/paper_view.php?view=answer_key');
        } else {
            // Store question paper + clear old answer key
            $_SESSION['paper_data']      = $paperData;
            unset($_SESSION['answer_key_data']);
            header('Location: ../views/faculty/paper_view.php?view=question_paper');
        }
        exit;

    // --------------------------------------------------------
    // Generate Answer Key directly from existing session paper
    // Called from paper_view.php — no need to go back to dashboard
    // --------------------------------------------------------
    case 'make_answer_key_from_session':
        if (empty($_SESSION['paper_data'])) {
            header('Location: ../views/faculty/dashboard.php');
            exit;
        }
        // Copy paper_data → answer_key_data, just change type
        $answerKeyData         = $_SESSION['paper_data'];
        $answerKeyData['type'] = 'answer_key';
        $_SESSION['answer_key_data'] = $answerKeyData;
        header('Location: ../views/faculty/paper_view.php?view=answer_key');
        exit;

    default:
        header('Location: ../views/faculty/dashboard.php');
        exit;
}