import os
import sys
import cv2
import torch
import logging
import numpy as np
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("detector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('common_detector')

class CommonDetector:
    """Base detector class — provides shared model loading and core detection functionality"""
    
    def __init__(self, model_path="models/yolov11n.pt"):
        """Initialise detector.
        Args:
            model_path: Path to YOLO model weights
        """
        self.model_path = model_path
        self.model = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        logger.info(f"Using device: {self.device}")
        
        # Load model
        self.load_yolo_model()
    
    def load_yolo_model(self):
        """Load YOLOv11n model"""
        try:
            # First: try ultralytics YOLO
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
                logger.info(f"Model loaded from {self.model_path} using ultralytics YOLO")
                return
            except ImportError:
                logger.warning("ultralytics package not found, trying alternative loading methods...")
            except Exception as e:
                logger.warning(f"Failed to load model with ultralytics YOLO: {e}, trying alternative loading methods...")
            
            # Fallback: direct PyTorch load
            if os.path.exists(self.model_path):
                self.model = torch.load(self.model_path, map_location=self.device)
                if hasattr(self.model, 'model'):
                    self.model = self.model.model  # Get actual model
                self.model.eval()
                logger.info(f"Model loaded from {self.model_path} using torch.load")
                return
            else:
                logger.warning(f"Model file {self.model_path} not found, trying to download...")
            
            # Last resort: torch hub
            self.model = torch.hub.load('WongKinYiu/yolov7', 'custom', self.model_path)
            self.model.eval()
            logger.info(f"Model loaded from torch hub")
            
        except Exception as e:
            logger.error(f"Failed to load YOLOv11n model: {e}")
            raise ValueError(f"Failed to load YOLOv11n model: {e}")
    
    def detect_objects(self, img):
        """Detect objects in an image.
        Args:
            img: Input image (file path or numpy array)
        Returns:
            YOLO detection results
        """
        if self.model is None:
            logger.error("Model not loaded. Please load the model first.")
            return None
        
        # Convert image to correct format if needed
        if isinstance(img, str):
            img = cv2.imread(img)
        
        try:
            # For ultralytics YOLO
            if hasattr(self.model, 'predict') and callable(getattr(self.model, 'predict')):
                results = self.model.predict(source=img, conf=0.25, verbose=False)[0]
                return results
            
            # For torch hub models
            elif hasattr(self.model, '__call__'):
                results = self.model(img)
                if results.pandas().xyxy[0].empty:
                    logger.info("No objects detected in the image.")
                return results
            
            else:
                logger.error("Model doesn't have the expected interface for detection.")
                return None
                
        except Exception as e:
            logger.error(f"Error during object detection: {e}")
            return None
    
    def draw_basic_detection(self, img, detections):
        """Draw detection boxes on image.
        Args:
            img: Original image
            detections: Detection results
        Returns:
            marked_img: Annotated image
        """
        if detections is None:
            return img.copy()
            
        marked_img = img.copy()
        
        # Handle ultralytics YOLO results
        if hasattr(detections, 'boxes') and hasattr(detections.boxes, 'data'):
            boxes = detections.boxes.data.cpu().numpy()
            for box in boxes:
                x1, y1, x2, y2, conf, cls = box
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                
                # Get class name
                if hasattr(detections, 'names'):
                    cls_name = detections.names[int(cls)]
                else:
                    cls_name = f"class {int(cls)}"
                
                # Draw bounding box
                cv2.rectangle(marked_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Draw label inside box at top
                label = f"{cls_name}: {conf:.2f}"
                (label_width, label_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                cv2.rectangle(marked_img, (x1, y1), (x1 + label_width, y1 + label_height + 5), (0, 255, 0), -1)
                cv2.putText(marked_img, label, (x1, y1 + label_height), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # Handle torch hub results
        elif hasattr(detections, 'pandas') and callable(getattr(detections, 'pandas')):
            df = detections.pandas().xyxy[0]
            for _, det in df.iterrows():
                x1, y1, x2, y2 = int(det['xmin']), int(det['ymin']), int(det['xmax']), int(det['ymax'])
                conf = det['confidence']
                cls_name = det['name']
                cv2.rectangle(marked_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"{cls_name}: {conf:.2f}"
                (label_width, label_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                cv2.rectangle(marked_img, (x1, y1), (x1 + label_width, y1 + label_height + 5), (0, 255, 0), -1)
                cv2.putText(marked_img, label, (x1, y1 + label_height), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
                
        return marked_img 

    def _is_retail_environment(self, detection_result):
        """Check if image is a retail/shop environment.
        Args:
            detection_result: YOLO detection results
        Returns:
            bool: True if retail environment detected
        """
        if hasattr(detection_result, 'video_frame') and detection_result.video_frame:
            try:
                from .detection import TheftDetector
                return TheftDetector._is_retail_environment_video(TheftDetector(), detection_result)
            except (ImportError, AttributeError):
                return self._simple_retail_environment_check(detection_result)
        else:
            return self._simple_retail_environment_check(detection_result)
    
    def _simple_retail_environment_check(self, detection_result):
        """Simplified retail environment check for CommonDetector."""
        if detection_result is None:
            return False
            
        # Objects that indicate a retail environment
        retail_indicators = [
            "shelf", "shopping cart", "cashier", "cash register", "checkout",
            "bottle", "refrigerator", "food", "fruit", "vegetable",
            "counter", "display", "store", "supermarket", "retail"
        ]
        
        if hasattr(detection_result, 'boxes'):
            for box in detection_result.boxes:
                cls_id = int(box.cls[0])
                class_name = detection_result.names.get(cls_id, "").lower()
                if any(indicator in class_name for indicator in retail_indicators):
                    return True
                
        return False 