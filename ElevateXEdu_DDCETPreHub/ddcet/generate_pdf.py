#!/usr/bin/env python3
"""
DDCETPrepHub — PDF Report Generator
Uses ReportLab to create professional diagnostic report PDF
Called by generate_report.php via exec()
Input: JSON file path (sys.argv[1])
Output: PDF file path (sys.argv[2])
"""

import sys, json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from datetime import datetime

# ── Colors ──────────────────────────────────────────────────
NAVY     = colors.HexColor('#1E3A8A')
CYAN     = colors.HexColor('#06B6D4')
GREEN    = colors.HexColor('#16a34a')
YELLOW   = colors.HexColor('#d97706')
RED      = colors.HexColor('#dc2626')
PURPLE   = colors.HexColor('#7c3aed')
LIGHTBG  = colors.HexColor('#f8fafc')
LIGHTBLUE= colors.HexColor('#eff6ff')
SOFTGRAY = colors.HexColor('#e2e8f0')
TEXTDARK = colors.HexColor('#1e293b')
TEXTMID  = colors.HexColor('#475569')
TEXTGRAY = colors.HexColor('#64748b')

HEAT_COLORS = {
    'mastered': colors.HexColor('#bbf7d0'),
    'hot':      colors.HexColor('#bfdbfe'),
    'warm':     colors.HexColor('#fef08a'),
    'cold':     colors.HexColor('#fecaca'),
}
HEAT_TEXT = {
    'mastered': colors.HexColor('#14532d'),
    'hot':      colors.HexColor('#1e3a8a'),
    'warm':     colors.HexColor('#713f12'),
    'cold':     colors.HexColor('#7f1d1d'),
}
DIFF_COLORS = {
    'easy':     colors.HexColor('#dcfce7'),
    'moderate': colors.HexColor('#dbeafe'),
    'hard':     colors.HexColor('#fed7aa'),
    'advanced': colors.HexColor('#fee2e2'),
    'tricky':   colors.HexColor('#f3e8ff'),
}


def get_acc_color(acc):
    if acc >= 75: return GREEN
    if acc >= 40: return YELLOW
    return RED


def heat_label(heat):
    return {'mastered':'Mastered','hot':'Strong','warm':'Average','cold':'Weak'}.get(heat,'—')


# ── Custom horizontal bar Flowable ───────────────────────────
class HBar(Flowable):
    def __init__(self, width, height, filled_pct, fill_color, bg_color=SOFTGRAY):
        super().__init__()
        self.bar_width  = width
        self.bar_height = height
        self.filled_pct = min(max(filled_pct, 0), 100)
        self.fill_color = fill_color
        self.bg_color   = bg_color
        self.width      = width
        self.height     = height

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg_color)
        c.roundRect(0, 0, self.bar_width, self.bar_height, self.bar_height/2, fill=1, stroke=0)
        if self.filled_pct > 0:
            c.setFillColor(self.fill_color)
            fill_w = self.bar_width * (self.filled_pct / 100)
            c.roundRect(0, 0, fill_w, self.bar_height, self.bar_height/2, fill=1, stroke=0)


