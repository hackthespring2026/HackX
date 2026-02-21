<?php
// ============================================================
// DDCETPrepHub — app/models/Question.php
// Handles all question-related DB queries
// UPDATED: Multi-chapter support added
// ============================================================

require_once __DIR__ . '/../../config/database.php';

class Question {

    private $conn;

    public function __construct() {
        $this->conn = getDBConnection();
    }

    // --------------------------------------------------------
    // Get all subjects
    // --------------------------------------------------------
    public function getAllSubjects() {
        $result = $this->conn->query("SELECT id, name FROM subjects ORDER BY name");
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    // --------------------------------------------------------
    // Get chapters by subject_id
    // --------------------------------------------------------
    public function getChaptersBySubject($subject_id) {
        $subject_id = intval($subject_id);
        $stmt = $this->conn->prepare(
            "SELECT id, name FROM chapters WHERE subject_id = ? ORDER BY name"
        );
        $stmt->bind_param("i", $subject_id);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    // --------------------------------------------------------
    // NEW: Get topics by MULTIPLE chapter_ids (array)
    // Used by AJAX when faculty selects multiple chapters
    // --------------------------------------------------------
    public function getTopicsByChapters(array $chapter_ids) {
        if (empty($chapter_ids)) return [];

        $chapter_ids  = array_map('intval', $chapter_ids);
        $placeholders = implode(',', array_fill(0, count($chapter_ids), '?'));
        $types        = str_repeat('i', count($chapter_ids));

        $stmt = $this->conn->prepare(
            "SELECT t.id, t.name, c.name AS chapter_name
             FROM topics t
             JOIN chapters c ON t.chapter_id = c.id
             WHERE t.chapter_id IN ($placeholders)
             ORDER BY c.name, t.name"
        );
        $stmt->bind_param($types, ...$chapter_ids);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    // --------------------------------------------------------
    // Fetch questions for paper generation
    // --------------------------------------------------------
    public function getQuestionsForPaper($topic_ids, $difficulties, $limit, $order = 'random') {
        $topic_ids    = array_map('intval', $topic_ids);
        $limit        = min(intval($limit), 100);

        $allowed      = ['easy','moderate','hard','advanced','tricky'];
        $difficulties = array_filter($difficulties, fn($d) => in_array($d, $allowed));

        if (empty($topic_ids) || empty($difficulties) || $limit <= 0) return [];

        $topicPH = implode(',', array_fill(0, count($topic_ids), '?'));
        $diffPH  = implode(',', array_fill(0, count($difficulties), '?'));
        $orderCl = ($order === 'random') ? 'ORDER BY RAND()' : 'ORDER BY id ASC';

        $sql = "SELECT id, question_text, option_a, option_b, option_c, option_d,
                       correct_answer, difficulty, marks, explanation
                FROM questions
                WHERE topic_id IN ($topicPH)
                AND   difficulty IN ($diffPH)
                $orderCl
                LIMIT ?";

        $stmt   = $this->conn->prepare($sql);
        $types  = str_repeat('i', count($topic_ids))
                . str_repeat('s', count($difficulties))
                . 'i';
        $params = array_merge($topic_ids, $difficulties, [$limit]);

        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    // --------------------------------------------------------
    // Get subject name
    // --------------------------------------------------------
    public function getSubjectName($subject_id) {
        $subject_id = intval($subject_id);
        $result = $this->conn->query("SELECT name FROM subjects WHERE id = $subject_id");
        $row    = $result->fetch_assoc();
        return $row ? $row['name'] : 'Unknown Subject';
    }

    // --------------------------------------------------------
    // NEW: Get chapter names by multiple IDs
    // --------------------------------------------------------
    public function getChapterNames(array $chapter_ids) {
        if (empty($chapter_ids)) return 'N/A';
        $chapter_ids  = array_map('intval', $chapter_ids);
        $placeholders = implode(',', $chapter_ids);
        $result = $this->conn->query(
            "SELECT name FROM chapters WHERE id IN ($placeholders) ORDER BY name"
        );
        $names = [];
        while ($row = $result->fetch_assoc()) $names[] = $row['name'];
        return implode(', ', $names);
    }

    // --------------------------------------------------------
    // Get topic names by IDs
    // --------------------------------------------------------
    public function getTopicNames(array $topic_ids) {
        if (empty($topic_ids)) return 'N/A';
        $topic_ids    = array_map('intval', $topic_ids);
        $placeholders = implode(',', $topic_ids);
        $result = $this->conn->query(
            "SELECT name FROM topics WHERE id IN ($placeholders)"
        );
        $names = [];
        while ($row = $result->fetch_assoc()) $names[] = $row['name'];
        return implode(', ', $names);
    }
}