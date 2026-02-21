<?php
// DDCETPrepHub — app/views/student/test_result.php
session_start();
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (empty($_SESSION['test_result'])) {
    header('Location: dashboard.php'); exit;
}

require_once __DIR__ . '/../../../app/models/AnalysisEngine.php';

$r         = $_SESSION['test_result'];
$analysis  = $r['analysis'];
$names     = $r['names'];
$o         = $analysis['overall'];
$testType  = $r['test_type'];
$questions = $r['questions'];
$responses = $r['responses'];
$statuses  = $r['statuses'];

$typeLabels = ['topic'=>'Topic Wise','chapter'=>'Chapter Wise','subject'=>'Subject Wise','full'=>'Full Mock Test'];
$grade = match(true) {
    $o['accuracy'] >= 80 => ['A+','Excellent!',    '#16a34a','#dcfce7'],
    $o['accuracy'] >= 65 => ['A', 'Great Work!',   '#0369a1','#dbeafe'],
    $o['accuracy'] >= 50 => ['B', 'Good Effort!',  '#d97706','#fef3c7'],
    $o['accuracy'] >= 35 => ['C', 'Keep Going!',   '#f97316','#fff7ed'],
    default              => ['D', 'Keep Studying!','#dc2626','#fee2e2'],
};

// Sort topics by priority (weakest first)
$topicStats = $analysis['topic_stats'];
$priorities = $analysis['priorities'];
$maxPri     = max(array_values($priorities) ?: [1]);
uasort($topicStats, fn($a,$b) => ($priorities[$b['topic_id']]??0) <=> ($priorities[$a['topic_id']]??0));

