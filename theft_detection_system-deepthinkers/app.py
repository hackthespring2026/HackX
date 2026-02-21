import streamlit as st
import cv2
import tempfile
import os
import time
import zipfile
import csv
from datetime import datetime
from ultralytics import YOLO
from glob import glob
import pandas as pd

# =========================
# CONFIG
# =========================

MODEL_PATH = "models/best2.pt"
OUTPUT_VIDEO = "output_detected.mp4"
THEFT_COOLDOWN = 3
FRAME_SKIP = 2

# =========================
# HELPERS
# =========================

def create_video_evidence_dirs(video_name):
    base_name = os.path.splitext(video_name)[0]
    video_evidence_dir = os.path.join("evidence", base_name)
    common_evidence_dir = os.path.join("evidence", "common")

    os.makedirs(video_evidence_dir, exist_ok=True)
    os.makedirs(common_evidence_dir, exist_ok=True)

    return video_evidence_dir, common_evidence_dir


def log_theft(video_evidence_dir, frame_number, real_timestamp):
    log_file = os.path.join(video_evidence_dir, "theft_report.csv")
    file_exists = os.path.isfile(log_file)

    with open(log_file, "a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "Frame"])
        writer.writerow([real_timestamp, frame_number])


@st.cache_resource
def load_model():
    return YOLO(MODEL_PATH)

model = load_model()

# =========================
# PAGE CONFIG
# =========================

st.set_page_config(page_title="AI Theft Detection", page_icon="🚨", layout="wide")

# =========================
# CSS
# =========================

st.markdown("""
<style>
.metric-card {
    background-color: #1C1F26;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
}
.alert-banner {
    background-color: #FF4B4B;
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
}
.safe-banner {
    background-color: #00C853;
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
}
</style>
""", unsafe_allow_html=True)

# =========================
# HEADER
# =========================

st.title("🚨 AI Theft Detection Control Room")

st.sidebar.header("⚙ System Settings")

conf_threshold = st.sidebar.slider("Detection Confidence", 0.1, 1.0, 0.5, 0.05)
save_common = st.sidebar.checkbox("Save to Global Evidence Database", True)

uploaded_file = st.file_uploader("📂 Upload Surveillance Video", type=["mp4", "avi", "mov"])

# =========================
# SESSION STATE INIT
# =========================

if "analysis_done" not in st.session_state:
    st.session_state.analysis_done = False

if "analysis_started" not in st.session_state:
    st.session_state.analysis_started = False

if "timeline_data" not in st.session_state:
    st.session_state.timeline_data = []

# =========================
# NAVBAR
# =========================

tab1, tab2, tab3, tab4 = st.tabs([
    "🎥 Live Analysis",
    "📊 Timeline Graph",
    "📜 CSV Report",
    "📸 Evidence Archive"
])

# =========================
# MAIN LOGIC
# =========================

if uploaded_file:

    video_name = uploaded_file.name

    temp_video = tempfile.NamedTemporaryFile(delete=False)
    temp_video.write(uploaded_file.read())

    video_evidence_dir, common_evidence_dir = create_video_evidence_dirs(video_name)

    # =========================
    # TAB 1 — LIVE ANALYSIS
    # =========================

    with tab1:

        st.video(uploaded_file)

        # ✅ Button hides after click
        if not st.session_state.analysis_done and not st.session_state.analysis_started:
            if st.button("▶ START ANALYSIS"):
                st.session_state.analysis_started = True
                st.rerun()

        if st.session_state.analysis_started and not st.session_state.analysis_done:

            cap = cv2.VideoCapture(temp_video.name)

            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(OUTPUT_VIDEO, fourcc, fps, (width, height))

            progress_bar = st.progress(0)

            alert_placeholder = st.empty()
            frame_placeholder = st.empty()
            evidence_placeholder = st.empty()

            col1, col2 = st.columns(2)
            theft_metric = col1.empty()
            frame_metric = col2.empty()

            frame_count = 0
            theft_count = 0
            last_theft_time = 0
            theft_flag = False

            st.session_state.timeline_data = []

            while cap.isOpened():

                ret, frame = cap.read()
                if not ret:
                    break

                frame_count += 1

                if frame_count % FRAME_SKIP != 0:
                    continue

                theft_detected = False

                results = model(frame, verbose=False)

                for r in results:
                    for box in r.boxes:
                        if float(box.conf[0]) < conf_threshold:
                            continue
                        cls = int(box.cls[0])
                        label = model.names[cls]
                        if label == "theft":
                            theft_detected = True

                real_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

                # ALERT UI
                if theft_detected:
                    alert_placeholder.markdown('<div class="alert-banner">🚨 THEFT DETECTED</div>', unsafe_allow_html=True)
                else:
                    alert_placeholder.markdown('<div class="safe-banner">✅ AREA SECURE</div>', unsafe_allow_html=True)

                current_time = time.time()

                if theft_detected:

                    if not theft_flag:
                        theft_count += 1
                        st.toast(f"Theft Event at {real_timestamp}")

                    theft_flag = True

                    if current_time - last_theft_time > THEFT_COOLDOWN:

                        video_filename = os.path.join(video_evidence_dir, f"theft_{frame_count}.jpg")
                        cv2.imwrite(video_filename, frame)

                        log_theft(video_evidence_dir, frame_count, real_timestamp)

                        if save_common:
                            common_filename = os.path.join(common_evidence_dir, f"theft_{video_name}_{frame_count}.jpg")
                            cv2.imwrite(common_filename, frame)

                        last_theft_time = current_time

                else:
                    theft_flag = False

                # METRICS
                theft_metric.markdown(
                    f'<div class="metric-card"><h4>🚨 Theft Events</h4><h2>{theft_count}</h2></div>',
                    unsafe_allow_html=True
                )

                frame_metric.markdown(
                    f'<div class="metric-card"><h4>🎞 Frame</h4><h2>{frame_count}</h2></div>',
                    unsafe_allow_html=True
                )

                st.session_state.timeline_data.append({
                    "Timestamp": real_timestamp,
                    "Theft": int(theft_detected)
                })

                # Evidence preview
                evidence_images = sorted(glob(f"{video_evidence_dir}/*.jpg"))
                if theft_detected and evidence_images:
                    evidence_placeholder.image(evidence_images[-1], width=300)
                else:
                    evidence_placeholder.empty()

                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame_placeholder.image(frame_rgb)

                out.write(frame)
                progress_bar.progress(min(frame_count / total_frames, 1.0))

            cap.release()
            out.release()

            st.session_state.analysis_done = True
            st.success("✅ Analysis Completed Successfully 🎉")

        elif st.session_state.analysis_done:
            st.success("✅ Analysis already completed")
            st.video(OUTPUT_VIDEO)

    # =========================
    # TAB 2 — TIMELINE
    # =========================

    with tab2:

        if st.session_state.timeline_data:
            df = pd.DataFrame(st.session_state.timeline_data)
            st.line_chart(df.set_index("Timestamp"))
        else:
            st.info("Run analysis to generate timeline")

    # =========================
    # TAB 3 — CSV REPORT
    # =========================

    with tab3:

        csv_report = os.path.join(video_evidence_dir, "theft_report.csv")

        if os.path.exists(csv_report):

            df_report = pd.read_csv(csv_report)
            st.dataframe(df_report, use_container_width=True)

            st.download_button(
                "⬇ Download CSV Report",
                data=open(csv_report, "rb"),
                file_name="theft_report.csv"
            )
        else:
            st.info("No CSV report available")

    # =========================
    # TAB 4 — EVIDENCE ARCHIVE
    # =========================

    with tab4:

        evidence_images = sorted(glob(f"{video_evidence_dir}/*.jpg"))

        if evidence_images:

            st.image(evidence_images, width=150)

            zip_path = f"{video_evidence_dir}.zip"

            with zipfile.ZipFile(zip_path, "w") as zipf:
                for img in evidence_images:
                    zipf.write(img)

            st.download_button(
                "📦 Download Evidence ZIP",
                data=open(zip_path, "rb"),
                file_name="evidence.zip"
            )

        else:
            st.info("No evidence images found")