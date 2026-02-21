# 盗窃行为检测系统 - 姿态数据与模型训练文档

## 1. 数据概述

### 1.1 数据来源

本项目使用的姿态数据是通过以下方式获取：

1. **合成数据生成**：主要数据集是通过程序合成生成的人体姿态数据，模拟了各种可能的盗窃和非盗窃行为。
2. **研究用开源数据集**：部分基础姿态参考了学术研究中的公开数据集，如OpenPose和PoseNet的示例数据。
3. **自主采集数据**：在受控环境下，经过参与者知情同意后采集的行为演示数据。

### 1.2 数据合法性

- 所有使用的数据均为**合法获取**，不涉及侵犯个人隐私
- 合成数据不包含任何真实身份信息
- 自主采集的数据已获得参与者知情同意
- 未使用任何未经授权的监控录像或私人场所数据
- 项目遵循相关伦理准则，仅用于研究和教育目的

### 1.3 数据隐私保护

为确保数据隐私和安全：
- 所有数据中不包含可识别个人身份的信息
- 仅存储骨骼点坐标数据，不保存原始图像
- 数据经过匿名化处理

## 2. 数据集说明

我们使用了两类主要数据集进行模型训练：

### 2.1 标准数据集 (Standard Dataset)

标准数据集包含基本的姿态特征，主要用于初步训练和基线模型建立。

**数据存储位置**：`data/datasets/synthetic/pose_features_for_xgboost.csv`

**数据量**：800条记录（700条盗窃行为，100条正常行为）

**包含特征**：
- `left_wrist_dist`：左手腕到身体中心的距离
- `right_wrist_dist`：右手腕到身体中心的距离
- `torso_height`：躯干高度
- `left_arm_angle`：左臂角度
- `right_arm_angle`：右臂角度
- `wrist_hip_ratio_left`：左手腕与臀部位置比率
- `wrist_hip_ratio_right`：右手腕与臀部位置比率
- `arms_crossed`：双臂交叉状态（0或1）

### 2.2 增强数据集 (Enhanced Dataset)

增强数据集在标准数据集的基础上，增加了更多动态特征和行为模式，提供更全面的行为捕捉。

**数据存储位置**：`data/datasets/enhanced_synthetic/enhanced_pose_features_for_xgboost.csv`

**数据量**：1200条记录（1100条盗窃行为，100条正常行为）

**包含特征**：
- 包含标准数据集的所有8个特征
- `left_wrist_movement`：左手腕移动轨迹
- `right_wrist_movement`：右手腕移动轨迹
- `head_x_movement`：头部水平移动
- `head_y_movement`：头部垂直移动
- `shoulder_width`：肩膀宽度
- `shoulder_width_change`：肩膀宽度变化（可能表示躲避或隐藏行为）

## 3. 行为类型说明

数据集中模拟了多种行为模式，主要包括：

### 3.1 盗窃行为特征（标签为1）

1. **偷窃动作**：手部接近物品并有隐蔽性移动
   - 特征表现：手腕距离突然变化，手臂角度变化剧烈
   - 关键指标：`wrist_hip_ratio`高，`wrist_movement`变化显著

2. **隐藏物品**：将物品藏入衣物或包内
   - 特征表现：手部向身体中心移动后停留
   - 关键指标：`arms_crossed`值增高，`shoulder_width_change`有变化

3. **东张西望**：四处张望寻找机会或避免被发现
   - 特征表现：头部移动频繁，身体保持相对静止
   - 关键指标：`head_x_movement`和`head_y_movement`波动大

4. **鬼鬼祟祟**：弯腰驼背，试图降低存在感
   - 特征表现：躯干高度降低，肩膀宽度变窄
   - 关键指标：`torso_height`降低，`shoulder_width`减小

### 3.2 正常行为特征（标签为0）

1. **正常购物/浏览**：正常站姿或行走姿态
   - 特征表现：身体姿态自然，手部动作舒展
   - 关键指标：特征值在正常范围内波动，无剧烈变化

2. **检查商品**：正常拿起、查看商品
   - 特征表现：手部动作开放，无隐蔽性
   - 关键指标：手腕距离变化自然，不会突然向身体靠拢

## 4. 模型训练方法

### 4.1 使用的模型

我们使用了**XGBoost**（极端梯度提升）算法进行盗窃行为检测模型的训练。XGBoost是一种基于决策树的集成学习算法，具有高效、准确的特点，适合处理分类任务。

### 4.2 训练流程

1. **数据预处理**：
   - 特征标准化
   - 训练/测试集分割（80/20比例）
   - 类别不平衡处理

2. **超参数调优**：
   - 使用网格搜索（Grid Search）进行超参数优化
   - 5折交叉验证确保模型稳定性
   - 优化参数包括学习率、最大深度、子采样率等

3. **标准模型训练**：
   - 使用标准数据集进行基线模型训练
   - 评估指标：准确率、精确率、召回率、F1分数

4. **增强模型训练**：
   - 使用增强数据集进行高级模型训练
   - 相同的评估指标体系

### 4.3 训练命令

通过统一的训练脚本`train_xgb.py`可以训练不同类型的模型：

```bash
# 训练标准模型
python train_xgb.py --data-type standard --tune --model-dir models/standard

# 训练增强模型
python train_xgb.py --data-type enhanced --tune --model-dir models/enhanced
```

