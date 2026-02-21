Great question. Let me walk you through the complete journey of a frame — from video file to model response — step by step.

---

## The Complete Workflow

### Stage 1 — Video Decoding (OpenCV)

```
Video file (MP4/AVI)
        │
        ▼
cv2.VideoCapture(tmp_path)
        │
        ├── fps = 25 (example)
        ├── frame_skip = 25 × 1.0s = 25   (for 1s interval)
        │   frame_skip = 25 × 0.3s = 7    (for 0.3s interval)
        └── total_frames = 1500 (60 second video)
```

OpenCV reads the video as raw **BGR pixel arrays** — not a file, not a URL, just a numpy array shaped `(height, width, 3)`. Every `cap.read()` call returns the next raw frame in sequence, one at a time, as fast as the CPU can decode it.

**What "frame_skip" means:**

```
frame_idx:  1  2  3  4  5  6  7  8  9  10 11 12 ... 25
                                              ↑
                                       frame_skip=25
                                       ONLY this one gets analyzed
                                       All others just update the video display
```

So at 1s interval on a 25fps video, you see all 25 frames visually but only frame #25 goes to the model. At 0.3s interval, only every 7th frame goes to the model.

---

### Stage 2 — Frame Encoding (What the Model Actually Receives)

When `frame_idx % frame_skip == 0`, this happens:

```python
_, buf = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 55])
b64    = base64.b64encode(buf).decode()
```

The raw numpy array is **compressed to JPEG** (quality 55 for OpenAI, 65 for Groq) then converted to a **base64 string**. This is what actually travels over the network.

**Size example for a 1920×1080 frame:**

```
Raw numpy array:   1920 × 1080 × 3 bytes = ~6.2 MB
JPEG quality 78:   ~180 KB
JPEG quality 65:   ~120 KB   (Groq)
JPEG quality 55:   ~80 KB    (OpenAI)
Base64 overhead:   +33%
Final payload:     ~107 KB (OpenAI) or ~160 KB (Groq)
```

This is why JPEG quality matters for speed — smaller payload = less upload time = faster response.

---

### Stage 3 — The Sliding Window (What Context the Model Gets)

This is the most important part to understand. **The model doesn't just receive one frame.** It receives:

1. **One image** — the current frame as base64 JPEG
2. **Text describing the last 5 frame analysis results** — injected into the prompt

Here's exactly what `build_analysis_prompt(window, frame_num, frame_interval)` produces. Say we're at second 6 of a video, 1s interval, and the sliding window contains frames from seconds 1–5:

```
=== SLIDING TEMPORAL WINDOW — LAST 5 FRAME(S) OF CONTEXT ===
Window: 5/5 frames (covering last 5.0s, evicting frames older than 5.0s)

  [1.0s ago | video 5s] L0 score=1 trend=stable threat=NONE rec=MONITOR
    flags=[]
    action: cashier scanning items normally
    summary: Standard transaction in progress, no concerns

  [2.0s ago | video 4s] L1 score=3 trend=escalating threat=LOITERING rec=MONITOR
    flags=['NERVOUS_BEHAVIOR']
    action: person near register glancing sideways
    summary: Customer lingering near counter longer than expected

  [3.0s ago | video 3s] L1 score=4 trend=escalating threat=LOITERING rec=ALERT_STAFF
    flags=['NERVOUS_BEHAVIOR', 'DWELL_TIME_ANOMALY']
    action: person leaning over counter looking at register
    summary: Person displaying nervous behavior and extended dwell near register

  [4.0s ago | video 2s] L2 score=6 trend=escalating threat=CASH_THEFT rec=CALL_SECURITY
    flags=['SURVEILLANCE_BEHAVIOR', 'BODY_SHIELDING']
    action: person turning back to camera, hand near drawer
    summary: Pre-criminal positioning detected, body shielding register from view

  [5.0s ago | video 1s] L0 score=1 trend=stable threat=NONE rec=MONITOR
    flags=[]
    action: empty counter, no one present
    summary: Counter unattended, normal state

=== NOW: ANALYZE THE CURRENT FRAME ===
```

**Then appended to this:** the full set of instructions about threat categories, intent signals, escalation levels, and the required JSON output schema.

The complete message sent to the API looks like:

```
SYSTEM:  "You are an advanced behavioral security AI..."

USER:    [text]  "You are analyzing a retail/commercial..."
                  + the sliding window history above
                  + all the detection instructions
                  + JSON schema requirement

         [image]  data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...
                  (the current frame as base64)
```

This is a **multimodal message** — text + image in the same API call.

---

### Stage 4 — What Groq / OpenAI Actually Sees

At the model's side, here is what arrives:

