document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatDisplay = document.getElementById('chatDisplay');
    const welcomeMsg = document.getElementById('welcomeMsg');
    const resetBtn = document.getElementById('reset-btn');
    const sidebarContent = document.getElementById('sidebar-content');
    const privacyBadge = document.getElementById('privacy-badge');
    const sidebarScore = document.getElementById('sidebar-score');

    let messageCount = 0;
    let isSending = false;

    if (userInput) userInput.focus();

    // ---- TAB NAVIGATION ----
    const navItems = document.querySelectorAll('#sidebar-nav li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });

    // ---- IDLE STATE ----
    if (userInput && welcomeMsg) {
        userInput.addEventListener('input', () => {
            if (messageCount !== 0) return;
            welcomeMsg.style.opacity = userInput.value.trim() ? '0' : '1';
        });
    }

    // ---- MESSAGE APPEND ----
    function appendMessage(text, role) {
        if (!chatDisplay) return;

        if (welcomeMsg && messageCount === 0) welcomeMsg.style.display = 'none';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '4px';
        wrapper.style.width = '100%';
        wrapper.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';

        const msg = document.createElement('div');
        msg.className = `message ${role}`;

        if (role === 'ai') msg.innerHTML = marked.parse(text);
        else msg.textContent = text;

        const time = document.createElement('div');
        time.className = 'msg-time';
        time.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        wrapper.append(msg, time);
        chatDisplay.appendChild(wrapper);

        setTimeout(() => {
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        }, 30);

        messageCount++;
    }

    // ---- TYPING INDICATOR ----
    function showTypingIndicator() {
        if (!chatDisplay || document.getElementById('typing-indicator')) return;

        const wrap = document.createElement('div');
        wrap.id = 'typing-indicator';
        wrap.className = 'typing-indicator';

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'typing-dot';
            dot.textContent = '•';
            wrap.appendChild(dot);
        }

        const label = document.createElement('span');
        label.textContent = ' Processing...';
        label.style.marginLeft = '6px';

        wrap.appendChild(label);
        chatDisplay.appendChild(wrap);
    }

    function removeTypingIndicator() {
        document.getElementById('typing-indicator')?.remove();
    }

    // ---- PRIVACY SCORE ----
    function updatePrivacyScore(ps) {
        if (!ps || !sidebarScore) return;

        sidebarScore.style.display = 'block';

        const score = ps.score ?? 0;
        const risk = ps.risk_level ?? 'NONE';

        const scoreValue = document.getElementById('score-value');
        const fill = document.getElementById('score-bar-fill');
        const badge = document.getElementById('score-badge');
        const details = document.getElementById('score-details');

        if (scoreValue) scoreValue.textContent = score;

        const COLORS = {
            NONE: '#10b981',
            MEDIUM: '#f4c430',
            HIGH: '#ff9100',
            CRITICAL: '#ff5252'
        };

        const color = COLORS[risk] || COLORS.NONE;

        if (fill) {
            fill.style.width = `${score}%`;
            fill.style.backgroundColor = color;
        }

        if (badge) {
            badge.textContent = risk;
            badge.style.color = color;
            badge.style.backgroundColor = `${color}26`;
        }

        if (details) {
            details.innerHTML =
                `${ps.replaced ?? 0} replaced · ${ps.perturbed ?? 0} perturbed · ${ps.preserved ?? 0} preserved<br>` +
                `HIPAA: ${ps.hipaa_identifiers_protected ?? 0}/${ps.hipaa_identifiers_found ?? 0} protected`;
        }

        if (privacyBadge) {
            privacyBadge.style.display = 'inline-block';
            privacyBadge.textContent = `${score}/100 ${risk}`;
            privacyBadge.style.color = color;
            privacyBadge.style.backgroundColor = `${color}26`;
        }
    }

    // ---- SIDEBAR ----
    function updateSidebar(data) {
        if (!sidebarContent || !data) return;

        const escapeHtml = s => {
            const d = document.createElement('div');
            d.textContent = s;
            return d.innerHTML;
        };

        const entities = data.entities_detected || [];

        const aiSees = document.getElementById('tab-ai-sees');
        if (aiSees) {
            aiSees.innerHTML = data.sanitized_prompt
                ? `<pre>${escapeHtml(data.sanitized_prompt)}</pre>`
                : '<em>Nothing seen yet</em>';
        }

        const tabEntities = document.getElementById('tab-entities');
        if (tabEntities) {
            tabEntities.innerHTML = entities.length
                ? entities.map(e => `<div>${escapeHtml(e.text)} <small>${e.label}</small></div>`).join('')
                : '<em>None detected</em>';
        }

        const aliases = entities.filter(e => e.alias && e.alias !== e.text);
        const tabAliases = document.getElementById('tab-aliases');
        if (tabAliases) {
            tabAliases.innerHTML = aliases.length
                ? aliases.map(a => `<div>${escapeHtml(a.text)} → ${escapeHtml(a.alias)}</div>`).join('')
                : '<em>No aliases</em>';
        }

        navItems.forEach(nav => {
            if (nav.dataset.target === 'tab-entities') {
                nav.textContent = `Entities Detected (${entities.length})`;
            }
            if (nav.dataset.target === 'tab-aliases') {
                nav.textContent = `Alias Map (${aliases.length})`;
            }
        });

        updatePrivacyScore(data.privacy_score);
    }

    // ---- SEND ----
    async function handleSend() {
        if (!userInput || isSending) return;
        const text = userInput.value.trim();
        if (!text) return;

        isSending = true;
        appendMessage(text, 'user');

        userInput.value = '';
        userInput.disabled = true;
        sendBtn.style.pointerEvents = 'none';
        sendBtn.style.opacity = '0.5';

        showTypingIndicator();

        try {
            const res = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            removeTypingIndicator();
            appendMessage(data.response, 'ai');
            updateSidebar(data);
        } catch (e) {
            removeTypingIndicator();
            appendMessage(`Backend error: ${e.message}`, 'error');
        }

        userInput.disabled = false;
        sendBtn.style.pointerEvents = 'auto';
        sendBtn.style.opacity = '1';
        isSending = false;
        userInput.focus();
    }

    sendBtn?.addEventListener('click', handleSend);
    userInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // ---- RESET ----
    resetBtn?.addEventListener('click', async () => {
        if (messageCount && !confirm('Clear chat history and reset aliases?')) return;

        try { await fetch('http://127.0.0.1:8000/reset', { method: 'POST' }); } catch {}

        chatDisplay.innerHTML = '';
        if (welcomeMsg) {
            welcomeMsg.style.display = 'block';
            welcomeMsg.style.opacity = '1';
            chatDisplay.appendChild(welcomeMsg);
        }

        messageCount = 0;
        sidebarScore && (sidebarScore.style.display = 'none');
        privacyBadge && (privacyBadge.style.display = 'none');
    });
});