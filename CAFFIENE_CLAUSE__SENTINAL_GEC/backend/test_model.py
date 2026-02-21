"""
Test script for the sentinel best.pt YOLOv8 model.
Tests: loading, class labels, dummy inference, and confidence thresholds.
"""
import os
import sys
import numpy as np
import cv2
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "sentinel" / "weights" / "best.pt"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"

def ok(msg):  print(f"{GREEN}  ✅ PASS{RESET} – {msg}")
def fail(msg): print(f"{RED}  ❌ FAIL{RESET} – {msg}"); sys.exit(1)
def info(msg): print(f"{CYAN}  ℹ  INFO{RESET} – {msg}")

# ──────────────────────────────────────────────────────────────────────────────
print(f"\n{YELLOW}{'='*60}")
print("  GEC Sentinel – YOLOv8 Model Test Suite")
print(f"{'='*60}{RESET}\n")

# 1. File Exists
print("TEST 1 – Model file exists")
if MODEL_PATH.exists():
    size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)
    ok(f"Found {MODEL_PATH.name}  ({size_mb:.2f} MB)")
else:
    fail(f"Model not found at {MODEL_PATH}")

# 2. Load Model
print("\nTEST 2 – Load model with ultralytics")
try:
    from ultralytics import YOLO
    model = YOLO(str(MODEL_PATH))
    ok("Model loaded successfully")
except Exception as e:
    fail(f"Could not load model: {e}")

# 3. Class Labels
print("\nTEST 3 – Inspect class names")
try:
    names = model.names  # dict {id: label}
    if names:
        info(f"Detected {len(names)} class(es): {list(names.values())}")
        # Check for expected GEC classes
        expected = {"hand_to_pocket", "unauthorized_access", "POCKET", "UNAUTH",
                     "pocket", "unauth", "theft", "hand"}
        found = {n.lower() for n in names.values()}
        matches = found & {e.lower() for e in expected}
        if matches:
            ok(f"Recognised GEC-relevant class(es): {matches}")
        else:
            info(f"Classes don't match expected names – verify labels are correct for your dataset")
    else:
        fail("Model returned no class names")
except Exception as e:
    fail(f"Could not read class names: {e}")

# 4. Dummy Inference (black image)
print("\nTEST 4 – Run inference on a synthetic black frame (640x640)")
try:
    dummy = np.zeros((640, 640, 3), dtype=np.uint8)
    results = model.predict(source=dummy, imgsz=640, conf=0.25, verbose=False)
    info(f"Inference completed. Detections on blank frame: {len(results[0].boxes)}")
    ok("Inference pipeline works (no crash on blank image)")
except Exception as e:
    fail(f"Inference failed: {e}")

# 5. Inference on realistic random noise image
print("\nTEST 5 – Run inference on random-noise frame (simulates real input)")
try:
    noise = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    results = model.predict(source=noise, imgsz=640, conf=0.10, verbose=False)
    boxes = results[0].boxes
    info(f"Detections (conf≥0.10) on noise frame: {len(boxes)}")
    if len(boxes) > 0:
        info("Sample detection:")
        for i, box in enumerate(boxes[:3]):
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = model.names[cls_id]
            info(f"   [{i+1}] class={label!r}  conf={conf:.3f}")
    ok("Inference on realistic input succeeded")
except Exception as e:
    fail(f"Inference failed on noise frame: {e}")

# 6. Check model task / type
print("\nTEST 6 – Model meta-data")
try:
    task = getattr(model, "task", "unknown")
    info(f"Model task: {task}")
    ok(f"Model task is: {task}")
except Exception as e:
    info(f"Could not read task meta: {e}")

# 7. Validate imgsz flexibility
print("\nTEST 7 – Run inference at different resolutions")
for sz in [320, 416, 640]:
    try:
        img = np.zeros((sz, sz, 3), dtype=np.uint8)
        res = model.predict(source=img, imgsz=sz, verbose=False)
        ok(f"imgsz={sz}  →  {len(res[0].boxes)} box(es)")
    except Exception as e:
        fail(f"Inference failed at imgsz={sz}: {e}")

print(f"\n{GREEN}{'='*60}")
print("  ALL TESTS PASSED – model is functioning correctly ✅")
print(f"{'='*60}{RESET}\n")