**The image** is decoded back from base64 to pixels inside the model's vision encoder. The model doesn't see JPEG compression artifacts in the way humans do — it runs the image through a **vision encoder** (a CNN or ViT patch extractor) that produces embedding vectors, not pixel values. So JPEG quality 55 vs 78 produces nearly identical embeddings for security footage — the semantic content is preserved, only fine texture details differ, which don't matter for behavioral analysis.

**The text** goes through the language model's tokenizer. The sliding window history is ~300–500 tokens. The instructions are ~600 tokens. Together the context sent to the model on frame 6 is roughly:

```
System prompt:          ~80 tokens
Sliding window text:    ~350 tokens
Instructions + schema:  ~600 tokens
Image (vision tokens):  ~765 tokens (for 1920×1080 with GPT-4o's tile system)
                        ~256 tokens (for Groq's LLaMA Scout)
─────────────────────────────────────
Total input:            ~1800–2100 tokens per call
```

---

### Stage 5 — How the Model Interprets It

The model does two things simultaneously and fuses them:

**Vision path:**
```
JPEG bytes → decode → pixel grid → patch embeddings
                                         │
                          (spatial features: where are people,
                           what are their hands doing, is the
                           drawer open, body posture, gaze direction)
```

**Language path:**
```
Sliding window text → tokenize → attention over history
                                         │
                          (temporal reasoning: this person has been
                           nervous for 3 frames, score went 1→3→4→6,
                           now their hand is near the drawer)
```

**Fusion:** The model's cross-attention layers combine both. The text history tells it *what to look for* in the image. The image *confirms or denies* what the text suggests. This is why the sliding window dramatically improves accuracy — the model isn't making a cold judgment on a single image, it's making a **temporally-informed prediction**.

For example, without history: `"Person standing near register" → score 2`

With history showing the last 4 frames escalating: `"Person standing near register after 4s of escalating nervous behavior and body shielding" → score 8`

---

### Stage 6 — The Response and Thread Handling

The model returns a JSON string. The background thread catches it:

```python
def _worker(frm, key, prov, pmt):
    res = analyze_frame(frm, key, prov, pmt)   # blocks here (1-4 seconds)
    result_queue.put(res)                       # push to queue
    pending_flag.clear()                        # signal: ready for next call
```

Meanwhile the main loop is:
```python
# every iteration (every decoded video frame):
try:
    result = result_queue.get_nowait()   # non-blocking check
    # → got a result: update the entire UI
except queue.Empty:
    pass                                 # no result yet: video keeps playing
```

This is why the video no longer freezes — the main loop never waits for the API. It checks the queue in microseconds and moves on if nothing is there.

---

### Full Timeline for a 1-second interval, GPT-4o

```
t=0.000s   frame #1   decoded, displayed
t=0.040s   frame #2   decoded, displayed
...
t=1.000s   frame #25  decoded → THREAD SPAWNED
                       pending_flag = SET
                       frame #25 encoded to JPEG 55q
                       base64'd, packaged with window[0..0] (empty first call)
                       HTTP POST → OpenAI API
t=1.040s   frame #26  decoded, displayed. "ANALYZING..." badge shown.
...
t=2.800s                                           ← API responds (1800ms)
t=2.840s   frame #71  decoded → queue has result!
                       UI updated with frame #25's analysis
                       pending_flag = CLEAR
                       frame #25 pushed into sliding window
t=3.000s   frame #75  decoded → THREAD SPAWNED (next call)
                       now window contains [frame #25]
                       sends: text(window[frame25]) + image(frame75)
```

**Key insight:** The model analyzed frame #25 but by the time the result arrives, the video is already at frame #71. The UI updates with the *analysis of what happened 1.8 seconds ago* — this is the inherent latency trade-off of the threaded design. The analysis is slightly behind the video, but the video is never blocked.

---

### Summary Table

| What | Groq LLaMA Scout | OpenAI GPT-4o |
|---|---|---|
| Image encoding | JPEG quality 65 | JPEG quality 55 |
| Approx image size (1080p) | ~160 KB | ~107 KB |
| Max output tokens | 500 | 400 |
| Typical latency | 400–900ms | 1500–3500ms |
| Vision token count | ~256 | ~765 (tiled) |
| Total input tokens | ~1300 | ~2100 |
| Model behavior | Faster, slightly less nuanced | Slower, more precise spatial reasoning |

The reason Groq is faster isn't just the model — it's that LLaMA Scout uses fewer vision tokens (256 vs GPT-4o's tile-based 765+), smaller payload hits the network faster, and Groq's inference hardware is optimized for speed over latency. GPT-4o tiles large images into multiple 512×512 patches and processes each independently, which is more accurate but significantly more compute.


