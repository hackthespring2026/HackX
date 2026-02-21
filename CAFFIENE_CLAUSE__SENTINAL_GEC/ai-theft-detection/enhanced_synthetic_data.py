import os
import numpy as np
import pandas as pd
import pickle
import logging
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('enhanced_pose_dataset')

def generate_enhanced_synthetic_data(n_samples_per_class=200, n_frames_per_sample=30, add_noise=True):
    """
    生成增强的合成姿态数据，包含更多样本和更多变化
    
    Args:
        n_samples_per_class: 每个类别的样本数
        n_frames_per_sample: 每个样本的帧数
        add_noise: 是否添加噪声增强数据多样性
        
    Returns:
        保存的数据路径
    """
    data_dir = Path("data/datasets/enhanced_synthetic")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("创建增强合成姿态数据用于模型训练...")
    
    # 定义行为类别 - 增加了更多类别
    behaviors = [
        "normal",              # 正常行为
        "abnormal_arm",        # 异常手臂位置
        "crouching",           # 蹲姿
        "reaching",            # 伸手
        "body_shielding",      # 身体屏蔽
        "head_movement",       # 异常头部运动
        "item_hiding",         # 藏匿物品
        "tag_removal",         # 撕标签
        "looking_around",      # 四处张望
        "following_movement",  # 跟随他人移动
        "distraction",         # 制造分散注意力
        "quick_grab"           # 快速抓取
    ]
    
    # 创建合成数据
    all_data = []
    all_labels = []
    
    for behavior_idx, behavior in enumerate(behaviors):
        logger.info(f"生成 {behavior} 行为数据...")
        
        for sample_idx in range(n_samples_per_class):
            sample_data = []
            
            # 基础姿态初始值 - 让每个样本序列有一个起点
            base_landmarks = {}
            for i in range(33):  # MediaPipe有33个关键点
                base_landmarks[i] = {
                    'x': np.random.randint(100, 500),
                    'y': np.random.randint(100, 500),
                    'visibility': np.random.uniform(0.5, 1.0)
                }
            
            # 创建时间序列 - 动作会随时间发展
            for frame_idx in range(n_frames_per_sample):
                # 复制基础姿态
                landmarks = {}
                for i in range(33):
                    landmarks[i] = {
                        'x': base_landmarks[i]['x'],
                        'y': base_landmarks[i]['y'],
                        'visibility': base_landmarks[i]['visibility']
                    }
                
                # 添加时间变化因素 (0-1之间的值，表示动作完成度)
                t = frame_idx / (n_frames_per_sample - 1)
                
                # 根据行为类型修改姿态，并随时间变化
                if behavior == "normal":
                    # 正常姿态，仅添加小幅度自然运动
                    for i in range(33):
                        if add_noise:
                            landmarks[i]['x'] += np.random.randint(-5, 6)
                            landmarks[i]['y'] += np.random.randint(-5, 6)
                    
                elif behavior == "abnormal_arm":
                    # 异常手臂位置 - 手腕靠近身体中心
                    mid_x = (landmarks[23]['x'] + landmarks[24]['x']) / 2
                    mid_y = (landmarks[23]['y'] + landmarks[24]['y']) / 2
                    
                    # 随时间靠近身体中心
                    landmarks[15]['x'] = landmarks[15]['x'] * (1-t) + (mid_x + np.random.randint(-30, 31)) * t
                    landmarks[15]['y'] = landmarks[15]['y'] * (1-t) + (mid_y + np.random.randint(-30, 31)) * t
                    
                    # 可能同时移动另一只手
                    if np.random.random() > 0.5:
                        landmarks[16]['x'] = landmarks[16]['x'] * (1-t) + (mid_x + np.random.randint(-30, 31)) * t
                        landmarks[16]['y'] = landmarks[16]['y'] * (1-t) + (mid_y + np.random.randint(-30, 31)) * t
                    
                elif behavior == "crouching":
                    # 蹲姿 - 降低身体位置
                    crouch_factor = t * 100  # 随时间增加下蹲程度
                    for i in [23, 24, 25, 26]:  # 臀部和膝盖
                        landmarks[i]['y'] += crouch_factor + np.random.randint(0, 20)
                    
                    # 头部也会随之下移，但幅度较小
                    for i in range(11):  # 面部关键点
                        landmarks[i]['y'] += crouch_factor * 0.4 + np.random.randint(0, 10)
                    
                elif behavior == "reaching":
                    # 伸手 - 延长手臂
                    arm_side = np.random.choice(["left", "right"])
                    reach_factor = 100 * t  # 随时间增加伸手的程度
                    
                    if arm_side == "left":
                        landmarks[15]['x'] -= reach_factor + np.random.randint(0, 30)
                        # 可能稍微调整高度
                        if np.random.random() > 0.7:
                            landmarks[15]['y'] -= np.random.randint(0, 40)
                    else:
                        landmarks[16]['x'] += reach_factor + np.random.randint(0, 30)
                        # 可能稍微调整高度
                        if np.random.random() > 0.7:
                            landmarks[16]['y'] -= np.random.randint(0, 40)
                    
                elif behavior == "body_shielding":
                    # 身体屏蔽 - 手臂交叉或身体旋转
                    if np.random.random() > 0.5:
                        # 手臂交叉
                        cross_factor = t * 30
                        landmarks[13]['x'] = landmarks[13]['x'] * (1-t) + landmarks[14]['x'] * t
                        landmarks[15]['x'] = landmarks[15]['x'] * (1-t) + landmarks[16]['x'] * t
                    else:
                        # 身体旋转 - 肩膀宽度减小表示转身
                        rotate_factor = 1 - t*0.4
                        mid_x = (landmarks[11]['x'] + landmarks[12]['x']) / 2
                        distance = landmarks[12]['x'] - landmarks[11]['x']
                        landmarks[11]['x'] = mid_x - distance * rotate_factor / 2
                        landmarks[12]['x'] = mid_x + distance * rotate_factor / 2
                    
                elif behavior == "head_movement":
                    # 异常头部运动 - 头部快速转动
                    head_turn = np.sin(t * np.pi * 2) * 20
                    for i in range(11):  # 面部关键点
                        landmarks[i]['x'] += head_turn
                    
                elif behavior == "item_hiding":
                    # 藏匿物品 - 手腕移动到隐蔽位置
                    side = np.random.choice(["left", "right"])
                    hide_factor = t
                    
                    if side == "left":
                        # 从原位置逐渐移动到口袋或隐藏处
                        target_x = landmarks[23]['x'] + np.random.randint(-20, 21)
                        target_y = landmarks[23]['y'] + np.random.randint(-20, 21)
                        landmarks[15]['x'] = landmarks[15]['x'] * (1-hide_factor) + target_x * hide_factor
                        landmarks[15]['y'] = landmarks[15]['y'] * (1-hide_factor) + target_y * hide_factor
                    else:
                        target_x = landmarks[24]['x'] + np.random.randint(-20, 21)
                        target_y = landmarks[24]['y'] + np.random.randint(-20, 21)
                        landmarks[16]['x'] = landmarks[16]['x'] * (1-hide_factor) + target_x * hide_factor
                        landmarks[16]['y'] = landmarks[16]['y'] * (1-hide_factor) + target_y * hide_factor
                    
                elif behavior == "tag_removal":
                    # 撕标签 - 手指靠近嘴部或腰部
                    target = np.random.choice(["mouth", "waist"])
                    removal_factor = t
                    
                    if target == "mouth":
                        # 手移动到嘴边
                        target_x = landmarks[0]['x'] + np.random.randint(-20, 21)
                        target_y = landmarks[0]['y'] + np.random.randint(-20, 21)
                        landmarks[15]['x'] = landmarks[15]['x'] * (1-removal_factor) + target_x * removal_factor
                        landmarks[15]['y'] = landmarks[15]['y'] * (1-removal_factor) + target_y * removal_factor
                    else:
                        # 手移动到腰部
                        mid_waist_x = (landmarks[23]['x'] + landmarks[24]['x']) / 2
                        mid_waist_y = (landmarks[23]['y'] + landmarks[24]['y']) / 2
                        target_x = mid_waist_x + np.random.randint(-20, 21)
                        target_y = mid_waist_y + np.random.randint(-50, 0)
                        landmarks[15]['x'] = landmarks[15]['x'] * (1-removal_factor) + target_x * removal_factor
                        landmarks[15]['y'] = landmarks[15]['y'] * (1-removal_factor) + target_y * removal_factor
                
                elif behavior == "looking_around":
                    # 四处张望 - 头部四处转动，表现紧张/观察
                    look_phase = t * 2 * np.pi  # 周期性运动
                    head_x_shift = np.sin(look_phase) * 30
                    head_y_shift = np.cos(look_phase) * 10
                    
                    # 应用到头部所有关键点
                    for i in range(11):
                        landmarks[i]['x'] += head_x_shift
                        landmarks[i]['y'] += head_y_shift
                
                elif behavior == "following_movement":
                    # 跟随他人移动 - 身体整体移动
                    move_x = np.sin(t * np.pi) * 50
                    
                    # 整体移动所有关键点
                    for i in range(33):
                        landmarks[i]['x'] += move_x
                
                elif behavior == "distraction":
                    # 制造分散注意力 - 手臂大幅度摆动
                    distract_phase = t * 2 * np.pi  # 周期性运动
                    
                    # 手臂摆动
                    arm_wave = np.sin(distract_phase) * 60
                    landmarks[13]['y'] += arm_wave
                    landmarks[15]['y'] += arm_wave * 1.5
                
                elif behavior == "quick_grab":
                    # 快速抓取动作
                    if t < 0.4:  # 前40%时间伸手
                        reach_factor = t / 0.4 * 100
                        landmarks[15]['x'] -= reach_factor
                        landmarks[15]['y'] -= reach_factor * 0.5
                    elif t < 0.6:  # 中间20%抓取
                        landmarks[15]['x'] = landmarks[15]['x']
                        landmarks[15]['y'] = landmarks[15]['y']
                    else:  # 后40%收回
                        return_factor = (t - 0.6) / 0.4
                        landmarks[15]['x'] = landmarks[15]['x'] * (1-return_factor) + base_landmarks[15]['x'] * return_factor
                        landmarks[15]['y'] = landmarks[15]['y'] * (1-return_factor) + base_landmarks[15]['y'] * return_factor
                
                # 添加自然的随机抖动
                if add_noise:
                    for i in range(33):
                        landmarks[i]['x'] += np.random.randint(-3, 4)
                        landmarks[i]['y'] += np.random.randint(-3, 4)
                        landmarks[i]['visibility'] = max(0.1, min(1.0, landmarks[i]['visibility'] + np.random.uniform(-0.05, 0.05)))
                
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
    with open(data_dir / "enhanced_synthetic_pose_data.pkl", "wb") as f:
        pickle.dump({
            "X": X,
            "y": y,
            "behaviors": behaviors
        }, f)
    
    logger.info(f"增强合成数据已保存到 {data_dir / 'enhanced_synthetic_pose_data.pkl'}")
    logger.info(f"数据形状: {X.shape}, 标签形状: {y.shape}")
    
    # 创建用于XGBoost的特征提取数据
    features_file = create_enhanced_xgboost_features(X, y, behaviors, data_dir)
    
    # 可视化一些样本数据
    visualize_samples(X, y, behaviors, data_dir)
    
    return features_file

