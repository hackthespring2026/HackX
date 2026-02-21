// Elements
const liveClock = document.getElementById('live-clock');
const posLog = document.getElementById('pos-log');
const totalItemsEl = document.getElementById('total-items');
const totalValueEl = document.getElementById('total-value');
const alertsLog = document.getElementById('alerts-log');
const criticalAlertOverlay = document.getElementById('critical-alert');
const criticalAlertMsg = document.getElementById('critical-alert-msg');
const btnDismiss = document.getElementById('btn-dismiss');
const btnClearAlerts = document.getElementById('btn-clear-alerts');
const detectItemBox = document.getElementById('detect-item');
const systemStatusText = document.getElementById('system-status-text');
const statusIndicatorSpan = document.querySelector('.status-indicator span.dot');
const navAlertBadge = document.getElementById('nav-alert-badge');
const alertsEmptyState = document.getElementById('alerts-empty-state');
const posEmptyState = document.getElementById('pos-empty-state');
const recIndicator = document.getElementById('rec-indicator');
const videoPlaceholder = document.getElementById('video-placeholder');
const btnLoadVideo = document.getElementById('btn-load-video');
const ytUrlInput = document.getElementById('yt-url');
const aiStatus = document.getElementById('ai-status');

// State
let totalItems = 0;
let totalValue = 0;
let alertCount = 0;
let systemMode = 'SECURE';

// Video State & Sync
let player;
let syncInterval;
let processedEvents = new Set();
let videoDuration = 0;

// Demo Products
const products = [
    { name: "Organic Bananas", price: 2.99, code: "84013" },
    { name: "Whole Milk 1 Gal", price: 4.50, code: "29104" },
    { name: "Sourdough Bread", price: 5.25, code: "10934" },
    { name: "Avocado x3", price: 4.00, code: "94011" },
    { name: "Ground Coffee", price: 12.99, code: "44012" },
    { name: "Sparkling Water", price: 6.50, code: "55812" },
    { name: "Detergent", price: 15.99, code: "11299" },
    { name: "Toilet Paper 12pk", price: 18.50, code: "99212" }
];

/* 
 * TIMELINE SCRIPT 
 * Determines what happens at specific seconds in the video.
 * Types: 
 *   - 'sync': AI detects object AND POS logs it (Normal)
 *   - 'no_pos': AI detects object, but POS DOES NOT log it (Sweethearting/Theft)
 *   - 'no_cctv': POS logs item, but AI sees NO physical object (Phantom scan)
 */
const scenarioTimeline = [
    { time: 5, type: 'sync', product: products[0] },
    { time: 10, type: 'sync', product: products[1] },
    { time: 15, type: 'sync', product: products[2] },
    { time: 22, type: 'no_pos', errorMsg: "Sweethearting Detected: Item passed checkout zone without POS scan." }, // THEFT!
    { time: 28, type: 'sync', product: products[3] },
    { time: 35, type: 'sync', product: products[4] },
    { time: 42, type: 'no_cctv', product: products[5], errorMsg: "Phantom Scan: Item logged on POS but no physical item detected." }, // FRAUD!
    { time: 48, type: 'sync', product: products[6] },
];

// Formatting Utils
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
const formatTime = (date) => date.toLocaleTimeString('en-US', { hour12: false });

// Clock
setInterval(() => {
    liveClock.textContent = formatTime(new Date());
}, 1000);

// Set System Status UI
function setSystemStatus(status) {
    if (status === 'SECURE') {
        systemMode = 'SECURE';
        systemStatusText.textContent = "SYSTEM SECURE";
        systemStatusText.className = "status-text text-green";
        statusIndicatorSpan.className = "dot pulse-green";
    } else if (status === 'ALERT') {
        systemMode = 'ALERT';
        systemStatusText.textContent = "MISMATCH DETECTED";
        systemStatusText.className = "status-text text-red";
        statusIndicatorSpan.className = "dot pulse-red";
    }
}

// Generate UI Elements
function createPosItem(product) {
    const div = document.createElement('div');
    div.className = 'pos-item';
    div.innerHTML = `
        <div class="item-details">
            <span class="item-name">${product.name}</span>
            <span class="item-code">PLU: ${product.code}</span>
        </div>
        <div class="item-price">${formatCurrency(product.price)}</div>
    `;
    return div;
}

function createAlertItem(title, text) {
    const div = document.createElement('div');
    div.className = 'alert-item';
    div.innerHTML = `
        <div class="alert-header">
            <div class="alert-title"><i class="fa-solid fa-triangle-exclamation"></i> ${title}</div>
            <div class="alert-time">${formatTime(new Date())}</div>
        </div>
        <div class="alert-desc">${text}</div>
    `;
    return div;
}

