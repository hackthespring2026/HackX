@echo off
chcp 65001 > nul
echo ===== AI Theft Detection System Packager =====
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Python，请确保已安装Python并添加到系统环境变量
    pause
    exit /b 1
)

:: 检查模型文件是否存在
if not exist models\yolov8n.pt (
    echo 错误: 未找到模型文件 models\yolov8n.pt
    pause
    exit /b 1
)
if not exist models\yolov11n.pt (
    echo 错误: 未找到模型文件 models\yolov11n.pt
    pause
    exit /b 1
)
if not exist models\theft_xgb_model.pkl (
    echo 错误: 未找到模型文件 models\theft_xgb_model.pkl
    pause
    exit /b 1
)
if not exist models\theft_detection_data.csv (
    echo 错误: 未找到模型文件 models\theft_detection_data.csv
    pause
    exit /b 1
)

:: 安装必要的依赖
echo 正在安装必要的依赖...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 错误: 安装依赖失败
    pause
    exit /b 1
)

:: 运行打包脚本
echo.
echo 开始打包应用...
python build_exe.py
if %errorlevel% neq 0 (
    echo 错误: 打包失败
    pause
    exit /b 1
)

echo.
echo ===== 打包完成 =====
echo 可执行文件位于 dist 目录中
echo.
pause 