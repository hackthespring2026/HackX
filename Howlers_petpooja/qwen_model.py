import torch
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from transformers import BitsAndBytesConfig
from PIL import Image
import requests

# ----------------------------
# 4-bit Quantization Config
# ----------------------------
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
)

# ----------------------------
# Load Model (4-bit on CUDA)
# ----------------------------
model = Qwen2VLForConditionalGeneration.from_pretrained(
    "Qwen/Qwen2-VL-7B-Instruct",
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float
)

processor = AutoProcessor.from_pretrained("Qwen/Qwen2-VL-7B-Instruct")

# ----------------------------
# Load Image
# ----------------------------
image_url = "https://images.unsplash.com/photo-1516117172878-fd2c41f4a759"
image = Image.open(requests.get(image_url, stream=True).raw)

# ----------------------------
# Prepare Input
# ----------------------------
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image"},
            {"type": "text", "text": "Describe this image in detail."}
        ],
    }
]

text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

inputs = processor(
    text=[text],
    images=[image],
    padding=True,
    return_tensors="pt"
).to("cuda")

# ----------------------------
# Generate
# ----------------------------
with torch.no_grad():
    output_ids = model.generate(
        **inputs,
        max_new_tokens=256,
        temperature=0.7
    )

output = processor.batch_decode(output_ids, skip_special_tokens=True)
print(output[0])