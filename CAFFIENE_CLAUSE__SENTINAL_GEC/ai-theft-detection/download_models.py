"""
YOLOv11n和XGBoost模型下载脚本
用于下载和准备店铺盗窃行为监测系统所需的模型文件
"""

import os
import sys
import requests
import torch
import logging
import zipfile
import tarfile
import shutil
from pathlib import Path
import urllib.request

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('download_models')

# URLs for model downloads
YOLOV11N_URL = "https://github.com/ultralytics/assets/releases/download/v8.0.0/yolov11n.pt"
PRETRAINED_XGB_URL = "https://github.com/ultralytics/assets/releases/download/v0.0.0/coco128_xgb.pkl"

# Local paths
MODELS_DIR = "models"
YOLOV11N_PATH = os.path.join(MODELS_DIR, "yolov11n.pt")
XGB_MODEL_PATH = os.path.join(MODELS_DIR, "theft_xgb_model.pkl")

def ensure_models_dir():
    """Ensure models directory exists"""
    os.makedirs(MODELS_DIR, exist_ok=True)
    logger.info(f"Models directory is ready at: {os.path.abspath(MODELS_DIR)}")

def download_file(url, destination):
    """Download a file from URL to destination with progress reporting
    
    Args:
        url: URL to download
        destination: Local path to save the file
    """
    # Check if file already exists
    if os.path.exists(destination):
        logger.info(f"File already exists: {destination}")
        return True
    
    try:
        logger.info(f"Downloading from {url} to {destination}")
        
        # Create a request with headers to avoid being blocked
        req = urllib.request.Request(
            url,
            data=None,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        
        # Download with progress reporting
        with urllib.request.urlopen(req) as response, open(destination, 'wb') as out_file:
            file_size = int(response.info().get('Content-Length', 0))
            logger.info(f"File size: {file_size / (1024*1024):.2f} MB")
            
            downloaded = 0
            block_size = 8192
            
            while True:
                buffer = response.read(block_size)
                if not buffer:
                    break
                
                downloaded += len(buffer)
                out_file.write(buffer)
                
                # Report progress
                progress = downloaded / file_size if file_size > 0 else 0
                if file_size > 0 and (downloaded % (1024*1024) < block_size or downloaded == file_size):
                    logger.info(f"Download progress: {progress:.1%}")
        
        logger.info(f"Download completed: {destination}")
        return True
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        # Remove partial file
        if os.path.exists(destination):
            os.remove(destination)
        return False

def download_yolov11n():
    """Download YOLOv11n model"""
    logger.info("Downloading YOLOv11n model...")
    
    # 首先尝试通过 ultralytics 库下载
    try:
        logger.info("尝试通过 ultralytics 库下载 YOLOv11n 模型...")
        
        # 确保已安装 ultralytics
        try:
            import ultralytics
            logger.info(f"Ultralytics 版本: {ultralytics.__version__}")
        except ImportError:
            logger.warning("未安装 ultralytics 库，尝试安装...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics>=8.0.0"])
            import ultralytics
            logger.info(f"安装成功，Ultralytics 版本: {ultralytics.__version__}")
        
        # 使用 ultralytics 下载 YOLOv11n 模型
        from ultralytics import YOLO
        
        # 确保源模型存在 (首先尝试下载 YOLOv8n 模型，然后在必要时加载 YOLOv11n)
        yolo8n_model = YOLO("yolov8n.pt")
        logger.info("成功加载 YOLOv8n，现在尝试获取 YOLOv11n...")
        
        # 尝试下载 YOLOv11n
        if not os.path.exists(YOLOV11N_PATH):
            # 直接下载 YOLOv11n 文件
            success = download_file(YOLOV11N_URL, YOLOV11N_PATH)
            if success:
                logger.info(f"成功下载 YOLOv11n 模型到 {YOLOV11N_PATH}")
                # 验证模型
                try:
                    model = YOLO(YOLOV11N_PATH)
                    logger.info("成功验证 YOLOv11n 模型")
                    return True
                except Exception as e:
                    logger.error(f"模型验证失败: {str(e)}")
                    if os.path.exists(YOLOV11N_PATH):
                        os.remove(YOLOV11N_PATH)
                    raise
            else:
                logger.error("下载 YOLOv11n 失败，尝试替代方法")
                raise RuntimeError("下载 YOLOv11n 失败")
        else:
            logger.info(f"YOLOv11n 模型已存在: {YOLOV11N_PATH}")
            return True
    
    except Exception as e:
        logger.warning(f"通过 ultralytics 下载失败: {str(e)}")
        logger.info("尝试直接下载 YOLOv11n 模型文件...")
        return download_file(YOLOV11N_URL, YOLOV11N_PATH)