def create_enhanced_xgboost_features(X, y, behaviors, data_dir):
    """
    从增强姿态数据中提取XGBoost模型的特征
    
    Args:
        X: 姿态数据 (n_samples, n_frames, n_features)
        y: 标签 (n_samples,)
        behaviors: 行为类别列表
        data_dir: 数据保存目录
    """
    logger.info("从增强姿态数据中提取XGBoost特征...")
    
    n_samples = X.shape[0]
    n_frames = X.shape[1]
    
    # 提取特征
    features = []
    
    for i in range(n_samples):
        # 计算平均姿态和时间序列特征
        mean_pose = np.mean(X[i], axis=0)
        std_pose = np.std(X[i], axis=0)
        max_pose = np.max(X[i], axis=0)
        min_pose = np.min(X[i], axis=0)
        
        # 提取更多关键特征
        
        # 1. 手腕与身体中心的平均距离和变化
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
        
        # 计算手腕距离的标准差（移动幅度）
        left_wrist_x_series = X[i, :, 15*3]
        left_wrist_y_series = X[i, :, 15*3 + 1]
        right_wrist_x_series = X[i, :, 16*3]
        right_wrist_y_series = X[i, :, 16*3 + 1]
        
        left_wrist_dist_series = np.sqrt((left_wrist_x_series - mid_hip_x)**2 + (left_wrist_y_series - mid_hip_y)**2)
        right_wrist_dist_series = np.sqrt((right_wrist_x_series - mid_hip_x)**2 + (right_wrist_y_series - mid_hip_y)**2)
        
        left_wrist_dist_std = np.std(left_wrist_dist_series)
        right_wrist_dist_std = np.std(right_wrist_dist_series)
        
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
        
        # 计算角度
        def calculate_angle(a, b, c):
            a = np.array(a)
            b = np.array(b)
            c = np.array(c)
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-10)
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        
        left_arm_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
        right_arm_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        
        # 4. 头部运动
        nose_x_series = X[i, :, 0*3]
        nose_y_series = X[i, :, 0*3 + 1]
        head_x_movement = np.std(nose_x_series)
        head_y_movement = np.std(nose_y_series)
        
        # 5. 肩膀宽度及其变化
        shoulder_width = np.sqrt((right_shoulder[0] - left_shoulder[0])**2 + (right_shoulder[1] - left_shoulder[1])**2)
        
        left_shoulder_x_series = X[i, :, 11*3]
        right_shoulder_x_series = X[i, :, 12*3]
        shoulder_width_series = np.abs(right_shoulder_x_series - left_shoulder_x_series)
        shoulder_width_std = np.std(shoulder_width_series)
        
        # 组合特征
        sample_features = {
            "left_wrist_dist": left_wrist_dist,
            "right_wrist_dist": right_wrist_dist,
            "left_wrist_movement": left_wrist_dist_std,
            "right_wrist_movement": right_wrist_dist_std,
            "torso_height": torso_height,
            "left_arm_angle": left_arm_angle,
            "right_arm_angle": right_arm_angle,
            "wrist_hip_ratio_left": left_wrist_dist / torso_height if torso_height > 0 else 0,
            "wrist_hip_ratio_right": right_wrist_dist / torso_height if torso_height > 0 else 0,
            "arms_crossed": 1 if abs(left_wrist_x - right_wrist_x) < 50 else 0,
            "head_x_movement": head_x_movement,
            "head_y_movement": head_y_movement,
            "shoulder_width": shoulder_width,
            "shoulder_width_change": shoulder_width_std,
            "is_theft": 1 if behaviors[y[i]] != "normal" else 0
        }
        
        features.append(sample_features)
    
    # 转换为DataFrame
    df = pd.DataFrame(features)
    
    # 保存为CSV文件
    features_file = data_dir / "enhanced_pose_features_for_xgboost.csv"
    df.to_csv(features_file, index=False)
    logger.info(f"增强XGBoost特征已保存到 {features_file}")
    
    return features_file

