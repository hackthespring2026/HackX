import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import xgboost as xgb
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
import logging
import subprocess
import argparse

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('xgb_trainer')

def train_xgboost_model(
    data_type="standard",
    data_path=None, 
    hyperparameter_tuning=False,
    model_dir="models",
    compare_models=False
):
    """
    训练XGBoost模型用于盗窃行为检测
    
    Args:
        data_type: 数据类型，可选 "standard" 或 "enhanced"
        data_path: 特征数据路径，如果为None则使用默认路径
        hyperparameter_tuning: 是否进行超参数调优
        model_dir: 模型保存目录
        compare_models: 是否比较不同模型性能
    
    Returns:
        训练好的XGBoost模型
    """
    try:
        is_enhanced = data_type == "enhanced"
        model_name = "enhanced_theft_xgb_model.pkl" if is_enhanced else "theft_xgb_model.pkl"
        
        logger.info(f"开始训练{'增强' if is_enhanced else '标准'}XGBoost模型...")
        
        # 检查模型目录是否存在
        model_output_dir = os.path.join(model_dir, "enhanced" if is_enhanced else "")
        os.makedirs(model_output_dir, exist_ok=True)
        model_path = os.path.join(model_output_dir, model_name)
        
        # 如果未指定数据路径，使用默认路径
        if data_path is None:
            if is_enhanced:
                data_path = Path("data/datasets/enhanced_synthetic/enhanced_pose_features_for_xgboost.csv")
            else:
                data_path = Path("data/datasets/synthetic/pose_features_for_xgboost.csv")
        else:
            data_path = Path(data_path)
        
        # 判断是否使用姿态数据
        if not data_path.exists():
            logger.warning(f"数据不存在: {data_path}，尝试下载或生成...")
            
            if is_enhanced:
                # 尝试生成增强数据
                logger.info("生成增强合成数据...")
                try:
                    subprocess.run(["python", "enhanced_synthetic_data.py", "--samples", "100"], check=True)
                except subprocess.CalledProcessError:
                    logger.error("增强数据生成失败！")
                    return None
            else:
                # 尝试生成标准数据
                logger.info("生成标准合成数据...")
                try:
                    subprocess.run(["python", "download_pose_data.py"], check=True)
                except subprocess.CalledProcessError:
                    logger.error("标准数据生成失败！")
                    return None
            
            # 再次检查数据
            if not data_path.exists():
                logger.error(f"数据生成后仍不存在: {data_path}")
                logger.info("将使用合成数据进行训练...")
                return _train_with_synthetic_data(model_path)
        
        logger.info(f"使用数据进行训练: {data_path}")
        df = pd.read_csv(data_path)
        
        # 分离特征和标签
        X = df.drop('is_theft', axis=1)
        y = df['is_theft']
        
        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
        
        logger.info(f"数据集信息 - 特征: {X.shape}, 标签: {y.shape}")
        logger.info(f"标签分布: {y.value_counts().to_dict()}")
        logger.info(f"特征列表: {list(X.columns)}")
        
        # 如果需要超参数调优
        if hyperparameter_tuning:
            logger.info("开始进行超参数调优...")
            model = _tune_hyperparameters(X_train, y_train)
        else:
            # 定义默认的XGBoost模型参数
            params = {
                'n_estimators': 100,
                'max_depth': 5,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'objective': 'binary:logistic',
                'eval_metric': 'logloss',
                'random_state': 42
            }
            
            # 初始化模型
            logger.info("使用默认参数训练XGBoost模型...")
            model = xgb.XGBClassifier(**params)
            
            # 进行k折交叉验证
            if len(X_train) > 50:  # 只有当训练集足够大时才进行交叉验证
                logger.info("进行5折交叉验证...")
                cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
                logger.info(f"交叉验证F1分数: {cv_scores}")
                logger.info(f"平均F1分数: {np.mean(cv_scores):.4f}, 标准差: {np.std(cv_scores):.4f}")
        
        # 最终训练模型
        logger.info("训练最终模型...")
        eval_set = [(X_test, y_test)]
        model.fit(X_train, y_train, eval_set=eval_set, verbose=True)
        
        # 在测试集上评估模型
        y_pred = model.predict(X_test)
        evaluate_model(y_test, y_pred)
        
        # 绘制特征重要性
        plots_dir = os.path.join(model_output_dir, "plots")
        os.makedirs(plots_dir, exist_ok=True)
        plot_feature_importance(model, X.columns, plots_dir)
        
        # 绘制混淆矩阵
        plot_confusion_matrix(y_test, y_pred, plots_dir)
        
        # 保存模型
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        logger.info(f"XGBoost模型已保存到 {model_path}")
        
        # 比较与另一个模型的差异
        if compare_models:
            other_model_path = os.path.join(model_dir, "" if is_enhanced else "enhanced", 
                              "theft_xgb_model.pkl" if is_enhanced else "enhanced_theft_xgb_model.pkl")
            compare_with_other_model(X_test, y_test, model, other_model_path, plots_dir)
        
        return model
    except Exception as e:
        logger.error(f"训练XGBoost模型时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def _tune_hyperparameters(X_train, y_train):
    """超参数调优"""
    # 定义参数网格
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0],
        'gamma': [0, 0.1, 0.2]
    }
    
    # 初始化XGBoost模型
    xgb_model = xgb.XGBClassifier(objective='binary:logistic', 
                                 eval_metric='logloss',
                                 random_state=42)
    
    # 使用GridSearchCV进行超参数调优
    grid_search = GridSearchCV(
        estimator=xgb_model,
        param_grid=param_grid,
        cv=5,
        scoring='f1',
        verbose=1,
        n_jobs=-1
    )
    
    # 训练模型
    grid_search.fit(X_train, y_train)
    
    # 获取最佳参数
    best_params = grid_search.best_params_
    logger.info(f"最佳参数: {best_params}")
    
    # 使用最佳参数构建模型
    return xgb.XGBClassifier(**best_params, random_state=42)

