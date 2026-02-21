
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from PIL import Image
import cv2

# 1. Load Model (Optimized for your RTX 4060)
model_id = ""
revision = "2025-01-09" # Use the latest stable revision
model = AutoModelForCausalLM.from_pretrained(model_id, trust_remote_code=True, revision=revision).to("cuda")
tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision)

cap = cv2.VideoCapture(0) # 0 is your laptop webcam

while True:
    ret, frame = cap.read()
    if not ret: break

    # Convert OpenCV frame (BGR) to PIL Image (RGB) for the model
    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    # Encode the image (Moondream's internal step)
    img_embeds = model.encode_image(pil_img)

    # 2. ASK THE MODEL TO DETECT
    # You can change the prompt to "hands" or "cash"
    answer = model.answer_question(img_embeds, "Detect person's emotions in picture", tokenizer)
    
    # Note: Moondream's detect function returns coordinates like [ymin, xmin, ymax, xmax]
    # You would then draw these using cv2.rectangle (I can provide that math if needed!)

    cv2.putText(frame, f"AI: {answer}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.imshow("Moondream Theft Monitor", frame)
    break_window = input("Press Enter to continue or type 'q' to quit: ")
    if break_window.lower() == 'q':
        break
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()