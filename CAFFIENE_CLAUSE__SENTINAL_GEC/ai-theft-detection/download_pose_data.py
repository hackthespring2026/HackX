import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import requests
import zipfile
import logging
from pathlib import Path
from tqdm import tqdm
import pickle

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('pose_dataset_downloader')

def download_file(url, destination):
    """
    下载文件并显示进度条
    
    Args:
        url: 下载URL
        destination: 保存路径
    """
    try:
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        
        with open(destination, 'wb') as f, tqdm(
            desc=os.path.basename(destination),
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for data in response.iter_content(chunk_size=1024):
                size = f.write(data)
                bar.update(size)
        return True
    except Exception as e:
        logger.error(f"下载失败: {str(e)}")
        return False

def download_pkummd_dataset():
    """
    下载PKU-MMD数据集，这是一个大型多模态人体动作识别数据集
    适合盗窃行为检测的训练
    """
    data_dir = Path("data/datasets/pkummd")
    data_dir.mkdir(parents=True, exist_ok=True)

    # PKU-MMD数据集的样本下载链接
    # 完整数据集需要申请访问，这里我们使用样本数据用于演示
    sample_url = "https://github.com/ECHO960/PKU-MMD/raw/master/PKU-MMD.zip"
    sample_zip = data_dir / "PKU-MMD.zip"
    
    if not sample_zip.exists():
        logger.info(f"正在下载PKU-MMD样本数据...")
        if download_file(sample_url, sample_zip):
            logger.info(f"下载完成: {sample_zip}")
        else:
            logger.error("下载PKU-MMD样本数据失败")
            return False
    
    # 解压数据
    if not (data_dir / "skeleton").exists():
        logger.info(f"正在解压PKU-MMD样本数据...")
        try:
            with zipfile.ZipFile(sample_zip, 'r') as zip_ref:
                zip_ref.extractall(data_dir)
            logger.info("解压完成")
        except Exception as e:
            logger.error(f"解压失败: {str(e)}")
            return False
    
    return True

def download_nturgbd_dataset():
    """
    下载NTU RGB+D数据集样本，这是一个大型人体动作识别数据集
    """
    data_dir = Path("data/datasets/nturgbd")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # 我们将使用已经处理好的骨架数据样本
    # 完整数据集需要申请访问，这里我们使用样本数据进行演示
    sample_url = "https://github.com/shahroudy/NTURGB-D/raw/master/Matlab/NTU_RGBD_samples.zip"
    sample_zip = data_dir / "NTU_RGBD_samples.zip"
    
    if not sample_zip.exists():
        logger.info(f"正在下载NTU RGB+D样本数据...")
        if download_file(sample_url, sample_zip):
            logger.info(f"下载完成: {sample_zip}")
        else:
            logger.error("下载NTU RGB+D样本数据失败")
            return False
    
    # 解压数据
    if not (data_dir / "samples").exists():
        logger.info(f"正在解压NTU RGB+D样本数据...")
        try:
            with zipfile.ZipFile(sample_zip, 'r') as zip_ref:
                zip_ref.extractall(data_dir)
            logger.info("解压完成")
        except Exception as e:
            logger.error(f"解压失败: {str(e)}")
            return False
    
    return True

def create_synthetic_pose_data():
    """
    创建合成的姿态数据用于模型训练
    使用MediaPipe的关键点格式
    """
    data_dir = Path("data/datasets/synthetic")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("创建合成姿态数据用于模型训练...")
    
    # 定义行为类别
    behaviors = [
        "normal",              # 正常行为
        "abnormal_arm",        # 异常手臂位置
        "crouching",           # 蹲姿
        "reaching",            # 伸手
        "body_shielding",      # 身体屏蔽
        "head_movement",       # 异常头部运动
        "item_hiding",         # 藏匿物品
        "tag_removal"          # 撕标签
    ]
    
    n_samples_per_class = 100
    n_frames_per_sample = 30
    
    # MediaPipe姿态关键点索引
    # 0-10: 面部关键点
    # 11-12: 肩膀
    # 13-14: 肘部
    # 15-16: 手腕
    # 23-24: 臀部
    # 25-26: 膝盖
    # 27-28: 脚踝
    # 29-30: 脚跟
    # 31-32: 脚尖
    
    # 创建合成数据
    all_data = []
    all_labels = []
    
    for behavior_idx, behavior in enumerate(behaviors):
        logger.info(f"生成 {behavior} 行为数据...")
        
        for sample_idx in range(n_samples_per_class):
            sample_data = []
            
            for frame_idx in range(n_frames_per_sample):
                # 基础姿态模板
                landmarks = {}
                
                # 添加基础身体关键点
                for i in range(33):  # MediaPipe有33个关键点
                    landmarks[i] = {
                        'x': np.random.randint(100, 500),
                        'y': np.random.randint(100, 500),
                        'visibility': np.random.uniform(0.5, 1.0)
                    }
                
                # 根据行为类型修改姿态
                if behavior == "normal":
                    # 正常姿态，无特殊调整
                    pass
                    
                elif behavior == "abnormal_arm":
                    # 异常手臂位置 - 手腕靠近身体中心
                    mid_x = (landmarks[23]['x'] + landmarks[24]['x']) / 2
                    landmarks[15]['x'] = mid_x + np.random.randint(-50, 50)
                    landmarks[16]['x'] = mid_x + np.random.randint(-50, 50)
                    
                elif behavior == "crouching":
                    # 蹲姿 - 降低身体位置
                    for i in [23, 24, 25, 26]:  # 臀部和膝盖
                        landmarks[i]['y'] += 100 + np.random.randint(0, 50)
                    
                elif behavior == "reaching":
                    # 伸手 - 延长手臂
                    arm_side = np.random.choice(["left", "right"])
                    if arm_side == "left":
                        landmarks[15]['x'] -= 100 + np.random.randint(0, 50)
                    else:
                        landmarks[16]['x'] += 100 + np.random.randint(0, 50)
                    
                elif behavior == "body_shielding":
                    # 身体屏蔽 - 手臂交叉
                    landmarks[13]['x'] = landmarks[14]['x'] + np.random.randint(-30, 30)
                    landmarks[15]['x'] = landmarks[16]['x'] + np.random.randint(-30, 30)
                    
                elif behavior == "head_movement":
                    # 异常头部运动 - 头部旋转
                    for i in range(11):  # 面部关键点
                        landmarks[i]['x'] += np.random.randint(-30, 30)
                    
                elif behavior == "item_hiding":
                    # 藏匿物品 - 手腕靠近裤兜位置
                    side = np.random.choice(["left", "right"])
                    if side == "left":
                        landmarks[15]['x'] = landmarks[23]['x'] + np.random.randint(-20, 20)
                        landmarks[15]['y'] = landmarks[23]['y'] + np.random.randint(-20, 20)
                    else:
                        landmarks[16]['x'] = landmarks[24]['x'] + np.random.randint(-20, 20)
                        landmarks[16]['y'] = landmarks[24]['y'] + np.random.randint(-20, 20)
                    
                elif behavior == "tag_removal":
                    # 撕标签 - 手指靠近嘴部或腰部
                    target = np.random.choice(["mouth", "waist"])
                    if target == "mouth":
                        landmarks[15]['x'] = landmarks[0]['x'] + np.random.randint(-20, 20)
                        landmarks[15]['y'] = landmarks[0]['y'] + np.random.randint(-20, 20)
                    else:
                        mid_waist_x = (landmarks[23]['x'] + landmarks[24]['x']) / 2
                        mid_waist_y = (landmarks[23]['y'] + landmarks[24]['y']) / 2
                        landmarks[15]['x'] = mid_waist_x + np.random.randint(-20, 20)
                        landmarks[15]['y'] = mid_waist_y + np.random.randint(-50, 0)
                
                # 将关键点转换为列表格式
                frame_data = []
                for i in range(33):
                    if i in landmarks:
                        frame_data.extend([
                            landmarks[i]['x'], 
                            landmarks[i]['y'],
                            landmarks[i]['visibility']
                        ])
                    else:
                        frame_data.extend([0, 0, 0])
                
                sample_data.append(frame_data)
            
            all_data.append(sample_data)
            all_labels.append(behavior_idx)
    
    # 转换为numpy数组
    X = np.array(all_data)
    y = np.array(all_labels)
    
    # 保存为pickle文件
    with open(data_dir / "synthetic_pose_data.pkl", "wb") as f:
        pickle.dump({
            "X": X,
            "y": y,
            "behaviors": behaviors
        }, f)
    
    logger.info(f"合成数据已保存到 {data_dir / 'synthetic_pose_data.pkl'}")
    logger.info(f"数据形状: {X.shape}, 标签形状: {y.shape}")
    
    # 创建用于XGBoost的特征提取数据
    create_xgboost_features(X, y, behaviors, data_dir)
    
    return True

def create_xgboost_features(X, y, behaviors, data_dir):
    """
    从姿态数据中提取XGBoost模型的特征
    
    Args:
        X: 姿态数据 (n_samples, n_frames, n_features)
        y: 标签 (n_samples,)
        behaviors: 行为类别列表
        data_dir: 数据保存目录
    """
    logger.info("从姿态数据中提取XGBoost特征...")
    
    n_samples = X.shape[0]
    n_frames = X.shape[1]
    
    # 提取特征
    features = []
    
    for i in range(n_samples):
        sample_features = {}
        
        # 计算平均姿态
        mean_pose = np.mean(X[i], axis=0)
        
        # 提取关键特征
        # 1. 手腕与身体中心的平均距离
        left_wrist_x = mean_pose[15*3]
        left_wrist_y = mean_pose[15*3 + 1]
        right_wrist_x = mean_pose[16*3]
        right_wrist_y = mean_pose[16*3 + 1]
        
        hip_left_x = mean_pose[23*3]
        hip_left_y = mean_pose[23*3 + 1]
        hip_right_x = mean_pose[24*3]
        hip_right_y = mean_pose[24*3 + 1]
        
        mid_hip_x = (hip_left_x + hip_right_x) / 2
        mid_hip_y = (hip_left_y + hip_right_y) / 2
        
        left_wrist_dist = np.sqrt((left_wrist_x - mid_hip_x)**2 + (left_wrist_y - mid_hip_y)**2)
        right_wrist_dist = np.sqrt((right_wrist_x - mid_hip_x)**2 + (right_wrist_y - mid_hip_y)**2)
        
        # 2. 上半身高度比例
        shoulder_left_y = mean_pose[11*3 + 1]
        shoulder_right_y = mean_pose[12*3 + 1]
        mid_shoulder_y = (shoulder_left_y + shoulder_right_y) / 2
        
        torso_height = mid_hip_y - mid_shoulder_y
        
        # 3. 计算手臂弯曲角度
        # 左肩: 11, 左肘: 13, 左腕: 15
        left_shoulder = (mean_pose[11*3], mean_pose[11*3 + 1])
        left_elbow = (mean_pose[13*3], mean_pose[13*3 + 1])
        left_wrist = (left_wrist_x, left_wrist_y)
        
        # 右肩: 12, 右肘: 14, 右腕: 16
        right_shoulder = (mean_pose[12*3], mean_pose[12*3 + 1])
        right_elbow = (mean_pose[14*3], mean_pose[14*3 + 1])
        right_wrist = (right_wrist_x, right_wrist_y)
        
        # 简单计算角度 (可能需要改进)
        def calculate_angle(a, b, c):
            a = np.array(a)
            b = np.array(b)
            c = np.array(c)
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        
        left_arm_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_arm_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        
        # 组合特征
        sample_features = {
            "left_wrist_dist": left_wrist_dist,
            "right_wrist_dist": right_wrist_dist,
            "torso_height": torso_height,
            "left_arm_angle": left_arm_angle,
            "right_arm_angle": right_arm_angle,
            "wrist_hip_ratio_left": left_wrist_dist / torso_height if torso_height > 0 else 0,
            "wrist_hip_ratio_right": right_wrist_dist / torso_height if torso_height > 0 else 0,
            "arms_crossed": 1 if abs(left_wrist_x - right_wrist_x) < 50 else 0,
            "is_theft": 1 if behaviors[y[i]] != "normal" else 0
        }
        
        features.append(sample_features)
    
    # 转换为DataFrame
    df = pd.DataFrame(features)
    
    # 保存为CSV文件
    df.to_csv(data_dir / "pose_features_for_xgboost.csv", index=False)
    logger.info(f"XGBoost特征已保存到 {data_dir / 'pose_features_for_xgboost.csv'}")
    
    return df

def main():
    parser = argparse.ArgumentParser(description="下载和准备姿态数据用于盗窃行为检测")
    parser.add_argument("--dataset", type=str, default="synthetic", 
                        choices=["pkummd", "nturgbd", "synthetic", "all"],
                        help="要下载的数据集 (默认: synthetic)")
    
    args = parser.parse_args()
    
    if args.dataset == "pkummd" or args.dataset == "all":
        download_pkummd_dataset()
    
    if args.dataset == "nturgbd" or args.dataset == "all":
        download_nturgbd_dataset()
    
    if args.dataset == "synthetic" or args.dataset == "all":
        create_synthetic_pose_data()
    
    logger.info("完成数据集准备")
    
if __name__ == "__main__":
    main() 