def visualize_samples(X, y, behaviors, data_dir):
    """
    可视化一些样本数据
    
    Args:
        X: 姿态数据 (n_samples, n_frames, n_features)
        y: 标签 (n_samples,)
        behaviors: 行为类别列表
        data_dir: 数据保存目录
    """
    # 创建可视化目录
    vis_dir = data_dir / "visualizations"
    vis_dir.mkdir(exist_ok=True)
    
    logger.info("生成样本可视化...")
    
    # 对每种行为选择一个样本可视化
    for behavior_idx, behavior in enumerate(behaviors):
        # 查找此行为的样本
        behavior_samples = np.where(y == behavior_idx)[0]
        if len(behavior_samples) == 0:
            continue
            
        # 选取第一个样本
        sample_idx = behavior_samples[0]
        sample = X[sample_idx]
        
        plt.figure(figsize=(15, 10))
        
        # 选择几个关键点可视化
        key_points = {
            0: "鼻子",     # 鼻子
            11: "左肩",    # 左肩
            12: "右肩",    # 右肩  
            13: "左肘",    # 左肘
            14: "右肘",    # 右肘
            15: "左腕",    # 左腕
            16: "右腕",    # 右腕
            23: "左臀",    # 左臀
            24: "右臀",    # 右臀
            25: "左膝",    # 左膝
            26: "右膝"     # 右膝
        }
        
        # 为每个关键点创建时间序列图
        for point_idx, point_name in key_points.items():
            # X坐标时间序列
            x_coords = sample[:, point_idx*3]
            y_coords = sample[:, point_idx*3 + 1]
            
            plt.subplot(len(key_points), 2, list(key_points.keys()).index(point_idx)*2 + 1)
            plt.plot(x_coords)
            plt.title(f"{point_name} X坐标")
            plt.grid(True)
            
            plt.subplot(len(key_points), 2, list(key_points.keys()).index(point_idx)*2 + 2)
            plt.plot(y_coords)
            plt.title(f"{point_name} Y坐标")
            plt.grid(True)
        
        plt.tight_layout()
        plt.savefig(vis_dir / f"{behavior}_sample_visualization.png")
        plt.close()
    
    logger.info(f"样本可视化已保存到 {vis_dir}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="生成增强的合成姿态数据用于盗窃行为检测")
    parser.add_argument("--samples", type=int, default=200, help="每类行为的样本数量")
    parser.add_argument("--frames", type=int, default=30, help="每个样本的帧数")
    parser.add_argument("--no-noise", action="store_true", help="不添加随机噪声")
    parser.add_argument("--visualize", action="store_true", help="可视化样本数据")
    
    args = parser.parse_args()
    
    logger.info(f"正在生成增强的合成姿态数据，每类 {args.samples} 个样本，每个样本 {args.frames} 帧...")
    features_file = generate_enhanced_synthetic_data(
        n_samples_per_class=args.samples,
        n_frames_per_sample=args.frames,
        add_noise=not args.no_noise
    )
    
    logger.info("完成增强合成数据生成")
    logger.info(f"XGBoost特征已保存到: {features_file}")
    
if __name__ == "__main__":
    main() 