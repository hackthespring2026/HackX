<?php
// ============================================================
// DDCETPrepHub — app/views/student/generate_report.php
// Generates professional PDF report and streams to browser
// ============================================================
session_start();

if (empty($_SESSION['test_result'])) {
    http_response_code(400);
    die('<h2 style="font-family:sans-serif;color:#dc2626;">No test result found. Please complete a test first.</h2>');
}

$r        = $_SESSION['test_result'];
$testType = $r['test_type'];
$typeMap  = ['topic'=>'Topic_Wise','chapter'=>'Chapter_Wise','subject'=>'Subject_Wise','full'=>'Full_Mock'];
$label    = $typeMap[$testType] ?? 'Test';
$dateStr  = date('Y-m-d_H-i');
$filename = "DDCETPrepHub_{$label}_{$dateStr}.pdf";

// ── Temp paths ───────────────────────────────────────────────
$tmpDir  = sys_get_temp_dir();
$jsonPath= $tmpDir . '/ddcet_report_' . session_id() . '.json';
$pdfPath = $tmpDir . '/ddcet_report_' . session_id() . '.pdf';

// ── Prepare data for Python ──────────────────────────────────
// Flatten: convert numeric-keyed objects (from session) to proper format
$data = [
    'test_type' => $r['test_type'],
    'questions' => array_values($r['questions']),
    'responses' => $r['responses'],
    'statuses'  => $r['statuses'],
    'names'     => $r['names'],
    'analysis'  => [
        'overall'       => $r['analysis']['overall'],
        'insights'      => $r['analysis']['insights'],
        'plan'          => $r['analysis']['plan'],
        'readiness'     => $r['analysis']['readiness'],
        'priorities'    => $r['analysis']['priorities'],
        'diff_stats'    => $r['analysis']['diff_stats'],
        // Convert array-keyed stats to properly indexed
        'topic_stats'   => array_values($r['analysis']['topic_stats']),
        'chapter_stats' => array_values($r['analysis']['chapter_stats']),
        'subject_stats' => array_values($r['analysis']['subject_stats']),
    ],
];

// ── Write JSON ───────────────────────────────────────────────
file_put_contents($jsonPath, json_encode($data, JSON_UNESCAPED_UNICODE));

// ── Find Python + script path ────────────────────────────────
$pythonBin = "C:\\Users\\Aditya\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";
$pythonBin  = trim($pythonBin);
$scriptPath = realpath(__DIR__ . '/../../../../generate_pdf.py');

// Fallback: search common locations
if (!$scriptPath || !file_exists($scriptPath)) {
    $candidates = [
        __DIR__ . '/../../../../generate_pdf.py',
        __DIR__ . '/../../../generate_pdf.py',
        dirname(__DIR__, 4) . '/generate_pdf.py',
    ];
    foreach ($candidates as $c) {
        if (file_exists(realpath($c))) { $scriptPath = realpath($c); break; }
    }
}

if (!$scriptPath || !file_exists($scriptPath)) {
    // Show helpful error with exact paths for debugging
    http_response_code(500);
    $dir = __DIR__;
    die("
    <div style='font-family:sans-serif;padding:24px;max-width:600px;'>
        <h2 style='color:#dc2626;'>PDF Generator Script Not Found</h2>
        <p>Please place <code>generate_pdf.py</code> in the project root.</p>
        <p>Current view dir: <code>$dir</code></p>
        <p>Tried: <code>" . implode('</code>, <code>', $candidates) . "</code></p>
    </div>");
}

// ── Run Python generator ─────────────────────────────────────
$escapedJson = escapeshellarg($jsonPath);
$escapedPdf  = escapeshellarg($pdfPath);
$escapedScript = escapeshellarg($scriptPath);

$cmd    = "$pythonBin $escapedScript $escapedJson $escapedPdf 2>&1";
$output = shell_exec($cmd);

// ── Check result ─────────────────────────────────────────────
if (!file_exists($pdfPath) || filesize($pdfPath) === 0) {
    http_response_code(500);
    echo "
    <div style='font-family:sans-serif;padding:24px;max-width:700px;'>
        <h2 style='color:#dc2626;'>PDF Generation Failed</h2>
        <p><strong>Python output:</strong></p>
        <pre style='background:#f1f5f9;padding:16px;border-radius:8px;overflow-x:auto;font-size:12px;'>".htmlspecialchars($output ?? 'No output')."</pre>
        <p><a href='test_result.php' style='color:#1E3A8A;'>← Back to Report</a></p>
    </div>";
    exit;
}

// ── Stream PDF to browser ────────────────────────────────────
$filesize = filesize($pdfPath);
header('Content-Type: application/pdf');
header("Content-Disposition: attachment; filename=\"{$filename}\"");
header("Content-Length: $filesize");
header('Cache-Control: no-cache, no-store');
header('Pragma: no-cache');

readfile($pdfPath);

// ── Cleanup temp files ───────────────────────────────────────
@unlink($jsonPath);
@unlink($pdfPath);
exit;