# -*- mode: python ; coding: utf-8 -*-

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
hidden_imports = collect_submodules('torch') + \
                 collect_submodules('torchvision') + \
                 collect_submodules('cv2') + \
                 collect_submodules('ultralytics') + \
                 collect_submodules('mediapipe') + \
                 collect_submodules('xgboost') + \
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
print("\n收集到的文件:")
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