def _train_with_synthetic_data(model_path):
    """使用合成数据训练模型"""
    logger.info("生成合成训练数据...")
    
    # 判断是否有训练数据
    data_file = os.path.join('models', 'theft_detection_data.csv')
    
    # 生成合成数据进行示例训练
    np.random.seed(42)
    
    # 特征名称
    feature_names = [
        "person_count", "tool_count", "normal_object_count",
        "mask_detected", "unusual_posture", "reaching_motion",
        "night_scene", "edge_proximity", "drawer_proximity",
        "movement_detected", "mean_magnitude", "direction_changes",
        "suspicious_movement", "image_brightness", "image_contrast",
        "person_with_tool" 
    ]
    
    # 生成正常行为样本 (非盗窃)
    n_normal = 300
    normal_data = np.random.rand(n_normal, len(feature_names))
    # 调整正常样本的特征分布
    normal_data[:, 0] = np.random.poisson(1, n_normal)  # person_count
    normal_data[:, 1] = np.random.binomial(1, 0.05, n_normal)  # tool_count
    normal_data[:, 2] = np.random.poisson(2, n_normal)  # normal_object_count
    normal_data[:, 3] = np.random.binomial(1, 0.1, n_normal)  # mask_detected
    normal_data[:, 4] = np.random.binomial(1, 0.1, n_normal)  # unusual_posture
    normal_data[:, 5] = np.random.binomial(1, 0.1, n_normal)  # reaching_motion
    normal_data[:, 6] = np.random.binomial(1, 0.1, n_normal)  # night_scene
    normal_data[:, 7] = np.random.binomial(1, 0.1, n_normal)  # edge_proximity
    normal_data[:, 8] = np.random.binomial(1, 0.1, n_normal)  # drawer_proximity
    normal_data[:, 12] = np.random.binomial(1, 0.05, n_normal)  # suspicious_movement
    normal_data[:, 13] = 120 + 50 * np.random.randn(n_normal)  # image_brightness
    normal_data[:, 15] = np.random.binomial(1, 0.01, n_normal)  # person_with_tool
    
    # 生成盗窃行为样本
    n_theft = 100
    theft_data = np.random.rand(n_theft, len(feature_names))
    # 调整盗窃样本的特征分布
    theft_data[:, 0] = np.random.poisson(1, n_theft)  # person_count
    theft_data[:, 1] = np.random.binomial(1, 0.7, n_theft)  # tool_count
    theft_data[:, 2] = np.random.poisson(1, n_theft)  # normal_object_count
    theft_data[:, 3] = np.random.binomial(1, 0.6, n_theft)  # mask_detected
    theft_data[:, 4] = np.random.binomial(1, 0.7, n_theft)  # unusual_posture
    theft_data[:, 5] = np.random.binomial(1, 0.8, n_theft)  # reaching_motion
    theft_data[:, 6] = np.random.binomial(1, 0.6, n_theft)  # night_scene
    theft_data[:, 7] = np.random.binomial(1, 0.7, n_theft)  # edge_proximity
    theft_data[:, 8] = np.random.binomial(1, 0.6, n_theft)  # drawer_proximity
    theft_data[:, 12] = np.random.binomial(1, 0.7, n_theft)  # suspicious_movement
    theft_data[:, 13] = 70 + 40 * np.random.randn(n_theft)  # image_brightness
    theft_data[:, 15] = np.random.binomial(1, 0.6, n_theft)  # person_with_tool
    
    # 合并数据
    X = np.vstack([normal_data, theft_data])
    y = np.hstack([np.zeros(n_normal), np.ones(n_theft)])
    
    # 创建DataFrame方便处理
    X = pd.DataFrame(X, columns=feature_names)
    
    # 保存合成数据，方便后续使用
    data = X.copy()
    data['is_theft'] = y
    data.to_csv(data_file, index=False)
    logger.info(f"已保存合成训练数据到{data_file}")

    # 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 定义XGBoost模型参数
    params = {
        'n_estimators': 100,
        'max_depth': 5,
        'learning_rate': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'objective': 'binary:logistic',
        'eval_metric': 'logloss',
        'random_state': 42
    }
    
    # 训练模型
    logger.info("训练XGBoost模型...")
    model = xgb.XGBClassifier(**params)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=True)
    
    # 评估模型
    y_pred = model.predict(X_test)
    evaluate_model(y_test, y_pred)
    
    # 绘制特征重要性
    plots_dir = os.path.join(os.path.dirname(model_path), "plots")
    os.makedirs(plots_dir, exist_ok=True)
    plot_feature_importance(model, X.columns, plots_dir)
    
    # 绘制混淆矩阵
    plot_confusion_matrix(y_test, y_pred, plots_dir)
    
    # 保存模型
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    logger.info(f"XGBoost模型已保存到 {model_path}")
    return model

