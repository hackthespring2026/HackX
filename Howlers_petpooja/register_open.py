# ============================================================
# YOLOv8 Fine-tuning: Cash Register Open/Closed Detection
# ============================================================

# Step 1: Install dependencies
# pip install ultralytics roboflow
import torch
device = 0 if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
from roboflow import Roboflow
from ultralytics import YOLO
import os
import yaml

# ============================================================
# STEP 1: Download Dataset from Roboflow
# ============================================================

def download_dataset():
    """
    Download the cash register dataset from Roboflow.
    Replace API_KEY with your Roboflow API key (free account at roboflow.com)
    """
    rf = Roboflow(api_key="iJWRa1fRmwP3mwwledg0")  # <-- Replace this
    
    project = rf.workspace("shazab-amxv6").project("cash-register-mezqo")
    
    # Download in YOLOv8 format
    dataset = project.version(1).download("yolov8")  # adjust version number if needed
    
    return dataset.location  # returns path to downloaded dataset

# ============================================================
# STEP 2: Verify / Create data.yaml (usually auto-generated)
# ============================================================

def verify_data_yaml(dataset_path):
    yaml_path = os.path.join(dataset_path, "data.yaml")
    
    with open(yaml_path, "r") as f:
        data = yaml.safe_load(f)
    
    print("Dataset YAML config:")
    print(data)
    print(f"Classes: {data.get('names')}")
    print(f"Number of classes: {data.get('nc')}")
    
    return yaml_path

# ============================================================
# STEP 3: Fine-tune YOLOv8
# ============================================================

def train_model(yaml_path, output_dir=r"D:\Documents\python\new life\hack the spring\main"):
    """
    Fine-tune YOLOv8n (nano) - swap to yolov8s/m for better accuracy
    Model options: yolov8n, yolov8s, yolov8m, yolov8l, yolov8x
    """
    
    # Load pretrained YOLOv8 model
    model = YOLO("yolov8n.pt")  # downloads automatically if not present
    
    # Train
    results = model.train(
        data=yaml_path,
        epochs=1,              # increase to 100 for better results
        imgsz=640,
        batch=16,               # reduce to 8 if GPU memory issues
        name="cash_register_detector",
        project=output_dir,
        patience=10,            # early stopping
        optimizer="AdamW",
        lr0=0.001,              # initial learning rate
        lrf=0.01,               # final lr = lr0 * lrf
        weight_decay=0.0005,
        augment=True,           # built-in augmentation
        mosaic=1.0,
        flipud=0.0,             # don't flip upside down (cash registers have orientation)
        fliplr=0.5,
        degrees=5.0,            # slight rotation
        translate=0.1,
        scale=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        workers=4,
                     # GPU 0; use "cpu" if no GPU
        exist_ok=True,
        pretrained=True,
        verbose=True,
        save=True,
        save_period=10,         # save checkpoint every 10 epochs
        val=True,
        plots=True,             # save training plots
    )
    # Copy best.pt directly into your main folder
    best_src = os.path.join(output_dir, "cash_register_detector", "weights", "best.pt")
    best_dst = os.path.join(output_dir, "cash_register_best.pt")
    
    print(f"✅ Best model saved to: {best_dst}")
    return results

# ============================================================
# STEP 4: Evaluate the Model
# ============================================================

def evaluate_model(yaml_path, model_path):
    model = YOLO(model_path)
    
    metrics = model.val(
        data=yaml_path,
        imgsz=640,
        batch=16,
        conf=0.5,
        iou=0.6
    )
    
    print(f"\n=== Evaluation Results ===")
    print(f"mAP50:     {metrics.box.map50:.4f}")
    print(f"mAP50-95:  {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall:    {metrics.box.mr:.4f}")
    
    return metrics

# ============================================================
# STEP 5: Inference on Video / Webcam / Image
# ============================================================

def run_inference(model_path, source, conf_threshold=0.5):
    """
    source: 
      - 0 for webcam
      - "path/to/video.mp4" for video
      - "path/to/image.jpg" for image
      - "path/to/folder/" for batch images
    """
    model = YOLO(model_path)
    
    results = model.predict(
        source=source,
        device=device,
        conf=conf_threshold,
        iou=0.45,
        imgsz=640,
    
        show=True,          # display live
        save=True,          # save output
        save_txt=True,      # save labels
        line_width=2,
        project="best_model",
        name="cash_register_inference",
    )
    
    # Parse results
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = model.names[cls_id]
            print(f"Detected: {label} | Confidence: {conf:.2f}")
    
    return results

# ============================================================
# STEP 6: Real-time CCTV Stream Inference (for deployment)
# ============================================================

def run_realtime_stream(model_path, stream_url, conf_threshold=0.5):
    """
    For RTSP streams from CCTV cameras.
    stream_url: "rtsp://username:password@camera_ip:554/stream"
    """
    import cv2
    import time
    
    model = YOLO(model_path)
    cap = cv2.VideoCapture(stream_url)
    
    OPEN_CLASS = "open"    # adjust based on your dataset's class names
    CLOSED_CLASS = "closed"
    
    alert_cooldown = 30    # seconds between alerts
    last_alert_time = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        results = model.predict(frame, conf=conf_threshold, verbose=False)
        
        current_time = time.time()
        drawer_open = False
        
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                conf = float(box.conf[0])
                
                if label.lower() == OPEN_CLASS:
                    drawer_open = True
                
                # Draw bounding box
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                color = (0, 0, 255) if label.lower() == OPEN_CLASS else (0, 255, 0)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Alert logic (hook into your POS event system here)
        if drawer_open and (current_time - last_alert_time > alert_cooldown):
            print(f"[ALERT] Cash drawer OPEN detected at {time.strftime('%H:%M:%S')}")
            last_alert_time = current_time
            # TODO: trigger_pos_validation_check()
        
        cv2.imshow("Cash Register Monitor", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    
    cap.release()
    cv2.destroyAllWindows()

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    
    # 1. Download dataset
    print("Downloading dataset from Roboflow...")
    dataset_path = download_dataset()
    
    # 2. Verify YAML
    yaml_path = verify_data_yaml(dataset_path)
    
    # 3. Train
    print("\nStarting training...")
    train_results = train_model(yaml_path, output_dir=r"D:\Documents\python\new life\hack the spring\main")
    
    # 4. Evaluate best model
    best_model_path = r"D:\Documents\python\new life\hack the spring\main\best_model.pt"
    print("\nEvaluating model...")
    evaluate_model(yaml_path, best_model_path)
    
    # 5. Test on an image or video
    # run_inference(best_model_path, source="test_image.jpg")
    
    # 6. For CCTV deployment
    # run_realtime_stream(best_model_path, stream_url="rtsp://...")