def download_xgb_model():
    """Download XGBoost model"""
    logger.info("Downloading pretrained XGBoost model...")
    
    # Download to a temporary file first
    temp_xgb_path = os.path.join(MODELS_DIR, "temp_xgb.pkl")
    success = download_file(PRETRAINED_XGB_URL, temp_xgb_path)
    
    if success:
        # Rename/copy to the final path
        try:
            # Try simple rename first
            try:
                os.rename(temp_xgb_path, XGB_MODEL_PATH)
            except:
                # If rename fails, try copy instead
                shutil.copy2(temp_xgb_path, XGB_MODEL_PATH)
                os.remove(temp_xgb_path)
            
            logger.info(f"XGBoost model saved to: {XGB_MODEL_PATH}")
            return True
        except Exception as e:
            logger.error(f"Error renaming XGBoost model: {str(e)}")
            return False
    
    return False

def create_dummy_xgb_model():
    """创建一个简单的 XGBoost 模型文件用于测试"""
    logger.info("无法下载 XGBoost 模型，创建一个简单模型用于测试...")
    
    try:
        import xgboost as xgb
        import numpy as np
        from sklearn.datasets import make_classification
        
        # 创建一个简单的分类数据集
        X, y = make_classification(n_samples=100, n_features=20, random_state=42)
        
        # 训练一个简单的 XGBoost 模型
        model = xgb.XGBClassifier(n_estimators=5, max_depth=3)
        model.fit(X, y)
        
        # 保存模型
        import joblib
        joblib.dump(model, XGB_MODEL_PATH)
        
        logger.info(f"成功创建测试 XGBoost 模型: {XGB_MODEL_PATH}")
        return True
    except Exception as e:
        logger.error(f"创建测试模型失败: {str(e)}")
        return False

def verify_models():
    """Verify that all required models are present and valid"""
    missing = []
    invalid = []
    
    # Check YOLO model
    if not os.path.exists(YOLOV11N_PATH):
        missing.append("YOLOv11n model")
    elif os.path.getsize(YOLOV11N_PATH) < 1000000:  # At least 1MB
        invalid.append("YOLOv11n model (file too small)")
    
    # Check XGBoost model
    if not os.path.exists(XGB_MODEL_PATH):
        missing.append("XGBoost model")
    elif os.path.getsize(XGB_MODEL_PATH) < 10000:  # At least 10KB
        invalid.append("XGBoost model (file too small)")
    
    if missing or invalid:
        logger.warning("Model verification failed!")
        for m in missing:
            logger.warning(f"Missing: {m}")
        for i in invalid:
            logger.warning(f"Invalid: {i}")
        return False
    
    logger.info("All models verified successfully")
    return True

def main():
    """Main function to download and prepare models"""
    logger.info("Starting model download script")
    
    # Ensure models directory exists
    ensure_models_dir()
    
    # Check if models already exist and are valid
    if verify_models():
        logger.info("All required models are already downloaded and valid")
        return True
    
    # Download YOLOv11n
    if not os.path.exists(YOLOV11N_PATH) or os.path.getsize(YOLOV11N_PATH) < 1000000:
        success = download_yolov11n()
        if not success:
            logger.error("Failed to download YOLOv11n model")
            return False
    
    # Download XGBoost model
    if not os.path.exists(XGB_MODEL_PATH) or os.path.getsize(XGB_MODEL_PATH) < 10000:
        success = download_xgb_model()
        if not success:
            logger.warning("下载 XGBoost 模型失败，尝试创建测试模型")
            success = create_dummy_xgb_model()
            if not success:
                logger.error("Failed to create XGBoost model")
                return False
    
    # Final verification
    if verify_models():
        logger.info("All models downloaded and verified successfully")
        return True
    else:
        logger.error("Model verification failed after downloads")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print("模型文件下载完成。")
    else:
        print("下载模型文件时出现错误，请参见日志。")
        sys.exit(1) 