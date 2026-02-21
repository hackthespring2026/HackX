from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import time
import subprocess
import sys
import os
from collections import deque


app = Flask(__name__)

# Use a local SQLite database file inside the project so the DB is created here.
db_file = os.path.join(os.path.dirname(__file__), 'hts_project.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_file}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# SQLAlchemy DB
db = SQLAlchemy(app)

# In-memory latest alert store (simple realtime flag)
latest_alert = {"type": None, "details": {}, "ts": None}

# store recent alerts in-memory (most recent first)
latest_alerts = deque(maxlen=200)

# Detection process handle
detection_proc = None
detection_log_handle = None


# ORM model for drawer logs
class DrawerLog(db.Model):
    __tablename__ = 'drawer_logs'
    id = db.Column(db.Integer, primary_key=True)
    event = db.Column(db.String(255))
    reason = db.Column(db.String(255))
    product = db.Column(db.String(255))
    quantity = db.Column(db.Integer)
    amount = db.Column(db.Float)
    timestamp = db.Column(db.DateTime)


def check_drawer_condition():
    """Return authorization status comparing latest POS log and (placeholder) yolo drawer state."""
    yolo_drawer = "open"   # static value for now

    result = DrawerLog.query.order_by(DrawerLog.timestamp.desc()).first()
    if not result:
        return "UNAUTHORIZED - NO POS LOG"

    event = result.event
    if event != "drawer open":
        return "UNAUTHORIZED - INVALID EVENT"

    if result and yolo_drawer == "open":
        pos_timestamp = result.timestamp
        current_time = datetime.now()
        time_difference = (current_time - pos_timestamp).total_seconds()
        print("Time Difference:", time_difference)
        if time_difference <= 5:
            return "AUTHORIZED"
        else:
            return "UNAUTHORIZED"

    return "NO DATA"


# Routes
@app.route('/')
def home():
    return render_template('dashboard.html')


@app.route('/submit', methods=['POST'])
def submit():
    event = request.form.get('event')
    reason = request.form.get('reason')
    product = request.form.get('product')
    quantity = request.form.get('quantity')
    amount = request.form.get('amount')

    timestamp = datetime.now()

    log = DrawerLog(
        event=event,
        reason=reason,
        product=product,
        quantity=int(quantity) if quantity else None,
        amount=float(amount) if amount else None,
        timestamp=timestamp
    )
    db.session.add(log)
    db.session.commit()

    status = check_drawer_condition()
    print("Drawer Status:", status)

    return f"Data Inserted Successfully | Drawer Status: {status}"


@app.route('/history')
def history():
    logs = DrawerLog.query.order_by(DrawerLog.timestamp.desc()).all()
    return render_template('history.html', logs=logs)


@app.route('/alert', methods=['GET', 'POST'])
def alert():
    if request.method == 'POST':
        try:
            data = request.get_json(force=True)
        except Exception:
            data = {}

        latest_alert['type'] = data.get('type')
        latest_alert['details'] = data.get('details', {})
        latest_alert['ts'] = datetime.now()
        latest_alerts.appendleft({
            'type': latest_alert['type'],
            'details': latest_alert['details'],
            'ts': latest_alert['ts']
        })
        return ('', 204)

    return render_template('alert.html', latest=latest_alert)


@app.route('/status')
def status():
    now = datetime.now()
    active = False
    if latest_alert['ts']:
        delta = (now - latest_alert['ts']).total_seconds()
        active = delta <= 6

    return jsonify({
        'alert': active,
        'type': latest_alert.get('type'),
        'details': latest_alert.get('details', {})
    })


@app.route('/start_detection', methods=['POST'])
def start_detection():
    global detection_proc
    global detection_log_handle
    if detection_proc and detection_proc.poll() is None:
        return jsonify({'status': 'already_running', 'pid': detection_proc.pid})

    script_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'theft_mvp_realtime2.py'))
    if not os.path.exists(script_path):
        return jsonify({'status': 'error', 'error': 'script not found', 'path': script_path}), 500

    try:
        # ensure logs dir exists
        project_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
        logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(logs_dir, exist_ok=True)
        log_path = os.path.join(logs_dir, 'detection.log')
        detection_log_handle = open(log_path, 'a', buffering=1)

        detection_proc = subprocess.Popen(
            [sys.executable, script_path],
            stdout=detection_log_handle,
            stderr=subprocess.STDOUT,
            cwd=project_root
        )
        return jsonify({'status': 'started', 'pid': detection_proc.pid, 'log': log_path})
    except Exception as e:
        detection_proc = None
        if detection_log_handle:
            try:
                detection_log_handle.close()
            except Exception:
                pass
        detection_log_handle = None
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.route('/script_info')
def script_info():
    script_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'theft_mvp_realtime2.py'))
    project_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..'))
    return jsonify({
        'script_path': script_path,
        'exists': os.path.exists(script_path),
        'project_root': project_root,
        'cwd': os.getcwd()
    })


@app.route('/stop_detection', methods=['POST'])
def stop_detection():
    global detection_proc
    global detection_log_handle
    if not detection_proc:
        return jsonify({'status': 'not_running'})

    if detection_proc.poll() is None:
        try:
            detection_proc.terminate()
            detection_proc.wait(timeout=3)
        except Exception:
            try:
                detection_proc.kill()
            except Exception:
                pass

    pid = detection_proc.pid
    detection_proc = None
    if detection_log_handle:
        try:
            detection_log_handle.close()
        except Exception:
            pass
    detection_log_handle = None
    return jsonify({'status': 'stopped', 'pid': pid})


@app.route('/detection_status')
def detection_status():
    running = False
    pid = None
    if detection_proc and detection_proc.poll() is None:
        running = True
        pid = detection_proc.pid
    return jsonify({'running': running, 'pid': pid})


@app.route('/clear_alert', methods=['POST'])
def clear_alert():
    latest_alert['type'] = None
    latest_alert['details'] = {}
    latest_alert['ts'] = None
    return ('', 204)


@app.route('/alerts')
def alerts():
    out = []
    for a in list(latest_alerts):
        out.append({
            'type': a.get('type'),
            'details': a.get('details', {}),
            'ts': a.get('ts').isoformat() if a.get('ts') else None
        })
    return jsonify(out)


if __name__ == '__main__':
    # ensure tables exist (creates if not present)
    with app.app_context():
        db.create_all()
    app.run(debug=True)