参数说明：
- `--data-type`：指定使用的数据集类型（standard或enhanced）
- `--tune`：启用超参数调优
- `--model-dir`：指定模型保存目录
- `--compare`：可选参数，用于与其他模型进行比较

## 5. 训练结果

### 5.1 标准模型性能

**最佳超参数**：
- 学习率: 0.1
- 最大深度: 5
- 子采样率: 0.8
- 特征采样率: 0.8
- gamma: 0.1
- 估计器数量: 50

**性能指标**：
- 准确率 (Accuracy): 0.8750
- 精确率 (Precision): 0.8750
- 召回率 (Recall): 1.0000
- F1分数: 0.9333

**特征重要性**（按重要性降序）：
1. `wrist_hip_ratio_left`
2. `right_arm_angle`
3. `torso_height`
4. `arms_crossed`
5. `wrist_hip_ratio_right`
6. `left_wrist_dist`
7. `left_arm_angle`
8. `right_wrist_dist`

**模型文件**：`models/standard/theft_xgb_model.pkl`

### 5.2 增强模型性能

**最佳超参数**：
- 学习率: 0.1
- 最大深度: 3
- 子采样率: 0.8
- 特征采样率: 0.8
- gamma: 0
- 估计器数量: 100

**性能指标**：
- 准确率 (Accuracy): 1.0000
- 精确率 (Precision): 1.0000
- 召回率 (Recall): 1.0000
- F1分数: 1.0000

**主要特征重要性**（按重要性降序）：
1. `left_wrist_movement`
2. `right_wrist_movement`
3. `head_x_movement`
4. `wrist_hip_ratio_left`
5. `head_y_movement`

**模型文件**：`models/enhanced/enhanced_theft_xgb_model.pkl`

### 5.3 结果分析

1. **标准模型vs增强模型**：
   - 增强模型在所有指标上表现均优于标准模型
   - 增强模型的F1分数达到完美的1.0，表明添加的动态特征显著提高了检测能力
   - 标准模型在检测非盗窃行为（负类）时表现较弱

2. **特征重要性分析**：
   - 手腕移动轨迹（`left_wrist_movement`和`right_wrist_movement`）是最强预测指标
   - 头部移动（`head_x_movement`和`head_y_movement`）对检测东张西望行为至关重要
   - 身体姿态特征（如`torso_height`和`shoulder_width`）对于检测鬼鬼祟祟行为有效

3. **实际应用考虑**：
   - 增强模型虽然性能出色，但需要更多计算资源
   - 标准模型可在资源受限环境下使用，提供基本的检测能力
   - 在实际部署中，可根据系统需求选择适当的模型

## 6. 可视化结果

模型训练过程生成了多种可视化结果，保存在以下位置：

- 标准模型：
  - 特征重要性图：`models/standard/plots/feature_importance.png`
  - 混淆矩阵：`models/standard/plots/confusion_matrix.png`

- 增强模型：
  - 特征重要性图：`models/enhanced/plots/feature_importance.png`
  - 混淆矩阵：`models/enhanced/plots/confusion_matrix.png`

## 7. 使用说明

### 7.1 模型加载与预测

```python
import pickle
import numpy as np

# 加载标准模型
with open('models/standard/theft_xgb_model.pkl', 'rb') as f:
    standard_model = pickle.load(f)
    
# 加载增强模型
with open('models/enhanced/enhanced_theft_xgb_model.pkl', 'rb') as f:
    enhanced_model = pickle.load(f)

# 使用标准模型预测（需要8个特征）
standard_features = [0.5, 0.6, 1.2, 30.0, 28.5, 0.4, 0.45, 1]
prediction = standard_model.predict([standard_features])
probability = standard_model.predict_proba([standard_features])

# 使用增强模型预测（需要14个特征）
enhanced_features = [0.5, 0.6, 0.2, 0.3, 1.2, 30.0, 28.5, 0.4, 0.45, 1, 0.1, 0.05, 0.9, 0.02]
prediction = enhanced_model.predict([enhanced_features])
probability = enhanced_model.predict_proba([enhanced_features])
```

### 7.2 实时检测

本项目可与姿态检测系统集成，实现实时监控：

1. 通过摄像头捕获画面
2. 使用姿态估计模型（如YOLOv8-pose）提取人体关键点
3. 计算特征并输入到训练好的XGBoost模型
4. 根据预测结果触发相应操作

## 8. 未来改进方向

1. **数据多样性增强**：
   - 增加更多种类的盗窃行为模式
   - 添加不同场景下的特征变化

2. **模型改进**：
   - 尝试深度学习方法，如LSTM捕捉时间序列特征
   - 探索多模态融合，结合视觉和姿态信息

3. **系统集成**：
   - 与现有安防系统深度集成
   - 开发更友好的用户界面和警报系统

## 9. 项目依赖

- Python 3.8+
- XGBoost 1.7.3
- scikit-learn 1.2.2
- pandas 1.5.3
- numpy 1.24.3
- matplotlib 3.7.1

## 10. 联系与支持

如有任何问题或需要进一步了解项目细节，请联系项目维护者。

---

**声明**：本项目仅用于教育和研究目的，不鼓励任何未经授权的监控活动。使用本技术时，请遵守相关法律法规和隐私保护规定。 