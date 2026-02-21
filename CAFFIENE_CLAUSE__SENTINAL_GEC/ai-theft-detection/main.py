"""
Retail Store Theft Detection System - Startup Script
AI-powered theft detection system based on YOLOv11n and behaviour analysis.
Supports image and video analysis for theft detection.
Supports both GUI (desktop) and Web application modes.
"""

import os
import sys
import logging
import torch

# 添加项目根目录到 Python 路径
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/app.log", mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('main')

def check_gpu():
    """检查 GPU 可用性"""
    if torch.cuda.is_available():
        device_count = torch.cuda.device_count()
        device_name = torch.cuda.get_device_name(0) if device_count > 0 else "Unknown"
        logger.info(f"GPU 可用: {device_name}, 设备数量: {device_count}")
        return True
    else:
        logger.info("GPU 不可用，将使用 CPU 进行推理 (速度较慢)")
        return False

def check_dependencies(is_web_mode=True):
    """Check and install required dependencies"""
    try:
        # 共享依赖
        import cv2
        import numpy
        import torch
        import PIL
        
        # 特定模式依赖
        if is_web_mode:
            # Web模式依赖
            import flask
        else:
            # GUI模式依赖
            import tkinter
            
        logger.info("所有必要的依赖已安装")
        return True
    except ImportError as e:
        logger.error(f"缺少依赖: {str(e)}")
        print(f"缺少依赖: {str(e)}")
        print("请安装所需依赖: pip install -r requirements.txt")
        return False

def check_models():
    """Check if required model files exist"""
    # Required model files
    model_files = [
        os.path.join("models", "yolov11n.pt")
    ]
    
    missing_models = [f for f in model_files if not os.path.exists(f)]
    
    if missing_models:
        logger.warning(f"Missing model files: {missing_models}")
        print("警告: 缺少以下模型文件:")
        for model in missing_models:
            print(f" - {model}")
            
        # 尝试下载缺失的模型文件
        download = input("是否尝试下载缺失的模型文件? (y/n): ")
        if download.lower() == 'y':
            try:
                import download_models
                if download_models.main():
                    logger.info("模型文件下载成功")
                    return True
                else:
                    logger.error("模型文件下载失败")
                    return False
            except Exception as e:
                logger.error(f"下载模型时出错: {str(e)}")
                print(f"下载模型时出错: {str(e)}")
                print("请运行 download_models.py 下载模型或手动下载")
                return False
        else:
            return False
    
    logger.info("所有必要的模型文件已存在")
    return True

def ensure_directories():
    """Ensure required directories exist"""
    # 共享目录
    required_dirs = [
        "models",
        "static",
        "static/output",
        "logs"
    ]
    
    # Web应用特定目录
    web_dirs = [
        "static/uploads",
        "static/css",
        "static/js", 
        "templates"
    ]
    
    # 创建所有目录
    all_dirs = required_dirs + web_dirs
    for directory in all_dirs:
        os.makedirs(directory, exist_ok=True)
    
    logger.info("所需目录已创建")

def start_web_app():
    """启动Web应用"""
    try:
        # 确保ultralytics库可用
        try:
            import ultralytics
            logger.info(f"已加载 ultralytics 库，版本: {ultralytics.__version__}")
        except ImportError:
            logger.warning("未安装 ultralytics 库，尝试安装...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "ultralytics>=8.0.0"])
            import ultralytics
            logger.info(f"安装成功，ultralytics 版本: {ultralytics.__version__}")
            
        # 启动 Flask Web 应用
        from src.app import app
        logger.info("Starting Flask web application...")
        
        # 获取主机IP地址，默认为localhost
        host = '0.0.0.0'  # 允许外部访问
        port = 5000
        
        print(f"Web应用启动成功! 请在浏览器中访问: http://localhost:{port}")
        print("按 Ctrl+C 停止服务器")
        
        app.run(host=host, port=port, debug=False)
    except Exception as e:
        logger.error(f"启动Web应用出错: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to run the application"""
    print("店铺盗窃行为监测系统启动中...")
    logger.info("Starting theft detection system")
    
    # 检查 GPU 可用性
    check_gpu()
    
    # Ensure required directories exist
    ensure_directories()
    
    # Check dependencies
    if not check_dependencies():
        input("按Enter键退出...")
        return
    
    # Check model files
    if not check_models():
        response = input("模型文件缺失或无效，是否继续? (y/n): ")
        if response.lower() != 'y':
            return
    
    # 启动 Web 应用
    start_web_app()

if __name__ == "__main__":
    main() 