"""
测试盗窃检测模型
这个脚本用于测试YOLOv11n和XGBoost的盗窃检测功能
"""

import os
import sys
import cv2
import argparse
import time
import logging
import numpy as np

from src.models.detection import TheftDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_detector')

def ensure_output_dir():
    """Ensure output directory exists"""
    os.makedirs("static/output", exist_ok=True)

def test_image(image_path, show_result=True, save_result=True, analyze_behavior=False):
    """Test theft detector on an image
    
    Args:
        image_path: Path to the image file
        show_result: Whether to display the result image
        save_result: Whether to save the result image
        analyze_behavior: Whether to perform behavior analysis
    """
    logger.info(f"Testing detector on image: {image_path}")
    
    # Initialize detector
    detector = TheftDetector()
    
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Failed to read image: {image_path}")
        return False
    
    # Perform detection
    logger.info("Running detection...")
    start_time = time.time()
    
    if analyze_behavior:
        # For behavior analysis, use detector's detect_theft method but enable behavior analysis
        try:
            from src.models.behavior.image_behavior import ImageBehaviorDetector
            behavior_detector = ImageBehaviorDetector()
            
            # 第一步：标准检测
            detections, theft_proba = detector.detect_theft(img)
            
            # 第二步：分析行为 - 使用规则引擎和模型，不使用硬编码
            logger.info("执行姿态估计和行为分析...")
            pose_results = behavior_detector._extract_pose_landmarks(img)
            
            # 从检测结果中提取人物边界框，用于规则引擎
            person_detections = []
            try:
                # 从检测结果中提取人物边界框
                if hasattr(detections, 'boxes'):
                    # 处理ultralytics Results对象
                    for i in range(len(detections.boxes)):
                        box = detections.boxes[i]
                        cls_id = int(box.cls[0]) if hasattr(box, 'cls') and len(box.cls) > 0 else -1
                        if cls_id >= 0 and detections.names.get(cls_id, "") == "person":
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0]) if hasattr(box, 'conf') and len(box.conf) > 0 else 0.0
                            person_detections.append([(x1, y1, x2, y2), conf])
                
                logger.info(f"检测到 {len(person_detections)} 个人物")
            except Exception as e:
                logger.error(f"处理人物检测结果时出错: {str(e)}")
            
            # 提取商品检测信息
            objects = []
            try:
                # 从检测结果中提取商品边界框
                if hasattr(detections, 'boxes'):
                    for i in range(len(detections.boxes)):
                        box = detections.boxes[i]
                        cls_id = int(box.cls[0]) if hasattr(box, 'cls') and len(box.cls) > 0 else -1
                        class_name = detections.names.get(cls_id, "")
                        # 排除人物类别，其他都视为可能的商品
                        if cls_id >= 0 and class_name != "person":
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0]) if hasattr(box, 'conf') and len(box.conf) > 0 else 0.0
                            objects.append({
                                'bbox': (x1, y1, x2, y2),
                                'class': class_name,
                                'confidence': conf
                            })
                logger.info(f"检测到 {len(objects)} 个物体")
            except Exception as e:
                logger.error(f"处理物体检测结果时出错: {str(e)}")
            
            # 使用行为检测器的规则引擎进行分析
            behaviors = []
            if pose_results:
                logger.info("姿态检测成功 - 使用规则引擎分析姿态数据")
                try:
                    # 使用规则引擎进行行为分析
                    behavior_detector.detected_behaviors = []
                    
                    # 调用各种规则引擎方法进行行为检测
                    behavior_detector._detect_pose_based_behaviors(img, pose_results, person_detections, objects)
                    behavior_detector._detect_suspicious_arm_posture(img, pose_results, person_detections)
                    behavior_detector._detect_abnormal_arm_positions(img, pose_results, person_detections)
                    behavior_detector._detect_body_shielding(img, pose_results, person_detections, objects)
                    behavior_detector._detect_hands_behind_back(img, pose_results, person_detections)
                    
                    # 获取行为检测结果
                    if behavior_detector.detected_behaviors:
                        behaviors = behavior_detector.detected_behaviors
                        logger.info(f"规则引擎检测到 {len(behaviors)} 个可疑行为")
                        for behavior in behaviors:
                            logger.info(f" - {behavior['type']}: {behavior['confidence']:.2f}")
                    else:
                        logger.info("规则引擎未检测到可疑行为")
                        
                    # 使用规则引擎中的口袋检测方法
                    try:
                        behavior_detector._detect_pocket_concealment(img, pose_results, person_detections, objects)
                        # 检查是否有新增行为
                        if len(behavior_detector.detected_behaviors) > len(behaviors):
                            new_behaviors = behavior_detector.detected_behaviors[len(behaviors):]
                            behaviors = behavior_detector.detected_behaviors
                            logger.info(f"口袋检测额外发现 {len(new_behaviors)} 个可疑行为")
                            for behavior in new_behaviors:
                                logger.info(f" - {behavior['type']}: {behavior['confidence']:.2f}")
                    except Exception as e:
                        logger.error(f"执行口袋检测出错: {str(e)}")
                        
                    # 使用物品到口袋检测方法
                    try:
                        item_to_pocket_result = behavior_detector._check_item_to_pocket(pose_results, objects)
                        logger.info(f"_check_item_to_pocket检测结果: {item_to_pocket_result}")
                    except Exception as e:
                        logger.error(f"调用_check_item_to_pocket出错: {str(e)}")
                        
                except Exception as e:
                    logger.error(f"规则引擎分析出错: {str(e)}")
            else:
                logger.info("姿态检测失败 - 尝试使用模型进行分析")
                try:
                    # 如果姿态检测失败，则使用其他方法进行分析
                    model_behaviors = []
                    behavior_detector.detected_behaviors = []
                    
                    # 尝试使用不依赖于姿态估计的其他检测方法
                    try:
                        # 检测商品遮挡行为
                        behavior_detector._detect_occlusion_behaviors(img, person_detections, objects)
                        # 检测商品处理异常
                        behavior_detector._detect_product_handling_anomalies(img, person_detections, objects)
                        # 检测群体行为
                        behavior_detector._detect_group_behaviors(img, person_detections)
                        # 检测环境相关行为
                        behavior_detector._detect_environmental_behaviors(img, person_detections, objects)
                        # 检测高价值商品行为
                        behavior_detector._detect_high_value_product_behaviors(img, person_detections, objects)
                        
                        if behavior_detector.detected_behaviors:
                            model_behaviors = behavior_detector.detected_behaviors
                    except Exception as e:
                        logger.error(f"使用其他检测方法时出错: {str(e)}")
                    
                    if model_behaviors:
                        behaviors.extend(model_behaviors)
                        logger.info(f"模型检测到 {len(model_behaviors)} 个可疑行为")
                        for behavior in model_behaviors:
                            logger.info(f" - {behavior['type']}: {behavior['confidence']:.2f}")
                    else:
                        logger.info("模型未检测到可疑行为")
                except Exception as e:
                    logger.error(f"模型分析出错: {str(e)}")
            
            # 保存行为到全局变量，用于输出时检查
            if behaviors:
                detector.suspicious_behaviors = behaviors
                
                # 基于规则引擎和模型检测到的行为调整盗窃概率
                # 使用配置的权重而非硬编码值
                try:
                    # 使用规则而非硬编码值计算盗窃概率
                    if len(behaviors) > 0:
                        # 读取配置中的行为权重
                        behavior_weights = behavior_detector._load_config().get('behavior_weights', {})
                        
                        # 根据检测到的行为和配置的权重计算盗窃概率
                        behavior_confidence_sum = 0
                        behavior_weight_sum = 0
                        
                        for behavior in behaviors:
                            behavior_type = behavior['type']
                            confidence = behavior['confidence']
                            # 使用配置的权重，如果没有则使用默认值0.5
                            weight = behavior_weights.get(behavior_type, 0.5)
                            
                            behavior_confidence_sum += confidence * weight
                            behavior_weight_sum += weight
                        
                        # 计算加权平均置信度
                        if behavior_weight_sum > 0:
                            avg_weighted_confidence = behavior_confidence_sum / behavior_weight_sum
                            # 使用基本盗窃概率和行为分析结果的加权平均
                            theft_proba = theft_proba * 0.3 + avg_weighted_confidence * 0.7
                    
                    logger.info(f"基于规则引擎计算的盗窃概率: {theft_proba:.2f}")
                except Exception as e:
                    logger.error(f"计算盗窃概率出错: {str(e)}")
                    # 使用最初的检测概率
            else:
                logger.info("未检测到可疑行为，保持原有盗窃概率")
        except Exception as e:
            logger.error(f"Error in behavior analysis: {str(e)}")
            # Fallback to regular detection
            detections, theft_proba = detector.detect_theft(img)
    else:
        # Standard detection without behavior analysis
        detections, theft_proba = detector.detect_theft(img)
    
    end_time = time.time()
    
    # Print results
    logger.info(f"Detection completed in {end_time - start_time:.2f} seconds")
    logger.info(f"Theft probability: {theft_proba:.2%}")
    logger.info(f"Detection result: {'盗窃行为' if theft_proba > 0.5 else '非盗窃行为'}")
    
    # Check for behaviors
    if analyze_behavior and hasattr(detector, 'suspicious_behaviors') and detector.suspicious_behaviors:
        logger.info("Detected suspicious behaviors:")
        for behavior in detector.suspicious_behaviors:
            logger.info(f" - {behavior['type']}: {behavior['confidence']:.2f}")
    
    # Draw detection results
    result_img = detector.draw_detection(img, detections, theft_proba)
    
    # Save result
    if save_result:
        output_path = os.path.join("static", "output", f"test_result_{int(time.time())}.jpg")
        cv2.imwrite(output_path, result_img)
        logger.info(f"Result saved to: {output_path}")
    
    # Show result
    if show_result:
        cv2.imshow("Detection Result", result_img)
        logger.info("Press any key to close the window...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    return True

def test_video(video_path, save_result=True):
    """Test theft detector on a video
    
    Args:
        video_path: Path to the video file
        save_result: Whether to save the result video
    """
    logger.info(f"Testing detector on video: {video_path}")
    
    # Initialize detector
    detector = TheftDetector()
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Failed to open video: {video_path}")
        return False
    
    # Get video info
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    logger.info(f"Video info: {width}x{height}, {fps} FPS, {total_frames} frames")
    
    # Create output video writer
    output_path = None
    out = None
    if save_result:
        output_path = os.path.join("static", "output", f"test_video_{int(time.time())}.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        logger.info(f"Output video will be saved to: {output_path}")
    
    # Process video
    frame_idx = 0
    process_every = 5  # Process every N frames
    max_theft_prob = 0
    theft_frames = 0
    
    start_time = time.time()
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Process every N frames
        if frame_idx % process_every == 0:
            # Detect theft
            detections, theft_proba = detector.detect_theft(frame)
            
            # Update stats
            max_theft_prob = max(max_theft_prob, theft_proba)
            if theft_proba > 0.5:
                theft_frames += 1
            
            # Draw detection results
            result_frame = detector.draw_detection(frame, detections, theft_proba)
            
            # Show frame (optional)
            cv2.imshow("Video Detection", result_frame)
            
            # Save frame to output video
            if out is not None:
                out.write(result_frame)
            
            # Print progress
            if frame_idx % (process_every * 10) == 0:
                progress = frame_idx / total_frames
                elapsed = time.time() - start_time
                remaining = (elapsed / max(1, frame_idx)) * (total_frames - frame_idx)
                logger.info(f"Progress: {progress:.1%}, Frame {frame_idx}/{total_frames}, Theft prob: {theft_proba:.2%}, ETA: {remaining:.1f}s")
            
            # Check for user abort
            if cv2.waitKey(1) & 0xFF == ord('q'):
                logger.info("User aborted processing")
                break
        else:
            # For non-processed frames, write the original frame
            if out is not None:
                out.write(frame)
        
        frame_idx += 1
    
    # Clean up
    cap.release()
    if out is not None:
        out.release()
    cv2.destroyAllWindows()
    
    # Print final results
    end_time = time.time()
    logger.info(f"Video processing completed in {end_time - start_time:.2f} seconds")
    logger.info(f"Max theft probability: {max_theft_prob:.2%}")
    theft_ratio = theft_frames / (total_frames / process_every) if total_frames > 0 else 0
    logger.info(f"Theft frames ratio: {theft_ratio:.2%}")
    logger.info(f"Detection result: {'盗窃行为' if max_theft_prob > 0.5 else '非盗窃行为'}")
    
    if output_path:
        logger.info(f"Output video saved to: {output_path}")
    
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test theft detection model")
    parser.add_argument("--image", type=str, help="Path to image file for testing")
    parser.add_argument("--video", type=str, help="Path to video file for testing")
    parser.add_argument("--no-display", action="store_true", help="Do not display results")
    parser.add_argument("--no-save", action="store_true", help="Do not save results")
    parser.add_argument("--analyze-behavior", action="store_true", help="Enable behavior analysis")
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    ensure_output_dir()
    
    if not args.image and not args.video:
        logger.error("Please provide either --image or --video argument")
        parser.print_help()
        return
    
    # Test on image
    if args.image:
        test_image(args.image, show_result=not args.no_display, save_result=not args.no_save, 
                  analyze_behavior=args.analyze_behavior)
    
    # Test on video
    if args.video:
        test_video(args.video, save_result=not args.no_save)
    
    logger.info("Testing completed")

if __name__ == "__main__":
    main() 