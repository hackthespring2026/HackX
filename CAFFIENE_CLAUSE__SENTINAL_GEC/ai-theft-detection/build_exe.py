#!/usr/bin/env python
"""
打包脚本 - 将Python应用打包成可执行文件
使用PyInstaller将应用打包成单个exe文件
"""

import os
import sys
import subprocess
import shutil
import platform

def check_pyinstaller():
    """检查是否安装了PyInstaller，如果没有则安装"""
    try:
        import PyInstaller
        print(f"检测到PyInstaller版本: {PyInstaller.__version__}")
        return True
    except ImportError:
        print("未安装PyInstaller，正在安装...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller>=5.7.0"])
            return True
        except Exception as e:
            print(f"安装PyInstaller时出错: {str(e)}")
            return False

def create_spec_file():
    """创建自定义的spec文件"""
    # 检查模型文件是否存在
    model_files = [
        'models/yolov8n.pt',
        'models/yolov11n.pt',
        'models/theft_xgb_model.pkl',
        'models/theft_detection_data.csv'
    ]
    
    missing_models = [f for f in model_files if not os.path.exists(f)]
    if missing_models:
        print("警告: 以下模型文件不存在:")
        for m in missing_models:
            print(f" - {m}")
        print("请确保所有模型文件都存在后再进行打包")
        return False
    
    spec_content = """# -*- mode: python ; coding: utf-8 -*-

import sys
import os
import glob
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, copy_metadata

block_cipher = None

# 递归收集所有目录和子目录
def collect_directory(path):
    files = []
    for root, _, filenames in os.walk(path):
        for filename in filenames:
            files.append((os.path.join(root, filename), os.path.relpath(root, '.')))
    return files

# 收集必要的模块
hidden_imports = collect_submodules('torch') + \\
                 collect_submodules('torchvision') + \\
                 collect_submodules('cv2') + \\
                 collect_submodules('ultralytics') + \\
                 collect_submodules('mediapipe') + \\
                 collect_submodules('xgboost') + \\
                 ['flask', 'werkzeug', 'jinja2']

# 收集数据文件
datas = []
datas += collect_data_files('ultralytics')
datas += collect_data_files('mediapipe')
datas += collect_data_files('xgboost')
datas += copy_metadata('ultralytics')
datas += copy_metadata('xgboost')

# 初始化binaries列表
binaries = []

# 收集XGBoost DLL文件
try:
    import xgboost
    xgboost_dir = os.path.dirname(xgboost.__file__)
    xgboost_dll_paths = glob.glob(os.path.join(xgboost_dir, '**', 'xgboost.dll'), recursive=True)
    for dll_path in xgboost_dll_paths:
        # 将DLL文件添加到binaries中，这样会被直接打包到可执行文件中
        binaries.append((dll_path, '.'))
except ImportError:
    print("未找到XGBoost库，可能会导致程序无法使用ML分类器")

# 收集模型、静态文件和模板
datas += collect_directory('models')
datas += collect_directory('static')
datas += collect_directory('templates')
datas += [('requirements.txt', '.')]

# 打印收集到的文件
print("\\n收集到的文件:")
for d in datas:
    print(f" - {d[0]} -> {d[1]}")
if binaries:
    for b in binaries:
        print(f" - {b[0]} -> {b[1]}")

a = Analysis(
    ['run.py'],
    pathex=[],
    binaries=binaries,  # 添加二进制文件
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=['runtime_hook.py'],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AI_Theft_Detection',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='static/images/icon.ico' if os.path.exists('static/images/icon.ico') else None,
)
"""

    with open("build.spec", "w", encoding="utf-8") as f:
        f.write(spec_content)
    
    print("创建spec文件成功")
    return True

def build_executable():
    """使用PyInstaller打包应用"""
    print("开始打包应用...")
    
    try:
        # 清理旧的构建文件
        if os.path.exists("dist"):
            shutil.rmtree("dist")
        if os.path.exists("build"):
            shutil.rmtree("build")
        
        # 使用spec文件构建
        subprocess.check_call([sys.executable, "-m", "PyInstaller", "build.spec", "--clean"])
        
        print("\n打包完成!")
        print(f"可执行文件位于: {os.path.abspath('dist/AI_Theft_Detection.exe')}")
        return True
    except Exception as e:
        print(f"打包过程中出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("===== AI Theft Detection System Packager =====")
    
    # 检查系统
    if platform.system() != "Windows":
        print(f"警告: 当前系统为 {platform.system()}, 该脚本主要针对Windows打包设计")
    
    # 检查PyInstaller
    if not check_pyinstaller():
        print("PyInstaller安装失败，无法继续打包")
        return False
    
    # 创建spec文件
    if not create_spec_file():
        print("创建spec文件失败，无法继续打包")
        return False
    
    # 打包应用
    if not build_executable():
        print("打包应用失败")
        return False
    
    print("\n===== Packaging Process Completed =====")
    print("You can distribute the executable file from the dist directory")
    return True

if __name__ == "__main__":
    main()
    input("Press Enter to exit...") 