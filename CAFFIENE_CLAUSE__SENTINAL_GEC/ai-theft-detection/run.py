#!/usr/bin/env python
"""
店铺盗窃行为监测系统
快速启动脚本 - 支持两种启动模式：窗体应用和Web应用
使用方法：
    python run.py          # 默认启动窗体应用
    python run.py --web    # 启动Web应用
    python run.py --gui    # 启动窗体应用
"""

import os
import sys
import subprocess
import platform
import argparse
import json
import shutil
from pathlib import Path

def is_admin():
    """Check if the script is running with admin/root privileges"""
    try:
        if platform.system() == 'Windows':
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.geteuid() == 0
    except:
        return False

def check_python_version():
    """Check if Python version is adequate"""
    major, minor = sys.version_info[:2]
    if major < 3 or (major == 3 and minor < 8):
        print(f"错误: 需要Python 3.8或更高版本，当前版本为{major}.{minor}")
        return False
    return True

def ensure_directories():
    """Ensure required directories exist"""
    # 共享的目录
    dirs = ["models", "static", "static/output", "logs", 
           "models/standard", "models/enhanced", "src/config"]
    
    # 窗体应用需要的目录
    gui_dirs = ["static/images", "static/videos"]
    
    # Web应用需要的目录
    web_dirs = ["static/uploads", "static/css", "static/js", "templates"]
    
    # 创建所有目录
    all_dirs = dirs + gui_dirs + web_dirs
    for d in all_dirs:
        os.makedirs(d, exist_ok=True)
    
    return True

def check_and_create_default_config():
    """检查并创建默认配置文件"""
    config_path = Path("src/config/detector_config.json")
    if not config_path.exists():
        print("未找到配置文件，创建默认配置...")
        default_config = {
            "confidence_threshold": 0.3,
            "history_size": 10,
            "language": "zh",
            "behavior_weights": {
                "Covering Product Area": 0.7,
                "Unusual Elbow Position": 0.6,
                "Repetitive Position Adjustment": 0.5,
                "Suspected Tag Removal": 0.8,
                "Suspicious Item Handling": 0.7,
                "Rapid Item Concealment": 0.9,
                "Abnormal Arm Position": 0.75,
                "Suspicious Crouching": 0.8,
                "Unusual Reaching": 0.7,
                "Body Shielding": 0.85,
                "Abnormal Head Movement": 0.6,
                "Single Arm Hiding": 0.75,
                "Hiding Hand Gesture": 0.8
            },
            "detection_parameters": {
                "motion_threshold": 0.01,
                "rapid_motion_threshold": 0.03,
                "concentrated_motion_ratio": 0.2,
                "arm_angle_threshold": 90,
                "wrist_distance_threshold": 100,
                "hip_knee_ratio": 0.15,
                "proximity_threshold": 50,
                "head_angle_threshold": 45
            },
            "tracker": {
                "max_disappeared": 30,
                "distance_threshold": 100
            }
        }
        
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            print("成功创建默认配置文件")
        except Exception as e:
            print(f"创建配置文件时出错: {e}")
    
    return True

def check_models():
    """Check if models exist and download them if needed"""
    model_files = [
        os.path.join("models", "yolov11n.pt")
    ]
    
    # 检查XGBoost模型
    xgb_model_paths = [
        os.path.join("models", "standard", "theft_xgb_model.pkl"),
        os.path.join("models", "enhanced", "enhanced_theft_xgb_model.pkl")
    ]
    
    # 合并所有要检查的模型路径
    model_files.extend(xgb_model_paths)
    
    missing = [f for f in model_files if not os.path.exists(f)]
    
    if missing:
        print("未找到所需的模型文件:")
        for m in missing:
            print(f" - {m}")
        print("正在尝试从打包文件中解压...")
        
        # 检查是否存在备份模型目录
        backup_models_dir = Path("backup_models")
        if backup_models_dir.exists():
            print("找到备份模型目录，正在恢复模型文件...")
            for m in missing:
                backup_path = backup_models_dir / Path(m).name
                if backup_path.exists():
                    target_dir = Path(m).parent
                    target_dir.mkdir(exist_ok=True, parents=True)
                    shutil.copy(backup_path, m)
                    print(f"已恢复模型文件: {m}")
        
        return True  # 返回True，因为模型文件会在运行时自动解压或下载
    
    print("已加载模型文件:")
    for m in model_files:
        if os.path.exists(m):
            print(f" - {m}")
    
    return True

def check_dependencies(is_web_mode):
    """Check if required dependencies are installed"""
    try:
        # 共享依赖
        import cv2
        import numpy
        import torch
        
        # 检查特定的依赖
        if is_web_mode:
            # Web应用的依赖
            import flask
        else:
            # GUI应用的依赖
            import tkinter
        
        # XGBoost模型依赖
        try:
            import xgboost
            import sklearn
            print("XGBoost和scikit-learn依赖已安装")
        except ImportError:
            print("未安装XGBoost或scikit-learn，某些高级功能可能不可用")
        
        # MediaPipe依赖
        try:
            import mediapipe
            print("MediaPipe依赖已安装")
        except ImportError:
            print("未安装MediaPipe，姿态估计功能可能受限")
        
        print("依赖检查通过")
        return True
    except ImportError as e:
        print(f"缺少依赖: {str(e)}")
        
        install = input("是否自动安装所需依赖? (y/n): ")
        if install.lower() == 'y':
            print("安装所需依赖...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
                print("依赖安装完成")
                return True
            except Exception as e:
                print(f"安装依赖时出错: {str(e)}")
                print("请手动运行: pip install -r requirements.txt")
                return False
        else:
            print("请手动安装所需依赖: pip install -r requirements.txt")
            return False

def run_web_app():
    """运行Web应用"""
    try:
        print("启动店铺盗窃行为监测系统 (Web模式)...")
        
        # 导入并启动Flask应用
        import main
        main.main()
        return True
    except Exception as e:
        print(f"启动Web应用时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def run_gui_app():
    """运行窗体应用"""
    try:
        print("启动店铺盗窃行为监测系统 (窗体模式)...")
        
        # 导入窗体应用的主窗口
        from src.ui.main_window import main
        main()
        return True
    except Exception as e:
        print(f"启动窗体应用时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="店铺盗窃行为监测系统")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--web", action="store_true", help="以Web应用模式启动")
    group.add_argument("--gui", action="store_true", help="以窗体应用模式启动")
    args = parser.parse_args()
    
    # 确定启动模式
    is_web_mode = args.web
    if not args.web and not args.gui:
        # 默认为窗体模式
        is_web_mode = False
    
    # 打印启动信息
    mode_str = "Web应用" if is_web_mode else "窗体应用"
    print(f"店铺盗窃行为监测系统 - {mode_str}启动中...")
    
    # 快速检查 - 跳过详细检查以加快启动速度
    if not check_python_version():
        return
    
    # 确保目录存在
    ensure_directories()
    
    # 创建默认配置
    check_and_create_default_config()
    
    # 并行进行检查和初始化以加快启动速度
    if not check_dependencies(is_web_mode):
        return
    
    # 检查模型
    if not check_models():
        return
    
    # 根据模式启动应用
    print("初始化完成，正在启动应用...")
    if is_web_mode:
        run_web_app()
    else:
        run_gui_app()

if __name__ == "__main__":
    main() 