# ── Style builder ────────────────────────────────────────────
def make_styles():
    base  = getSampleStyleSheet()
    return {
        'title':  ParagraphStyle('title',  parent=base['Normal'], fontSize=22, fontName='Helvetica-Bold',  textColor=colors.white,   spaceAfter=4),
        'sub':    ParagraphStyle('sub',    parent=base['Normal'], fontSize=11, fontName='Helvetica',       textColor=colors.HexColor('#93c5fd')),
        'h1':     ParagraphStyle('h1',     parent=base['Normal'], fontSize=14, fontName='Helvetica-Bold',  textColor=TEXTDARK,        spaceBefore=14, spaceAfter=8),
        'h2':     ParagraphStyle('h2',     parent=base['Normal'], fontSize=12, fontName='Helvetica-Bold',  textColor=NAVY,            spaceBefore=10, spaceAfter=6),
        'body':   ParagraphStyle('body',   parent=base['Normal'], fontSize=10, fontName='Helvetica',       textColor=TEXTMID,         spaceAfter=4),
        'small':  ParagraphStyle('small',  parent=base['Normal'], fontSize=9,  fontName='Helvetica',       textColor=TEXTGRAY,        spaceAfter=2),
        'bold':   ParagraphStyle('bold',   parent=base['Normal'], fontSize=10, fontName='Helvetica-Bold',  textColor=TEXTDARK),
        'center': ParagraphStyle('center', parent=base['Normal'], fontSize=10, fontName='Helvetica',       textColor=TEXTMID,         alignment=TA_CENTER),
        'white':  ParagraphStyle('white',  parent=base['Normal'], fontSize=10, fontName='Helvetica',       textColor=colors.white),
        'insight':ParagraphStyle('insight',parent=base['Normal'], fontSize=9.5,fontName='Helvetica',       textColor=TEXTMID,         spaceAfter=3, leading=14),
        'q_text': ParagraphStyle('q_text', parent=base['Normal'], fontSize=9.5,fontName='Helvetica-Bold',  textColor=TEXTDARK,        spaceAfter=6, leading=14),
        'expl':   ParagraphStyle('expl',   parent=base['Normal'], fontSize=9,  fontName='Helvetica',       textColor=colors.HexColor('#1e3a8a'), leading=13),
    }


# ── Section header builder ───────────────────────────────────
def section_header(text, styles):
    return [
        Spacer(1, 4*mm),
        HRFlowable(width='100%', thickness=2, color=NAVY, spaceAfter=4),
        Paragraph(text, styles['h1']),
    ]