def evaluate_model(y_true, y_pred):
    """
    评估模型性能
    
    Args:
        y_true: 真实标签
        y_pred: 预测标签
    """
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred)
    recall = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    
    logger.info("模型评估结果:")
    logger.info(f"准确率 (Accuracy): {accuracy:.4f}")
    logger.info(f"精确率 (Precision): {precision:.4f}")
    logger.info(f"召回率 (Recall): {recall:.4f}")
    logger.info(f"F1分数: {f1:.4f}")
    
    # 输出详细分类报告
    report = classification_report(y_true, y_pred)
    logger.info(f"分类报告:\n{report}")

def plot_feature_importance(model, feature_names, plots_dir):
    """
    绘制特征重要性
    
    Args:
        model: 训练好的XGBoost模型
        feature_names: 特征名称
        plots_dir: 图表保存目录
    """
    # 获取特征重要性
    importance = model.feature_importances_
    
    # 创建DataFrame
    importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importance
    })
    
    # 按重要性排序
    importance_df = importance_df.sort_values('Importance', ascending=False)
    
    # 绘制条形图
    plt.figure(figsize=(12, 8))
    ax = sns.barplot(x='Importance', y='Feature', data=importance_df)
    plt.title('特征重要性')
    
    # 添加数值标签
    for i, v in enumerate(importance_df['Importance']):
        ax.text(v + 0.01, i, f"{v:.4f}", va='center')
    
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "feature_importance.png"))
    plt.close()
    
    logger.info(f"特征重要性已保存到 {os.path.join(plots_dir, 'feature_importance.png')}")
    
    # 保存特征重要性数据
    importance_df.to_csv(os.path.join(plots_dir, "feature_importance.csv"), index=False)

def plot_confusion_matrix(y_true, y_pred, plots_dir):
    """
    绘制混淆矩阵
    
    Args:
        y_true: 真实标签
        y_pred: 预测标签
        plots_dir: 图表保存目录
    """
    # 计算混淆矩阵
    cm = confusion_matrix(y_true, y_pred)
    
    # 绘制混淆矩阵
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
    plt.title('混淆矩阵')
    plt.ylabel('真实标签')
    plt.xlabel('预测标签')
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, "confusion_matrix.png"))
    plt.close()
    
    logger.info(f"混淆矩阵已保存到 {os.path.join(plots_dir, 'confusion_matrix.png')}")