// Emulate CCTV detection drawing a bounding box
function triggerCCTVObjectDetection() {
    // Pick random position towards the center bottom (where checkout belt usually is)
    const x = Math.floor(Math.random() * 40) + 30;
    const y = Math.floor(Math.random() * 20) + 50;
    const width = Math.floor(Math.random() * 30) + 30;
    const height = Math.floor(Math.random() * 30) + 30;

    detectItemBox.style.left = `${x}%`;
    detectItemBox.style.top = `${y}%`;
    detectItemBox.style.width = `${width}px`;
    detectItemBox.style.height = `${height}px`;
    detectItemBox.style.display = 'block';

    setTimeout(() => {
        detectItemBox.style.display = 'none';
    }, 1200);
}

// Trigger Security Alert
function triggerAlert(title, message, isCritical = false) {
    setSystemStatus('ALERT');

    if (alertsEmptyState) alertsEmptyState.style.display = 'none';

    const alertEl = createAlertItem(title, message);
    alertsLog.prepend(alertEl);

    alertCount++;
    navAlertBadge.textContent = alertCount;
    navAlertBadge.style.display = 'block';

    if (isCritical) {
        criticalAlertMsg.textContent = message;
        criticalAlertOverlay.classList.add('show');
    }

    // Auto reset status if not actively blocked by modal
    setTimeout(() => {
        if (!criticalAlertOverlay.classList.contains('show')) {
            setSystemStatus('SECURE');
        }
    }, 6000);
}

// Add Item to POS Log
function addPosLog(product) {
    if (posEmptyState) posEmptyState.style.display = 'none';

    posLog.prepend(createPosItem(product));
    totalItems++;
    totalValue += product.price;

    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
}

// UI Elements for MJPEG Video
const videoUpload = document.getElementById('video-upload');
const btnUploadVideo = document.getElementById('btn-upload-video');
const videoStream = document.getElementById('video-stream');

// ============================================
// UPLOAD & STREAM LOGIC
// ============================================

btnUploadVideo.addEventListener('click', async () => {
    const file = videoUpload.files[0];
    if (!file) {
        alert("Please select a video file first.");
        return;
    }

    // Reset UI state
    posLog.innerHTML = `<div class="empty-state" id="pos-empty-state"><p>Waiting for items to be scanned...</p></div>`;
    totalItems = 0; totalValue = 0;
    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);

    alertsLog.innerHTML = `
        <div class="empty-state" id="alerts-empty-state">
            <i class="fa-solid fa-shield-check text-green"></i>
            <p>No anomalies detected</p>
        </div>
    `;
    alertCount = 0;
    navAlertBadge.style.display = 'none';

    // Show uploading state
    btnUploadVideo.textContent = "Uploading...";
    btnUploadVideo.disabled = true;

    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://localhost:8080/api/upload_video", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            // Start MJPEG stream
            videoPlaceholder.style.display = 'none';
            recIndicator.style.display = 'flex';

            // Append timestamp to bust cache
            videoStream.src = "http://localhost:8080/api/video_feed?t=" + new Date().getTime();
            videoStream.style.display = 'block';

            btnUploadVideo.textContent = "Upload & Sync";
            btnUploadVideo.disabled = false;
        } else {
            alert("Failed to upload video.");
            btnUploadVideo.textContent = "Upload & Sync";
            btnUploadVideo.disabled = false;
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("Backend server unreachable. Make sure FastAPI is running on port 8080.");
        btnUploadVideo.textContent = "Upload & Sync";
        btnUploadVideo.disabled = false;
    }
});

btnDismiss.addEventListener('click', () => {
    criticalAlertOverlay.classList.remove('show');
    setSystemStatus('SECURE');
});

document.getElementById('btn-lock').addEventListener('click', () => {
    alert("Counter Locked! Notifying security personnel.");
});

btnClearAlerts.addEventListener('click', () => {
    alertsLog.innerHTML = `
        <div class="empty-state" id="alerts-empty-state">
            <i class="fa-solid fa-shield-check text-green"></i>
            <p>No anomalies detected</p>
        </div>
    `;
    alertCount = 0;
    navAlertBadge.style.display = 'none';
});

// ============================================
// BACKEND WEBSOCKET INTEGRATION
// ============================================
function connectToBackend() {
    console.log("Attempting to connect to FastAPI backend...");
    const ws = new WebSocket("ws://localhost:8080/ws/alerts");

    ws.onopen = () => {
        console.log("Connected to AI Vision Backend!");
        aiStatus.textContent = 'BACKEND SYNCED';
        aiStatus.style.color = '#10b981';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received AI Data:", data);

        if (data.type === 'alert') {
            const isCritical = data.level === 'critical';
            triggerAlert("AI Vision Alert", data.message + ` (${data.timestamp})`, isCritical);
        } else if (data.type === 'pos_log') {
            // New item detected by YOLO on the belt
            addPosLog({
                name: data.item,
                price: data.price,
                code: data.code
            });
        }
    };

    ws.onclose = () => {
        console.log("Connection to backend lost. Retrying in 5 seconds...");
        setTimeout(connectToBackend, 5000);
    };
}

// Start WebSocket connection
connectToBackend();

