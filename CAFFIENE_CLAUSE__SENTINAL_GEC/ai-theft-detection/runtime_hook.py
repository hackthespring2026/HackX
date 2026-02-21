import os
import sys
import shutil
import glob

def extract_models():
    """解压模型文件到运行目录"""
    # 获取运行目录
    base_path = os.path.dirname(sys.executable)
    models_dir = os.path.join(base_path, 'models')
    
    # 确保models目录存在
    os.makedirs(models_dir, exist_ok=True)
    
    # 检查模型文件是否已经存在
    model_files = [
        'yolov8n.pt',
        'yolov11n.pt',
        'theft_xgb_model.pkl',
        'theft_detection_data.csv'
    ]
    
    # 从临时目录复制模型文件
    for model_file in model_files:
        src_path = os.path.join(sys._MEIPASS, 'models', model_file)
        dst_path = os.path.join(models_dir, model_file)
        
        try:
            # 不论目标文件是否存在，都复制（覆盖）
            shutil.copy2(src_path, dst_path)
            print(f"已解压模型文件: {model_file}")
        except Exception as e:
            print(f"解压模型文件 {model_file} 时出错: {str(e)}")

# 设置初始工作目录为可执行文件所在目录
os.chdir(os.path.dirname(sys.executable))

# 在程序启动时执行解压
print("正在初始化应用...")
extract_models() 