function heatBg(string $heat): string {
    return match($heat) {
        'mastered' => 'background:#bbf7d0;color:#14532d;',
        'hot'      => 'background:#bfdbfe;color:#1e3a8a;',
        'warm'     => 'background:#fef08a;color:#713f12;',
        default    => 'background:#fecaca;color:#7f1d1d;',
    };
}
function heatLabel(string $heat): string {
    return match($heat) {
        'mastered' => 'Mastered', 'hot' => 'Strong', 'warm' => 'Average', default => 'Weak',
    };
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Analysis Report — DDCETPrepHub</title>
<script>
history.pushState(null, null, location.href);
window.addEventListener('popstate', () => window.location.replace('dashboard.php'));
</script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{font-family:'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;}
.card{background:white;border-radius:16px;padding:24px;border:1px solid #e2e8f0;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.05);}
.section-title{font-size:15px;font-weight:800;color:#1e293b;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.diff-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;}
.diff-easy{background:#dcfce7;color:#16a34a;}.diff-moderate{background:#dbeafe;color:#1d4ed8;}
.diff-hard{background:#fed7aa;color:#c2410c;}.diff-advanced{background:#fee2e2;color:#dc2626;}
.diff-tricky{background:#f3e8ff;color:#7c3aed;}
.heat-cell{border-radius:10px;padding:12px;text-align:center;font-size:11px;font-weight:700;cursor:default;transition:transform .15s;}
.heat-cell:hover{transform:scale(1.04);}
.opt-row{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;margin-bottom:6px;}
.opt-lbl{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;}
.priority-bar{height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden;margin-top:4px;}
.priority-fill{height:100%;border-radius:3px;}
.insight-box{border-radius:12px;padding:14px 16px;border-left:4px solid;margin-bottom:10px;display:flex;gap:10px;align-items:flex-start;}
.tab-btn{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #e2e8f0;background:white;color:#64748b;transition:all .2s;}
.tab-btn.active{background:#1E3A8A;color:white;border-color:#1E3A8A;}
.tab-panel{display:none;}.tab-panel.active{display:block;}
</style>
</head>
<body>
<div style="max-width:960px;margin:0 auto;padding:24px 16px;">

<!-- Header -->
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:22px;">📖</span>
    <div>
      <p style="font-weight:800;font-size:17px;color:#1E3A8A;">DDCETPrepHub</p>
      <p style="font-size:12px;color:#64748b;"><?= $typeLabels[$testType] ?? 'Test' ?> · Diagnostic Analysis Report</p>
    </div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <a href="dashboard.php" style="background:#1E3A8A;color:white;font-size:13px;font-weight:700;padding:10px 16px;border-radius:10px;text-decoration:none;display:flex;align-items:center;gap:5px;">← Dashboard</a>
    <a href="test_setup.php?type=<?=$testType?>" style="background:#06B6D4;color:white;font-size:13px;font-weight:700;padding:10px 16px;border-radius:10px;text-decoration:none;display:flex;align-items:center;gap:5px;">🔄 Retry</a>
    <a href="answer_key.php" target="_blank" style="background:#7c3aed;color:white;font-size:13px;font-weight:700;padding:10px 16px;border-radius:10px;text-decoration:none;display:flex;align-items:center;gap:5px;">📋 Answer Key</a>
    <button onclick="downloadPDFReport()" style="background:#16a34a;color:white;font-size:13px;font-weight:700;padding:10px 16px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;" id="pdf_btn">⬇️ Download Report</button>
  </div>
</div>

<!-- ════ SECTION 1: PERFORMANCE SUMMARY ════ -->
<div class="card" style="background:linear-gradient(135deg,#1E3A8A 0%,#1e40af 100%);color:white;border:none;">
  <div style="display:grid;grid-template-columns:140px 1fr 1fr 1fr 1fr;gap:16px;align-items:center;">
    <!-- Grade -->
    <div style="text-align:center;">
      <div style="width:100px;height:100px;border-radius:50%;background:<?=$grade[3]?>;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto;">
        <span style="font-size:34px;font-weight:900;color:<?=$grade[2]?>;"><?=$grade[0]?></span>
      </div>
      <p style="font-size:12px;color:#bfdbfe;margin-top:8px;font-weight:700;"><?=$grade[1]?></p>
    </div>
    <!-- Score -->
    <div style="text-align:center;border-left:1px solid rgba(255,255,255,.2);padding-left:16px;">
      <p style="font-size:36px;font-weight:900;"><?=$o['score']?></p>
      <p style="font-size:12px;color:#bfdbfe;">/ <?=$o['max_score']?> marks</p>
      <div style="background:rgba(255,255,255,.2);border-radius:20px;height:5px;overflow:hidden;margin-top:8px;">
        <div style="width:<?=$o['accuracy']?>%;height:100%;background:#06B6D4;border-radius:20px;"></div>
      </div>
    </div>
    <!-- Accuracy -->
    <div style="text-align:center;border-left:1px solid rgba(255,255,255,.2);padding-left:16px;">
      <p style="font-size:30px;font-weight:900;color:#6ee7b7;"><?=$o['accuracy']?>%</p>
      <p style="font-size:12px;color:#bfdbfe;">Accuracy</p>
      <p style="font-size:11px;color:#93c5fd;margin-top:4px;font-weight:600;"><?=$o['mastery']?></p>
    </div>
    <!-- Stats -->
    <div style="border-left:1px solid rgba(255,255,255,.2);padding-left:16px;font-size:12px;line-height:2;">
      <div>✅ <strong><?=$o['correct']?></strong> Correct</div>
      <div>❌ <strong><?=$o['wrong']?></strong> Wrong</div>
      <div>⏭ <strong><?=$o['skipped']?></strong> Skipped</div>
      <div>📊 <strong><?=$o['attempt_rate']?>%</strong> Attempted</div>
    </div>
    <!-- Time -->
    <div style="border-left:1px solid rgba(255,255,255,.2);padding-left:16px;font-size:12px;line-height:2;">
      <div>⏱ <strong><?=$o['time_str']?></strong></div>
      <div>📝 <strong><?=$o['total']?></strong> Questions</div>
      <div>⚡ <strong><?=$o['avg_time_sec']?>s</strong>/q</div>
      <div>🎯 <strong><?=$typeLabels[$testType]??'Test'?></strong></div>
    </div>
  </div>
</div>

<!-- ════ SECTION 2: EXAM READINESS ════ -->
<?php $rd = $analysis['readiness']; ?>
<div class="card" style="border-left:5px solid <?=$rd['color']?>;">
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
    <div>
      <p class="section-title" style="margin-bottom:6px;">🎯 Exam Readiness Prediction</p>
      <p style="font-size:20px;font-weight:800;color:<?=$rd['color']?>;"><?=$rd['level']?></p>
      <p style="font-size:13px;color:#64748b;margin-top:6px;max-width:560px;line-height:1.6;"><?=$rd['desc']?></p>
    </div>
    <div style="text-align:center;flex-shrink:0;">
      <div style="width:84px;height:84px;border-radius:50%;border:5px solid <?=$rd['color']?>;background:<?=$rd['color']?>18;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:22px;font-weight:900;color:<?=$rd['color']?>;"><?=$rd['pct']?>%</span>
      </div>
      <p style="font-size:10px;color:#94a3b8;margin-top:4px;">Readiness</p>
    </div>
  </div>
</div>

<!-- ════ TABS ════ -->
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
  <button class="tab-btn active" onclick="switchTab(this,'insights')">💡 Insights</button>
  <button class="tab-btn" onclick="switchTab(this,'heatmap')">🔥 Heatmap</button>
  <button class="tab-btn" onclick="switchTab(this,'chapters')">📚 Chapters</button>
  <?php if(count($analysis['diff_stats'])>1): ?>
  <button class="tab-btn" onclick="switchTab(this,'difficulty')">📊 Difficulty</button>
  <?php endif; ?>
  <button class="tab-btn" onclick="switchTab(this,'plan')">🗺️ Study Plan</button>
  <button class="tab-btn" onclick="switchTab(this,'review')">📝 Review</button>
  <div style="margin-left:auto;display:flex;gap:8px;">
    <a href="answer_key.php" target="_blank" class="tab-btn" style="background:#f3e8ff;color:#7c3aed;border-color:#c4b5fd;text-decoration:none;display:flex;align-items:center;gap:5px;">📋 Answer Key</a>
    <button onclick="downloadPDFReport()" class="tab-btn" style="background:#f0fdf4;color:#16a34a;border-color:#86efac;display:flex;align-items:center;gap:5px;" id="pdf_btn">⬇️ Download PDF</button>
  </div>
</div>

<!-- ══ TAB: INSIGHTS ══ -->
<div id="tab_insights" class="tab-panel active">
  <div class="card">
    <p class="section-title">💡 DDCETPreHub Learning Insights <span style="font-size:11px;font-weight:400;color:#94a3b8;">Based strictly on assessed questions</span></p>
    <?php foreach($analysis['insights'] as $ins):
      $bc=['success'=>'#16a34a','warning'=>'#d97706','danger'=>'#dc2626'][$ins['type']]??'#64748b';
      $bg=['success'=>'#f0fdf4','warning'=>'#fffbeb','danger'=>'#fff1f2'][$ins['type']]??'#f8fafc';
    ?>
    <div class="insight-box" style="background:<?=$bg?>;border-color:<?=$bc?>;">
      <span style="font-size:18px;flex-shrink:0;"><?=$ins['icon']?></span>
      <p style="font-size:13px;color:#374151;line-height:1.6;"><?=$ins['text']?></p>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- Learning Priority Index -->
  <div class="card">
    <p class="section-title">🎯 Learning Priority Index
      <span style="font-size:11px;font-weight:400;color:#94a3b8;">Priority = (1 − accuracy) × attempts · Study rank #1 first!</span>
    </p>
    <div style="display:grid;gap:12px;">
    <?php $rank=1; foreach($topicStats as $t):
      $tname=$names['topics'][$t['topic_id']]??"Topic #{$t['topic_id']}";
      $pri=$priorities[$t['topic_id']]??0;
      $pct=$maxPri>0?round(($pri/$maxPri)*100):0;
      $clr=AnalysisEngine::getColor($t['accuracy']);
    ?>
    <div style="display:grid;grid-template-columns:32px 1fr 90px 90px;gap:12px;align-items:center;">
      <div style="background:#f1f5f9;color:#64748b;font-weight:800;font-size:12px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><?=$rank++?></div>
      <div>
        <p style="font-size:13px;font-weight:700;margin-bottom:2px;"><?=htmlspecialchars($tname)?></p>
        <div class="priority-bar"><div class="priority-fill" style="width:<?=$pct?>%;background:<?=$clr?>;"></div></div>
        <p style="font-size:10px;color:#94a3b8;margin-top:2px;">Priority score: <?=$pri?></p>
      </div>
      <span style="font-size:13px;font-weight:700;color:<?=$clr?>;text-align:right;"><?=$t['accuracy']?>% acc</span>
      <span style="font-size:10px;padding:3px 8px;border-radius:20px;font-weight:700;text-align:center;<?=heatBg($t['heat'])?>"><?=heatLabel($t['heat'])?></span>
    </div>
    <?php endforeach; ?>
    </div>
  </div>
</div>

<!-- ══ TAB: HEATMAP ══ -->
<div id="tab_heatmap" class="tab-panel">
  <div class="card">
    <p class="section-title">🔥 Topic Performance Heatmap</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;font-size:11px;font-weight:700;">
      <span style="background:#fecaca;color:#7f1d1d;padding:4px 12px;border-radius:20px;">🔴 Weak &lt;40%</span>
      <span style="background:#fef08a;color:#713f12;padding:4px 12px;border-radius:20px;">🟡 Average 40–59%</span>
      <span style="background:#bfdbfe;color:#1e3a8a;padding:4px 12px;border-radius:20px;">🔵 Strong 60–79%</span>
      <span style="background:#bbf7d0;color:#14532d;padding:4px 12px;border-radius:20px;">🟢 Mastered ≥80%</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;">
    <?php foreach($topicStats as $t):
      $tname=$names['topics'][$t['topic_id']]??"Topic #{$t['topic_id']}";
    ?>
    <div class="heat-cell" title="<?=htmlspecialchars($t['insight'])?>" style="<?=heatBg($t['heat'])?>">
      <p style="font-size:11px;font-weight:800;margin-bottom:4px;word-break:break-word;"><?=htmlspecialchars($tname)?></p>
      <p style="font-size:22px;font-weight:900;"><?=$t['accuracy']?>%</p>
      <p style="font-size:10px;margin-top:2px;"><?=$t['correct']?>/<?=$t['attempted']?> correct</p>
      <p style="font-size:10px;font-weight:700;"><?=heatLabel($t['heat'])?></p>
    </div>
    <?php endforeach; ?>
    </div>
  </div>

  <!-- Table -->
  <div class="card">
    <p class="section-title">📋 Detailed Topic Table</p>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
        <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:700;">Topic</th>
        <th style="padding:10px 12px;text-align:center;color:#64748b;font-weight:700;">Total</th>
        <th style="padding:10px 12px;text-align:center;color:#16a34a;font-weight:700;">✅ Correct</th>
        <th style="padding:10px 12px;text-align:center;color:#dc2626;font-weight:700;">❌ Wrong</th>
        <th style="padding:10px 12px;text-align:center;color:#64748b;font-weight:700;">⏭ Skipped</th>
        <th style="padding:10px 12px;text-align:center;color:#64748b;font-weight:700;">Accuracy</th>
        <th style="padding:10px 12px;text-align:center;color:#64748b;font-weight:700;">Status</th>
        <th style="padding:10px 12px;text-align:left;color:#64748b;font-weight:700;">Advice</th>
      </tr></thead>
      <tbody>
      <?php foreach($topicStats as $t):
        $tname=$names['topics'][$t['topic_id']]??"Topic #{$t['topic_id']}";
      ?>
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px;font-weight:700;"><?=htmlspecialchars($tname)?></td>
        <td style="padding:10px 12px;text-align:center;"><?=$t['total']?></td>
        <td style="padding:10px 12px;text-align:center;color:#16a34a;font-weight:700;"><?=$t['correct']?></td>
        <td style="padding:10px 12px;text-align:center;color:#dc2626;font-weight:700;"><?=$t['wrong']?></td>
        <td style="padding:10px 12px;text-align:center;color:#94a3b8;"><?=$t['skipped']?></td>
        <td style="padding:10px 12px;text-align:center;"><span style="font-weight:800;color:<?=$t['color']?>;"><?=$t['accuracy']?>%</span></td>
        <td style="padding:10px 12px;text-align:center;"><span style="font-size:10px;padding:3px 8px;border-radius:20px;font-weight:700;<?=heatBg($t['heat'])?>"><?=heatLabel($t['heat'])?></span></td>
        <td style="padding:10px 12px;font-size:11px;color:#64748b;max-width:180px;"><?=$t['insight']?></td>
      </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    </div>
  </div>
</div>

<!-- ══ TAB: CHAPTERS ══ -->
<div id="tab_chapters" class="tab-panel">
  <div class="card">
    <p class="section-title">📚 Chapter Performance Analysis <span style="font-size:11px;font-weight:400;color:#94a3b8;">Sorted weakest first</span></p>
    <div style="display:grid;gap:14px;">
    <?php foreach($analysis['chapter_stats'] as $cid=>$c):
      $cname=$names['chapters'][$cid]??"Chapter #$cid";
      $sname=$names['subjects'][$c['subject_id']]??'';
    ?>
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;border-left:5px solid <?=$c['color']?>;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div>
          <p style="font-weight:800;font-size:14px;"><?=htmlspecialchars($cname)?></p>
          <?php if($sname):?><p style="font-size:11px;color:#94a3b8;margin-top:2px;"><?=htmlspecialchars($sname)?></p><?php endif;?>
        </div>
        <div style="text-align:right;">
          <span style="font-size:26px;font-weight:900;color:<?=$c['color']?>;"><?=$c['accuracy']?>%</span>
          <p style="font-size:11px;color:<?=$c['color']?>;font-weight:700;"><?=$c['label']?></p>
        </div>
      </div>
      <div style="background:#f1f5f9;border-radius:20px;height:7px;overflow:hidden;margin-bottom:10px;">
        <div style="width:<?=min($c['accuracy'],100)?>%;height:100%;background:<?=$c['color']?>;border-radius:20px;"></div>
      </div>
      <div style="display:flex;gap:16px;font-size:12px;color:#64748b;margin-bottom:8px;flex-wrap:wrap;">
        <span>Total: <strong><?=$c['total']?></strong></span>
        <span style="color:#16a34a;">✅ <strong><?=$c['correct']?></strong></span>
        <span style="color:#dc2626;">❌ <strong><?=$c['wrong']?></strong></span>
        <span>⏭ <strong><?=$c['skipped']?></strong></span>
      </div>
      <p style="font-size:12px;color:#475569;background:#f8fafc;border-radius:8px;padding:8px 12px;">💬 <?=$c['insight']?></p>
    </div>
    <?php endforeach; ?>
    </div>
  </div>

  <?php if(count($analysis['subject_stats'])>1): ?>
  <div class="card">
    <p class="section-title">📊 Subject Comparison</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
    <?php foreach($analysis['subject_stats'] as $sid=>$s):
      $sname=$names['subjects'][$sid]??"Subject #$sid";
    ?>
    <div style="border:2px solid <?=$s['color']?>33;border-radius:12px;padding:16px;text-align:center;border-top:4px solid <?=$s['color']?>;">
      <p style="font-weight:700;font-size:13px;margin-bottom:8px;"><?=htmlspecialchars($sname)?></p>
      <p style="font-size:28px;font-weight:900;color:<?=$s['color']?>;"><?=$s['accuracy']?>%</p>
      <p style="font-size:11px;color:<?=$s['color']?>;font-weight:700;margin-bottom:8px;"><?=$s['label']?></p>
      <div style="background:#f1f5f9;border-radius:20px;height:5px;overflow:hidden;">
        <div style="width:<?=min($s['accuracy'],100)?>%;height:100%;background:<?=$s['color']?>;border-radius:20px;"></div>
      </div>
      <p style="font-size:11px;color:#94a3b8;margin-top:6px;"><?=$s['correct']?>/<?=$s['attempted']?> correct</p>
    </div>
    <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>
</div>

<!-- ══ TAB: DIFFICULTY ══ -->
<?php if(count($analysis['diff_stats'])>1): ?>
<div id="tab_difficulty" class="tab-panel">
  <div class="card">
    <p class="section-title">📊 Difficulty Level Performance <span style="font-size:11px;font-weight:400;color:#94a3b8;">Shows your learning depth</span></p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
    <?php foreach(['easy','moderate','hard','advanced','tricky'] as $diff):
      if(!isset($analysis['diff_stats'][$diff])) continue;
      $ds=$analysis['diff_stats'][$diff];
    ?>
    <div style="border-radius:14px;padding:18px;text-align:center;border:2px solid #e2e8f0;border-top:5px solid <?=$ds['color']?>;">
      <span class="diff-badge diff-<?=$diff?>"><?=$diff?></span>
      <p style="font-size:28px;font-weight:900;color:<?=$ds['color']?>;margin:10px 0 4px;"><?=$ds['accuracy']?>%</p>
      <p style="font-size:12px;color:#64748b;margin-bottom:6px;"><?=$ds['correct']?>/<?=$ds['attempted']?> correct</p>
      <p style="font-size:11px;color:#94a3b8;"><?=$ds['total']?> total q</p>
      <div style="background:#f1f5f9;border-radius:20px;height:5px;overflow:hidden;margin-top:8px;">
        <div style="width:<?=min($ds['accuracy'],100)?>%;height:100%;background:<?=$ds['color']?>;border-radius:20px;"></div>
      </div>
    </div>
    <?php endforeach; ?>
    </div>
    <div style="display:grid;gap:8px;">
    <?php foreach($analysis['diff_stats'] as $ds): ?>
    <div style="display:flex;gap:10px;align-items:flex-start;padding:12px;background:#f8fafc;border-radius:10px;">
      <span class="diff-badge diff-<?=$ds['difficulty']?>" style="flex-shrink:0;margin-top:2px;"><?=$ds['difficulty']?></span>
      <p style="font-size:13px;color:#475569;"><?=$ds['insight']?></p>
    </div>
    <?php endforeach; ?>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- ══ TAB: STUDY PLAN ══ -->
<div id="tab_plan" class="tab-panel">
  <div class="card">
    <p class="section-title">🗺️ Personalized 3-Step Improvement Plan</p>
    <p style="font-size:13px;color:#64748b;margin-bottom:20px;">Generated from your actual test performance — not generic advice.</p>
    <div style="display:grid;gap:14px;">
    <?php foreach($analysis['plan'] as $step): ?>
    <div style="border-radius:14px;padding:20px;border:2px solid <?=$step['color']?>22;background:<?=$step['color']?>08;display:flex;gap:16px;align-items:flex-start;">
      <div style="width:44px;height:44px;border-radius:12px;background:<?=$step['color']?>;color:white;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><?=$step['icon']?></div>
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="background:<?=$step['color']?>;color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">STEP <?=$step['step']?></span>
          <p style="font-weight:800;font-size:14px;"><?=$step['title']?></p>
        </div>
        <p style="font-size:13px;color:#475569;line-height:1.6;"><?=$step['desc']?></p>
      </div>
    </div>
    <?php endforeach; ?>
    </div>
  </div>

  <!-- Priority improvement area -->
  <?php
  $coldTopics=array_filter($analysis['topic_stats'],fn($t)=>$t['heat']==='cold');
  if(!empty($coldTopics)):
    $lowestT=array_reduce($coldTopics,fn($c,$t)=>(!$c||$t['accuracy']<$c['accuracy'])?$t:$c);
    $ltName=$names['topics'][$lowestT['topic_id']]??"Topic #{$lowestT['topic_id']}";
    $lcName=$names['chapters'][$lowestT['chapter_id']]??"Chapter #{$lowestT['chapter_id']}";
  ?>
  <div class="card" style="border:2px solid #fca5a5;background:#fff1f2;">
    <p class="section-title" style="color:#dc2626;">🚨 Highest Priority Improvement Area</p>
    <p style="font-size:14px;color:#7f1d1d;font-weight:700;margin-bottom:6px;">
      📌 <strong><?=htmlspecialchars($ltName)?></strong> in chapter <strong><?=htmlspecialchars($lcName)?></strong>
    </p>
    <p style="font-size:13px;color:#991b1b;margin-bottom:12px;">
      Accuracy: <strong><?=$lowestT['accuracy']?>%</strong> · <?=$lowestT['attempted']?> attempted · <?=$lowestT['correct']?> correct
    </p>
    <div style="background:#fecaca;border-radius:10px;padding:12px;font-size:13px;color:#7f1d1d;line-height:1.6;">
      <strong>Recommended action:</strong> Revise <?=htmlspecialchars($ltName)?> theory → watch a concept video → solve 10 basic problems → re-test this specific topic to measure improvement.
    </div>
  </div>
  <?php endif; ?>
</div>

<!-- ══ TAB: QUESTION REVIEW ══ -->
<div id="tab_review" class="tab-panel">
  <div class="card">
    <p class="section-title">📝 Question-by-Question Review</p>
    <div style="display:flex;gap:10px;font-size:12px;font-weight:700;margin-bottom:16px;flex-wrap:wrap;">
      <span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;"><?=$o['correct']?> Correct</span>
      <span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;"><?=$o['wrong']?> Wrong</span>
      <span style="background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;"><?=$o['skipped']?> Skipped</span>
    </div>
    <?php foreach($questions as $idx=>$q):
      $qid=$q['id']; $selected=$responses[$qid]??''; $status=$statuses[$qid]??'not_visited';
      $isCorrect=($selected!==''&&$selected===$q['correct_answer']);
      $isWrong=($selected!==''&&$selected!==$q['correct_answer']);
      $isSkipped=!$selected||in_array($status,['skipped','not_visited']);
      $rowBg=$isCorrect?'#f0fdf4':($isWrong?'#fff1f2':'#f8fafc');
      $icon=$isCorrect?'✅':($isWrong?'❌':'⏭');
    ?>
    <div style="border-bottom:1px solid #f1f5f9;padding:16px;background:<?=$rowBg?>;border-radius:8px;margin-bottom:6px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span><?=$icon?></span>
        <span style="background:#1e293b;color:white;font-size:11px;font-weight:700;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;"><?=$idx+1?></span>
        <span class="diff-badge diff-<?=$q['difficulty']?>"><?=ucfirst($q['difficulty'])?></span>
        <?php if($isSkipped):?><span style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:20px;font-weight:700;">Not Attempted</span><?php endif;?>
      </div>
      <p style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:10px;margin-left:36px;line-height:1.6;"><?=htmlspecialchars($q['question_text'])?></p>
      <div style="margin-left:36px;">
      <?php foreach(['A'=>$q['option_a'],'B'=>$q['option_b'],'C'=>$q['option_c'],'D'=>$q['option_d']] as $letter=>$text):
        $isCA=($letter===$q['correct_answer']); $isSA=($letter===$selected);
        $rs=$isCA?'background:#dcfce7;border:1.5px solid #86efac;':($isSA&&$isWrong?'background:#fee2e2;border:1.5px solid #fca5a5;':'background:white;border:1px solid #e5e7eb;');
        $ls=$isCA?'background:#16a34a;color:white;':($isSA&&$isWrong?'background:#dc2626;color:white;':'background:#f1f5f9;color:#64748b;');
      ?>
      <div class="opt-row" style="<?=$rs?>">
        <span class="opt-lbl" style="<?=$ls?>"><?=$letter?></span>
        <span style="font-size:12px;color:#374151;"><?=htmlspecialchars($text)?>
          <?=$isCA?' <strong style="color:#16a34a;font-size:10px;"> ✓ Correct Answer</strong>':''?>
          <?=($isSA&&$isWrong)?' <strong style="color:#dc2626;font-size:10px;"> ✗ Your Answer</strong>':''?>
        </span>
      </div>
      <?php endforeach;?>
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:10px 12px;margin-top:8px;">
        <p style="font-size:10px;font-weight:700;color:#1d4ed8;margin-bottom:3px;">💡 Explanation</p>
        <p style="font-size:12px;color:#1e3a8a;line-height:1.5;"><?=htmlspecialchars($q['explanation']??'No explanation available.')?></p>
      </div>
      </div>
    </div>
    <?php endforeach;?>
  </div>
</div>

<div style="height:32px;"></div>
</div>

<script>
function switchTab(btn, name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab_' + name);
    if (panel) panel.classList.add('active');
}

function downloadPDFReport() {
    const btn = document.getElementById('pdf_btn');
    if (btn) {
        btn.textContent = '⏳ Generating...';
        btn.disabled = true;
    }
    // Open PDF generator page in new tab
    window.open('generate_report.php', '_blank');
    setTimeout(() => {
        if (btn) {
            btn.innerHTML = '⬇️ Download PDF';
            btn.disabled = false;
        }
    }, 3000);
}
</script>
</body>
</html>