# ── MAIN GENERATOR ───────────────────────────────────────────
def generate_pdf(data: dict, output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm,  bottomMargin=18*mm,
        title='DDCETPrepHub Diagnostic Report',
        author='DDCETPrepHub',
    )

    S   = make_styles()
    W   = A4[0] - 30*mm  # usable width
    story = []

    analysis      = data.get('analysis', {})
    names         = data.get('names',    {})
    o             = analysis.get('overall', {})
    test_type     = data.get('test_type', 'Test')
    questions     = data.get('questions', [])
    responses     = data.get('responses', {})
    statuses      = data.get('statuses',  {})
    diff_stats    = analysis.get('diff_stats',    {})
    insights      = analysis.get('insights',      [])
    plan          = analysis.get('plan',          [])
    readiness     = analysis.get('readiness',     {})
    priorities    = analysis.get('priorities',    {})

    # Normalize stats — handle both list and dict from PHP session
    def to_list(v): return list(v.values()) if isinstance(v, dict) else (v or [])
    topic_stats   = to_list(analysis.get('topic_stats',   {}))
    chapter_stats = to_list(analysis.get('chapter_stats', {}))
    subject_stats = to_list(analysis.get('subject_stats', {}))
    # Ensure names keys are strings
    for cat in ['topics','chapters','subjects']:
        if cat in names:
            names[cat] = {str(k): v for k, v in names[cat].items()}
    # Ensure responses/statuses keys are strings
    responses = {str(k): v for k, v in responses.items()}
    statuses  = {str(k): v for k, v in statuses.items()}
    priorities = {str(k): v for k, v in priorities.items()}

    type_labels  = {'topic':'Topic Wise','chapter':'Chapter Wise','subject':'Subject Wise','full':'Full Mock Test'}
    test_label   = type_labels.get(test_type, test_type.title())
    now_str      = datetime.now().strftime('%d %B %Y, %I:%M %p')

    # ══════════════════════════════════════════════
    # PAGE 1: HEADER BANNER
    # ══════════════════════════════════════════════
    header_data = [[
        Paragraph('<b>DDCETPrepHub</b>', S['title']),
        Paragraph(f'Score: <b>{o.get("score",0)}/{o.get("max_score",0)}</b>', S['title']),
    ],[
        Paragraph(f'Diagnostic Analysis Report  |  {test_label}', S['sub']),
        Paragraph(f'Accuracy: <b>{o.get("accuracy",0)}%</b>  |  {now_str}', S['sub']),
    ]]
    header_tbl = Table(header_data, colWidths=[W*0.6, W*0.4])
    header_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('TEXTCOLOR',  (0,0), (-1,-1), colors.white),
        ('TOPPADDING',    (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING',   (0,0), (-1,-1), 16),
        ('RIGHTPADDING',  (0,0), (-1,-1), 16),
        ('ROUNDEDCORNERS', (0,0), (-1,-1), [8,8,8,8]),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 6*mm))

    # ── Performance Summary Grid ──────────────────
    grade = 'A+' if o.get('accuracy',0)>=80 else ('A' if o.get('accuracy',0)>=65 else ('B' if o.get('accuracy',0)>=50 else ('C' if o.get('accuracy',0)>=35 else 'D')))
    grade_labels = {'A+':'Excellent','A':'Great Work','B':'Good Effort','C':'Keep Going','D':'Keep Studying'}

    stats_data = [[
        Paragraph(f'<b>Grade: {grade}</b><br/>{grade_labels.get(grade,"")}', S['center']),
        Paragraph(f'<b>{o.get("score",0)}</b><br/>/ {o.get("max_score",0)} marks', S['center']),
        Paragraph(f'<b>{o.get("accuracy",0)}%</b><br/>Accuracy', S['center']),
        Paragraph(f'<b>{o.get("correct",0)}</b> Correct<br/><b>{o.get("wrong",0)}</b> Wrong<br/><b>{o.get("skipped",0)}</b> Skipped', S['center']),
        Paragraph(f'<b>{o.get("time_str","--")}</b> taken<br/>{o.get("total",0)} Questions<br/>{o.get("avg_time_sec",0)}s/q', S['center']),
    ]]
    stats_tbl = Table(stats_data, colWidths=[W/5]*5)
    stats_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#fef3c7')),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor('#dcfce7')),
        ('BACKGROUND', (3,0), (3,0), colors.HexColor('#f0fdf4')),
        ('BOX',        (0,0), (-1,-1), 1, SOFTGRAY),
        ('INNERGRID',  (0,0), (-1,-1), 0.5, SOFTGRAY),
        ('TOPPADDING',    (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [LIGHTBG]),
    ]))
    story.append(stats_tbl)
    story.append(Spacer(1, 4*mm))

    # ── Exam Readiness ────────────────────────────
    rd_level = readiness.get('level','—')
    rd_desc  = readiness.get('desc','')
    rd_pct   = readiness.get('pct', 0)
    rd_tbl   = Table([[
        Paragraph(f'<b>Exam Readiness Prediction</b><br/><font size=13 color="{readiness.get("color","#d97706")}"><b>{rd_level}</b></font><br/><font size=9>{rd_desc}</font>', S['body']),
        Paragraph(f'<b>{rd_pct}%</b><br/>Readiness Score', S['center']),
    ]], colWidths=[W*0.78, W*0.22])
    rd_tbl.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 2, colors.HexColor(readiness.get('color','#d97706'))),
        ('TOPPADDING',    (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING',   (0,0), (0,0),  16),
        ('RIGHTPADDING',  (-1,0),(-1,0), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN',  (1,0), (1,0), 'CENTER'),
    ]))
    story.append(rd_tbl)

    # ══════════════════════════════════════════════
    # SECTION: AI INSIGHTS
    # ══════════════════════════════════════════════
    story += section_header('💡  AI-Generated Learning Insights', S)
    story.append(Paragraph('Based strictly on questions assessed — not generic syllabus assumptions.', S['small']))
    story.append(Spacer(1, 3*mm))

    INS_BG = {'success': colors.HexColor('#f0fdf4'), 'warning': colors.HexColor('#fffbeb'), 'danger': colors.HexColor('#fff1f2')}
    INS_BD = {'success': GREEN, 'warning': YELLOW, 'danger': RED}
    for ins in insights:
        bg = INS_BG.get(ins.get('type','warning'), LIGHTBG)
        bd = INS_BD.get(ins.get('type','warning'), YELLOW)
        icon = ins.get('icon','•')
        text = ins.get('text','')
        ins_tbl = Table([[Paragraph(f'{icon}  {text}', S['insight'])]], colWidths=[W])
        ins_tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), bg),
            ('LINEBEFORE',   (0,0), (0,-1), 4, bd),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING',   (0,0), (-1,-1), 12),
            ('RIGHTPADDING',  (0,0), (-1,-1), 10),
        ]))
        story.append(ins_tbl)
        story.append(Spacer(1, 2*mm))

    # ── Learning Priority Index ───────────────────
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph('🎯  Learning Priority Index  (Priority = (1 − accuracy) × attempts — study rank #1 first)', S['h2']))

    sorted_topics = sorted(topic_stats, key=lambda t: priorities.get(str(t['topic_id']), 0), reverse=True)
    pri_rows = [['#', 'Topic', 'Attempted', 'Correct', 'Accuracy', 'Status']]
    for rank, t in enumerate(sorted_topics, 1):
        tid   = str(t['topic_id'])
        tname = names.get('topics', {}).get(str(t['topic_id']), f"Topic #{tid}")
        acc   = t.get('accuracy', 0)
        heat  = t.get('heat', 'cold')
        pri_rows.append([
            str(rank),
            tname[:40],
            str(t.get('attempted',0)),
            str(t.get('correct',0)),
            f"{acc}%",
            heat_label(heat),
        ])
    pri_tbl = Table(pri_rows, colWidths=[8*mm, W*0.45, 20*mm, 18*mm, 20*mm, 22*mm])
    pri_style = [
        ('BACKGROUND',   (0,0), (-1,0), NAVY),
        ('TEXTCOLOR',    (0,0), (-1,0), colors.white),
        ('FONTNAME',     (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',     (0,0), (-1,-1), 9),
        ('ALIGN',        (0,0), (-1,-1), 'CENTER'),
        ('ALIGN',        (1,0), (1,-1), 'LEFT'),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHTBG]),
        ('GRID', (0,0), (-1,-1), 0.5, SOFTGRAY),
    ]
    # Color accuracy cells
    for i, t in enumerate(sorted_topics, 1):
        acc = t.get('accuracy', 0)
        bg  = colors.HexColor('#f0fdf4') if acc>=75 else (colors.HexColor('#fffbeb') if acc>=40 else colors.HexColor('#fff1f2'))
        pri_style.append(('BACKGROUND', (4,i), (4,i), bg))
        pri_style.append(('TEXTCOLOR',  (4,i), (4,i), get_acc_color(acc)))
        pri_style.append(('FONTNAME',   (4,i), (4,i), 'Helvetica-Bold'))
        # Heat status cell
        heat = t.get('heat','cold')
        pri_style.append(('BACKGROUND', (5,i), (5,i), HEAT_COLORS.get(heat, colors.white)))
        pri_style.append(('TEXTCOLOR',  (5,i), (5,i), HEAT_TEXT.get(heat, TEXTDARK)))
    pri_tbl.setStyle(TableStyle(pri_style))
    story.append(pri_tbl)

    # ══════════════════════════════════════════════
    # SECTION: TOPIC HEATMAP
    # ══════════════════════════════════════════════
    story += section_header('🔥  Topic Performance Heatmap', S)
    story.append(Paragraph('Evidence-based assessment — only topics that appeared in this test are shown.', S['small']))
    story.append(Spacer(1, 3*mm))

    cols = 4
    heat_rows = []
    row = []
    for i, t in enumerate(sorted_topics):
        tid   = str(t['topic_id'])
        tname = names.get('topics', {}).get(str(t['topic_id']), f"Topic #{tid}")
        heat  = t.get('heat','cold')
        acc   = t.get('accuracy', 0)
        cell  = Table([[Paragraph(f'<b>{tname[:22]}</b>', ParagraphStyle('hn', fontSize=9, fontName='Helvetica-Bold', textColor=HEAT_TEXT.get(heat, TEXTDARK), alignment=TA_CENTER))],
                       [Paragraph(f'<b>{acc}%</b>', ParagraphStyle('ha', fontSize=14, fontName='Helvetica-Bold', textColor=HEAT_TEXT.get(heat, TEXTDARK), alignment=TA_CENTER))],
                       [Paragraph(f'{t.get("correct",0)}/{t.get("attempted",0)} correct', ParagraphStyle('hs', fontSize=8, fontName='Helvetica', textColor=HEAT_TEXT.get(heat, TEXTDARK), alignment=TA_CENTER))],
                       [Paragraph(heat_label(heat), ParagraphStyle('hl', fontSize=8, fontName='Helvetica-Bold', textColor=HEAT_TEXT.get(heat, TEXTDARK), alignment=TA_CENTER))],
                       ], colWidths=[(W - (cols-1)*2*mm)/cols])
        cell.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HEAT_COLORS.get(heat, colors.white)),
            ('TOPPADDING',    (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING',   (0,0), (-1,-1), 4),
            ('RIGHTPADDING',  (0,0), (-1,-1), 4),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        row.append(cell)
        if len(row) == cols:
            heat_rows.append(row)
            row = []
    if row:
        while len(row) < cols:
            row.append(Paragraph('', S['body']))
        heat_rows.append(row)

    if heat_rows:
        cell_w = (W - (cols-1)*2*mm) / cols
        heat_tbl = Table(heat_rows, colWidths=[cell_w]*cols, hAlign='LEFT')
        heat_tbl.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING',    (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING',   (0,0), (-1,-1), 2),
            ('RIGHTPADDING',  (0,0), (-1,-1), 2),
        ]))
        story.append(heat_tbl)

    # ══════════════════════════════════════════════
    # SECTION: CHAPTER ANALYSIS
    # ══════════════════════════════════════════════
    if chapter_stats:
        story += section_header('📚  Chapter Performance Analysis', S)
        ch_rows = [['Chapter', 'Subject', 'Total', 'Correct', 'Wrong', 'Accuracy', 'Status']]
        sorted_chapters = sorted(chapter_stats, key=lambda c: c.get('accuracy', 0))
        for c in sorted_chapters:
            cid   = str(c['chapter_id'])
            cname = names.get('chapters', {}).get(cid, f"Chapter #{cid}")
            sid   = str(c.get('subject_id', 0))
            sname = names.get('subjects', {}).get(sid, '—')
            acc   = c.get('accuracy', 0)
            ch_rows.append([
                cname[:35], sname[:20],
                str(c.get('total',0)), str(c.get('correct',0)), str(c.get('wrong',0)),
                f"{acc}%", c.get('label','—'),
            ])
        ch_tbl = Table(ch_rows, colWidths=[W*0.3, W*0.18, 14*mm, 16*mm, 14*mm, 18*mm, 18*mm])
        ch_style = [
            ('BACKGROUND',    (0,0), (-1,0), NAVY),
            ('TEXTCOLOR',     (0,0), (-1,0), colors.white),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 9),
            ('ALIGN',         (2,0), (-1,-1), 'CENTER'),
            ('ALIGN',         (0,0), (1,-1), 'LEFT'),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, LIGHTBG]),
            ('GRID',          (0,0), (-1,-1), 0.5, SOFTGRAY),
        ]
        for i, c in enumerate(sorted_chapters, 1):
            acc  = c.get('accuracy', 0)
            bg   = colors.HexColor('#f0fdf4') if acc>=75 else (colors.HexColor('#fffbeb') if acc>=40 else colors.HexColor('#fff1f2'))
            clr  = get_acc_color(acc)
            ch_style += [
                ('BACKGROUND', (5,i), (5,i), bg),
                ('TEXTCOLOR',  (5,i), (5,i), clr),
                ('FONTNAME',   (5,i), (5,i), 'Helvetica-Bold'),
            ]
        ch_tbl.setStyle(TableStyle(ch_style))
        story.append(ch_tbl)

        # Chapter insights
        story.append(Spacer(1, 4*mm))
        for c in sorted_chapters:
            cid   = str(c['chapter_id'])
            cname = names.get('chapters', {}).get(cid, f"Chapter #{cid}")
            ins_t = Table([[
                Paragraph(f'<b>{cname}</b> — {c.get("accuracy",0)}%', S['bold']),
                Paragraph(c.get('insight', ''), S['insight']),
            ]], colWidths=[W*0.28, W*0.72])
            ins_t.setStyle(TableStyle([
                ('LINEAFTER',    (0,0), (0,-1), 2, get_acc_color(c.get('accuracy',0))),
                ('TOPPADDING',    (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING',   (0,0), (-1,-1), 8),
                ('BACKGROUND',    (0,0), (-1,-1), LIGHTBG),
                ('VALIGN',        (0,0), (-1,-1), 'TOP'),
            ]))
            story.append(ins_t)
            story.append(Spacer(1, 2*mm))

    # ══════════════════════════════════════════════
    # SECTION: DIFFICULTY BREAKDOWN
    # ══════════════════════════════════════════════
    if len(diff_stats) > 1:
        story += section_header('📊  Difficulty Level Performance', S)
        diff_order = ['easy','moderate','hard','advanced','tricky']
        diff_rows  = [['Difficulty', 'Total Qs', 'Attempted', 'Correct', 'Accuracy', 'Insight']]
        for d in diff_order:
            if d not in diff_stats: continue
            ds  = diff_stats[d]
            acc = ds.get('accuracy', 0)
            diff_rows.append([
                d.title(),
                str(ds.get('total',0)),
                str(ds.get('attempted',0)),
                str(ds.get('correct',0)),
                f"{acc}%",
                ds.get('insight','')[:60],
            ])
        diff_tbl = Table(diff_rows, colWidths=[20*mm, 17*mm, 20*mm, 17*mm, 17*mm, W - 91*mm])
        diff_style = [
            ('BACKGROUND',    (0,0), (-1,0), NAVY),
            ('TEXTCOLOR',     (0,0), (-1,0), colors.white),
            ('FONTNAME',      (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE',      (0,0), (-1,-1), 9),
            ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
            ('ALIGN',         (5,0), (5,-1), 'LEFT'),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [colors.white, LIGHTBG]),
            ('GRID',          (0,0), (-1,-1), 0.5, SOFTGRAY),
        ]
        for i, d in enumerate([x for x in diff_order if x in diff_stats], 1):
            acc = diff_stats[d].get('accuracy', 0)
            bg  = DIFF_COLORS.get(d, LIGHTBG)
            diff_style += [
                ('BACKGROUND', (0,i), (0,i), bg),
                ('BACKGROUND', (4,i), (4,i), colors.HexColor('#f0fdf4') if acc>=75 else (colors.HexColor('#fffbeb') if acc>=40 else colors.HexColor('#fff1f2'))),
                ('TEXTCOLOR',  (4,i), (4,i), get_acc_color(acc)),
                ('FONTNAME',   (4,i), (4,i), 'Helvetica-Bold'),
            ]
        diff_tbl.setStyle(TableStyle(diff_style))
        story.append(diff_tbl)

    # ══════════════════════════════════════════════
    # SECTION: STUDY PLAN
    # ══════════════════════════════════════════════
    story.append(PageBreak())
    story += section_header('🗺️  Personalized 3-Step Improvement Plan', S)
    story.append(Paragraph('Generated from your actual test performance — not generic advice.', S['small']))
    story.append(Spacer(1, 3*mm))

    PLAN_BG = {1: colors.HexColor('#fff1f2'), 2: colors.HexColor('#eff6ff'), 3: colors.HexColor('#faf5ff')}
    PLAN_BD = {1: RED, 2: colors.HexColor('#2563eb'), 3: PURPLE}
    for step in plan:
        sn  = step.get('step', 1)
        bg  = PLAN_BG.get(sn, LIGHTBG)
        bd  = PLAN_BD.get(sn, NAVY)
        tbl = Table([[
            Paragraph(f'STEP {sn}', ParagraphStyle('sn', fontSize=8, fontName='Helvetica-Bold', textColor=colors.white, alignment=TA_CENTER)),
            Table([
                [Paragraph(f'{step.get("icon","•")} {step.get("title","")}', S['bold'])],
                [Paragraph(step.get('desc',''), S['insight'])],
            ], colWidths=[W*0.82])
        ]], colWidths=[16*mm, W*0.82])
        tbl.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (0,0), bd),
            ('BACKGROUND',   (1,0), (1,0), bg),
            ('LINEBEFORE',   (0,0), (0,0), 1, bd),
            ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN',        (0,0), (0,0), 'CENTER'),
            ('TOPPADDING',    (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING',   (1,0), (1,0), 12),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 3*mm))

    # Priority improvement area
    cold_topics = [t for t in topic_stats if t.get('heat') == 'cold']
    if cold_topics:
        lowest = min(cold_topics, key=lambda t: t.get('accuracy', 100))
        lt_name = names.get('topics',{}).get(str(lowest['topic_id']), f"Topic #{lowest['topic_id']}")
        lc_name = names.get('chapters',{}).get(str(lowest['chapter_id']), f"Chapter #{lowest['chapter_id']}")
        prio_tbl = Table([[Paragraph(
            f'<b>Most Urgent Study Area: {lt_name}</b> in {lc_name}<br/>'
            f'Accuracy: <b>{lowest.get("accuracy",0)}%</b>  |  {lowest.get("attempted",0)} attempted  |  {lowest.get("correct",0)} correct<br/><br/>'
            f'<b>Recommended:</b> Revise {lt_name} theory → watch concept video → solve 10 basic problems → re-test.',
            S['insight']
        )]], colWidths=[W])
        prio_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fff1f2')),
            ('LINEBEFORE',  (0,0), (0,-1), 4, RED),
            ('TOPPADDING',    (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING',   (0,0), (-1,-1), 16),
        ]))
        story.append(prio_tbl)

    # ══════════════════════════════════════════════
    # SECTION: ANSWER KEY + REVIEW
    # ══════════════════════════════════════════════
    story.append(PageBreak())
    story += section_header('📋  Answer Key & Question Review', S)

    # Quick answer key grid
    story.append(Paragraph('Quick Reference Answer Key', S['h2']))
    qk_cols = 8
    qk_rows = []
    qk_row  = [['Q', 'Ans', 'Result']]
    qk_batch= []
    for idx, q in enumerate(questions):
        qid      = str(q.get('id',''))
        selected = responses.get(qid, '')
        status   = statuses.get(qid, 'not_visited')
        is_cor   = (selected != '' and selected == q.get('correct_answer',''))
        is_skip  = (not selected or status in ['skipped','not_visited'])
        icon     = '✓' if is_cor else ('✗' if not is_skip else '-')
        bg       = colors.HexColor('#f0fdf4') if is_cor else (colors.HexColor('#fff1f2') if not is_skip else LIGHTBG)
        qk_batch.append((idx+1, q.get('correct_answer','?'), icon, bg, is_cor, is_skip))

    # 8-column grid
    qk_header = ['Q#', 'Ans', 'Result'] * min(qk_cols, len(qk_batch))
    cell_rows  = []
    qk_row     = []
    for i, (qnum, ans, icon, bg, ic, sk) in enumerate(qk_batch):
        qk_row.append([
            Paragraph(str(qnum), ParagraphStyle('qn', fontSize=8, fontName='Helvetica', alignment=TA_CENTER, textColor=TEXTGRAY)),
            Paragraph(f'<b>{ans}</b>', ParagraphStyle('qa', fontSize=11, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=GREEN if ic else (RED if not sk else TEXTGRAY))),
            Paragraph(icon, ParagraphStyle('qi', fontSize=9, fontName='Helvetica-Bold', alignment=TA_CENTER, textColor=GREEN if ic else (RED if not sk else TEXTGRAY))),
        ])
        if len(qk_row) == qk_cols:
            cell_rows.append(qk_row)
            qk_row = []
    if qk_row:
        while len(qk_row) < qk_cols:
            qk_row.append([Paragraph('', S['body'])]*3)
        cell_rows.append(qk_row)

    for cr in cell_rows:
        flat  = [cell for group in cr for cell in group]
        widths= [8*mm, 10*mm, 10*mm] * qk_cols
        row_t = Table([flat], colWidths=widths)
        row_t.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, SOFTGRAY),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(row_t)
    story.append(Spacer(1, 6*mm))

    # Detailed review
    story.append(Paragraph('Detailed Question Review', S['h2']))
    story.append(Spacer(1, 2*mm))

    for idx, q in enumerate(questions):
        qid      = str(q.get('id',''))
        selected = responses.get(qid,'')
        status   = statuses.get(qid,'not_visited')
        is_cor   = (selected != '' and selected == q.get('correct_answer',''))
        is_wrong = (selected != '' and selected != q.get('correct_answer',''))
        is_skip  = (not selected or status in ['skipped','not_visited'])
        card_bg  = colors.HexColor('#f0fdf4') if is_cor else (colors.HexColor('#fff1f2') if is_wrong else LIGHTBG)
        bd_color = GREEN if is_cor else (RED if is_wrong else SOFTGRAY)
        result   = '✓ Correct' if is_cor else ('✗ Wrong' if is_wrong else '— Skipped')

        diff  = q.get('difficulty','easy')
        tname = names.get('topics',{}).get(str(q.get('topic_id','')), '')

        q_elements = []

        # Meta row
        meta_text = f'Q{idx+1}  |  {diff.title()}  |  {result}'
        if tname: meta_text += f'  |  {tname}'
        q_elements.append(Paragraph(meta_text, ParagraphStyle('qmeta', fontSize=8.5, fontName='Helvetica-Bold',
            textColor=GREEN if is_cor else (RED if is_wrong else TEXTGRAY), spaceAfter=4)))

        # Question text
        q_elements.append(Paragraph(q.get('question_text',''), S['q_text']))

        # Options
        for letter in ['A','B','C','D']:
            opt_text = q.get(f'option_{letter.lower()}', '')
            is_ca    = (letter == q.get('correct_answer',''))
            is_sa    = (letter == selected)
            bg_opt   = colors.HexColor('#f0fdf4') if is_ca else (colors.HexColor('#fff1f2') if is_sa and is_wrong else colors.white)
            tag      = ' ← Correct Answer' if is_ca else (' ← Your Answer' if is_sa and is_wrong else '')
            opt_p    = Paragraph(f'<b>{letter}.</b>  {opt_text}{tag}',
                ParagraphStyle('opt', fontSize=9, fontName='Helvetica-Bold' if is_ca else 'Helvetica',
                    textColor=GREEN if is_ca else (RED if is_sa and is_wrong else TEXTMID), spaceAfter=2, leftIndent=8))
            opt_row  = Table([[opt_p]], colWidths=[W - 10*mm])
            opt_row.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), bg_opt),
                ('TOPPADDING',    (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ]))
            q_elements.append(opt_row)

        # Explanation
        expl = q.get('explanation', 'No explanation available.')
        q_elements.append(Spacer(1, 2*mm))
        expl_tbl = Table([[Paragraph(f'Explanation: {expl}', S['expl'])]], colWidths=[W - 10*mm])
        expl_tbl.setStyle(TableStyle([
            ('BACKGROUND',  (0,0), (-1,-1), LIGHTBLUE),
            ('LINEBEFORE',  (0,0), (0,-1), 3, colors.HexColor('#3b82f6')),
            ('TOPPADDING',    (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ]))
        q_elements.append(expl_tbl)

        # Wrap in card
        card = Table([[el] for el in q_elements], colWidths=[W - 8*mm])
        card.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), card_bg),
            ('LINEBEFORE',   (0,0), (0,-1), 5, bd_color),
            ('TOPPADDING',    (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('RIGHTPADDING',  (0,0), (-1,-1), 8),
        ]))
        story.append(KeepTogether([card, Spacer(1, 4*mm)]))

    # ── Footer page ──────────────────────────────
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width='100%', thickness=1, color=SOFTGRAY))
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        f'DDCETPrepHub · Diagnostic Analysis Report · Generated {now_str}',
        ParagraphStyle('footer', fontSize=9, fontName='Helvetica', textColor=TEXTGRAY, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        'Evidence-based learning diagnostics — analysis based only on questions actually assessed.',
        ParagraphStyle('footer2', fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#94a3b8'), alignment=TA_CENTER, spaceBefore=2)
    ))

    doc.build(story)
    print(f'PDF generated: {output_path}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 generate_pdf.py <input_json> <output_pdf>')
        sys.exit(1)
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        data = json.load(f)
    generate_pdf(data, sys.argv[2])