def compare_with_other_model(X_test, y_test, current_model, other_model_path, plots_dir):
    """
    比较当前模型与另一个模型的性能差异
    
    Args:
        X_test: 测试特征
        y_test: 测试标签
        current_model: 当前训练的模型
        other_model_path: 要比较的模型路径
        plots_dir: 图表保存目录
    """
    # 检查另一个模型是否存在
    if not os.path.exists(other_model_path):
        logger.info(f"比较模型不存在: {other_model_path}，无法进行比较")
        return
    
    try:
        # 加载另一个模型
        with open(other_model_path, 'rb') as f:
            other_model = pickle.load(f)
        
        model_name = os.path.basename(other_model_path).replace('.pkl', '')
        logger.info(f"已加载比较模型: {model_name}")
        
        # 确保测试数据与另一个模型兼容
        # 如果两个模型的特征集不同，需要进行适配
        try:
            current_features = set(current_model.feature_names_in_)
            other_features = set(other_model.feature_names_in_)
        except:
            logger.info("无法获取模型的特征名称，跳过特征比较")
            current_features = set(X_test.columns)
            other_features = current_features
        
        if current_features != other_features:
            logger.info("两个模型使用不同的特征集，创建特征子集进行比较")
            # 查找共同的特征
            common_features = list(current_features.intersection(other_features))
            if not common_features:
                logger.info("没有共同特征，无法进行比较")
                return
            
            # 使用共同特征创建测试集
            X_test_common = X_test[common_features]
            
            # 使用另一个模型进行预测
            y_pred_other = other_model.predict(X_test_common)
            # 使用当前模型进行预测 (确保使用相同特征)
            y_pred_current = current_model.predict(X_test_common)
        else:
            # 特征集相同，直接预测
            y_pred_other = other_model.predict(X_test)
            y_pred_current = current_model.predict(X_test)
        
        # 计算性能指标
        current_accuracy = accuracy_score(y_test, y_pred_current)
        current_precision = precision_score(y_test, y_pred_current)
        current_recall = recall_score(y_test, y_pred_current)
        current_f1 = f1_score(y_test, y_pred_current)
        
        other_accuracy = accuracy_score(y_test, y_pred_other)
        other_precision = precision_score(y_test, y_pred_other)
        other_recall = recall_score(y_test, y_pred_other)
        other_f1 = f1_score(y_test, y_pred_other)
        
        # 输出比较结果
        logger.info("模型性能比较 (当前 vs 比较):")
        logger.info(f"准确率 (Accuracy): {current_accuracy:.4f} vs {other_accuracy:.4f} ({(current_accuracy-other_accuracy)*100:.2f}%)")
        logger.info(f"精确率 (Precision): {current_precision:.4f} vs {other_precision:.4f} ({(current_precision-other_precision)*100:.2f}%)")
        logger.info(f"召回率 (Recall): {current_recall:.4f} vs {other_recall:.4f} ({(current_recall-other_recall)*100:.2f}%)")
        logger.info(f"F1分数: {current_f1:.4f} vs {other_f1:.4f} ({(current_f1-other_f1)*100:.2f}%)")
        
        # 绘制比较条形图
        metrics = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
        current_scores = [current_accuracy, current_precision, current_recall, current_f1]
        other_scores = [other_accuracy, other_precision, other_recall, other_f1]
        
        plt.figure(figsize=(12, 8))
        x = np.arange(len(metrics))
        width = 0.35
        
        plt.bar(x - width/2, current_scores, width, label='当前模型')
        plt.bar(x + width/2, other_scores, width, label=f'比较模型 ({model_name})')
        
        plt.title('模型性能比较')
        plt.xticks(x, metrics)
        plt.ylim(0, 1.1)
        plt.xlabel('评估指标')
        plt.ylabel('分数')
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        # 添加数值标签
        for i, v in enumerate(current_scores):
            plt.text(i - width/2, v + 0.02, f"{v:.4f}", ha='center')
        
        for i, v in enumerate(other_scores):
            plt.text(i + width/2, v + 0.02, f"{v:.4f}", ha='center')
        
        plt.tight_layout()
        plt.savefig(os.path.join(plots_dir, "model_comparison.png"))
        plt.close()
        
        logger.info(f"模型比较图已保存到 {os.path.join(plots_dir, 'model_comparison.png')}")
    except Exception as e:
        logger.error(f"比较模型时出错: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="训练XGBoost模型用于盗窃行为检测")
    parser.add_argument("--data-type", type=str, default="standard", choices=["standard", "enhanced"], 
                      help="使用的数据类型: standard (标准) 或 enhanced (增强)")
    parser.add_argument("--data", type=str, default=None, help="特征数据CSV路径")
    parser.add_argument("--tune", action="store_true", help="进行超参数调优")
    parser.add_argument("--model-dir", type=str, default="models", help="模型保存目录")
    parser.add_argument("--compare", action="store_true", help="与另一种模型比较性能")
    
    args = parser.parse_args()
    
    train_xgboost_model(
        data_type=args.data_type,
        data_path=args.data,
        hyperparameter_tuning=args.tune,
        model_dir=args.model_dir,
        compare_models=args.compare
    ) 