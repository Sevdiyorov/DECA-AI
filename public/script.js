// 🔒 Запрет копирования везде, кроме чата
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.bubble, #input, .code-block pre')) return;
    e.preventDefault();
});
document.addEventListener('copy', (e) => {
    if (e.target.closest('.bubble, #input, .code-block pre')) return;
    e.preventDefault();
});
document.addEventListener('cut', (e) => {
    if (e.target.closest('.bubble, #input, .code-block pre')) return;
    e.preventDefault();
});
document.addEventListener('dragstart', (e) => {
    if (e.target.closest('.bubble, #input, .code-block pre')) return;
    e.preventDefault();
});

const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const clearBtn = document.getElementById('clearBtn');
const typing = document.getElementById('typing');

const modelTrigger = document.getElementById('modelTrigger');
const modelMenu = document.getElementById('modelMenu');
const modelLabel = document.getElementById('modelLabel');

const modalOverlay = document.getElementById('modalOverlay');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

const creatorOverlay = document.getElementById('creatorOverlay');

const STORAGE_KEY = 'deca-ai-history';
const MODEL_KEY = 'deca-ai-model';
const LOGO = 'bird-logo.png';

let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentModel = localStorage.getItem(MODEL_KEY) || 'openai/gpt-oss-20b';

// ---------- Триггеры визитки ----------
const CREATOR_TRIGGERS = [
    'кто тебя создал', 'кто создал тебя',
    'кто тебя сделал', 'кто сделал тебя',
    'кто тебя написал', 'кто написал тебя',
    'кто тебя придумал', 'кто придумал тебя',
    'кто тебя разработал', 'кто разработал тебя',
    'кто тебя построил',
    'кем ты создан', 'кем ты сделан', 'кем создан', 'кем сделан',
    'кем ты разработан',
    'чья ты разработка', 'чья разработка',
    'твой создатель', 'твой разработчик', 'твой автор', 'твой основатель',
    'кто твой создатель', 'кто твой разработчик', 'кто твой автор', 'кто твой основатель',
    'кто хозяин этого ии', 'кто хозяин этого бота', 'кто владелец этого ии',
    'кто создал deca', 'кто создал deca ai', 'кто создал дека',
    'кто разработчик deca', 'кто разработчик deca ai',
    'кто основатель deca', 'кто основатель deca ai', 'кто основатель дека',
    'кто автор deca', 'кто автор deca ai',
    'who created you', 'who made you', 'who developed you',
    'who is your creator', 'who is your developer', 'who is your author',
    'who is your founder', 'who owns you',
    'seni kim yaratdi', 'seni kim yaratgan', 'seni kim yasagan',
    'seni kim yasadi', 'seni kim qildi'
];

function isCreatorQuestion(text) {
    const t = text.toLowerCase().trim();
    return CREATOR_TRIGGERS.some(trigger => t.includes(trigger));
}

// ---------- Визитка ----------
// 🔒 Всё содержимое строится в JS, в HTML нет имени и ссылок
function buildCreatorCard() {
    // Собираем через массив частей, чтобы в исходнике не было цельных строк
    const p1 = ['Sevdi', 'yorov'].join('');
    const p2 = ['Muham', 'madali'].join('');
    const site = ['deca', '.uz'].join('');
    const insta = ['https://www.instagram.com/', 'deca.uz'].join('');
    const gh = ['https://github.com/', 'Sevdiyorov/deca'].join('');

    const html = `
        <button class="creator-close" id="creatorClose" aria-label="Закрыть">
            <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="creator-card">
            <div class="creator-left">
                <img src="bird-logo.png" alt="DECA" class="creator-logo">
                <h1 class="creator-title">DECA</h1>
            </div>

            <div class="creator-right">
                <div class="creator-label">СОЗДАТЕЛЬ DECA AI</div>
                <h2 class="creator-name">${p1}<br>${p2}</h2>
                <p class="creator-role">Разработчик и основатель компании <strong>DECA</strong></p>

                <div class="creator-socials">
                    <a href="${insta}" target="_blank" rel="noopener" class="creator-social creator-instagram" aria-label="Instagram">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                    <a href="${gh}" target="_blank" rel="noopener" class="creator-social creator-github" aria-label="GitHub">
                        <i class="fa-brands fa-github"></i>
                    </a>
                </div>

                <a href="https://${site}" target="_blank" rel="noopener" class="creator-site">${site}</a>
            </div>
        </div>
    `;

    creatorOverlay.innerHTML = html;

    // Вешаем обработчик на кнопку закрытия
    const closeBtn = creatorOverlay.querySelector('#creatorClose');
    closeBtn.addEventListener('click', closeCreatorCard);
}

function openCreatorCard() {
    // Строим DOM только при открытии
    buildCreatorCard();
    creatorOverlay.classList.add('open');
}

function closeCreatorCard() {
    creatorOverlay.classList.remove('open');
    // 🔒 Очищаем содержимое — в DOM больше нет имени
    setTimeout(() => {
        creatorOverlay.innerHTML = '';
    }, 300);
}

creatorOverlay.addEventListener('click', (e) => {
    if (e.target === creatorOverlay) closeCreatorCard();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && creatorOverlay.classList.contains('open')) closeCreatorCard();
});

// ---------- Модель ----------
function applyModel(value) {
    currentModel = value;
    localStorage.setItem(MODEL_KEY, value);
    const option = modelMenu.querySelector(`[data-value="${value}"]`);
    if (option) {
        modelLabel.textContent = option.querySelector('.model-option-name').textContent;
        modelMenu.querySelectorAll('.model-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
    }
}
applyModel(currentModel);

modelTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = modelMenu.classList.contains('open');
    modelMenu.classList.toggle('open', !isOpen);
    modelTrigger.classList.toggle('open', !isOpen);
});

modelMenu.querySelectorAll('.model-option').forEach(opt => {
    opt.addEventListener('click', () => {
        applyModel(opt.dataset.value);
        modelMenu.classList.remove('open');
        modelTrigger.classList.remove('open');
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.model-select')) {
        modelMenu.classList.remove('open');
        modelTrigger.classList.remove('open');
    }
});

// ---------- marked ----------
const renderer = new marked.Renderer();

renderer.code = function (code, infostring) {
    const lang = (infostring || '').match(/\S*/)?.[0] || 'text';
    const codeText = typeof code === 'string' ? code : code.text;
    const escaped = escapeHtml(codeText);

    let highlighted;
    try {
        if (lang && lang !== 'text' && hljs.getLanguage(lang)) {
            highlighted = hljs.highlight(codeText, { language: lang }).value;
        } else {
            highlighted = hljs.highlightAuto(codeText).value;
        }
    } catch {
        highlighted = escaped;
    }

    return `
        <div class="code-block" data-lang="${escapeHtml(lang)}">
            <div class="code-header">
                <span class="code-lang">${escapeHtml(lang)}</span>
                <button class="code-copy" type="button">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Копировать код
                </button>
            </div>
            <pre><code class="hljs language-${escapeHtml(lang)}">${highlighted}</code></pre>
        </div>
    `;
};

marked.setOptions({ renderer, breaks: true, gfm: true });

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripEmoji(text) {
    return String(text).replace(
        /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
        ''
    );
}

function updateSendState() {
    sendBtn.disabled = !input.value.trim();
}

input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    updateSendState();
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});

sendBtn.addEventListener('click', send);
clearBtn.addEventListener('click', openModal);

function openModal() { modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); }

modalCancel.addEventListener('click', closeModal);
modalConfirm.addEventListener('click', () => {
    closeModal();
    doClearChat();
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

function avatarHtml(role) {
    if (role === 'user') {
        return `
            <div class="avatar">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
        `;
    }
    return `<div class="avatar"><img src="${LOGO}" alt=""></div>`;
}

function bindCodeCopy(scope) {
    scope.querySelectorAll('.code-copy').forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const block = btn.closest('.code-block');
            const code = block.querySelector('pre code').innerText;
            try {
                await navigator.clipboard.writeText(code);
                const original = btn.innerHTML;
                btn.innerHTML = `
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Скопировано
                `;
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove('copied');
                }, 1600);
            } catch {}
        });
    });
}

function renderMessage(msg) {
    const el = document.createElement('div');
    el.className = `msg ${msg.role === 'user' ? 'user' : 'bot'}`;

    el.innerHTML = `
        ${avatarHtml(msg.role)}
        <div class="bubble-wrap">
            <div class="bubble"></div>
            ${msg.role === 'assistant' ? `
                <div class="msg-actions">
                    <button class="msg-action copy-all-btn" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        Копировать
                    </button>
                    <button class="msg-action regenerate-action" type="button">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/>
                            <path d="M8 16H3v5"/>
                        </svg>
                        Дубль
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    const bubble = el.querySelector('.bubble');

    if (msg.role === 'assistant') {
        bubble.innerHTML = marked.parse(stripEmoji(msg.content || ''));
        bindCodeCopy(bubble);
        el.querySelector('.copy-all-btn').addEventListener('click', (e) => copyAll(msg.content, e.currentTarget));
        el.querySelector('.regenerate-action').addEventListener('click', (e) => regenerate(e.currentTarget));
    } else {
        bubble.textContent = msg.content;
    }

    chat.appendChild(el);
    scrollDown();
    return { el, bubble };
}

function scrollDown() { chat.scrollTop = chat.scrollHeight; }

async function copyAll(text, btn) {
    try {
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
            Скопировано
        `;
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    } catch {}
}

function doClearChat() {
    history = [];
    localStorage.removeItem(STORAGE_KEY);
    chat.innerHTML = '';
    renderWelcome();
    updateSendState();
}

function renderWelcome() {
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = `
        ${avatarHtml('assistant')}
        <div class="bubble-wrap">
            <div class="bubble">Привет! Я DECA AI. Задай любой вопрос — отвечу по делу.</div>
        </div>
    `;
    chat.appendChild(el);
}

async function streamResponse({ messages, mode = 'normal', botEl = null, botBubble = null }) {
    const { el, bubble } = botEl
        ? { el: botEl, bubble: botBubble }
        : renderMessage({ role: 'assistant', content: '' });

    bubble.textContent = '';
    typing.classList.add('active');
    scrollDown();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, model: currentModel, mode })
        });

        if (!res.ok) throw new Error(`Сервер вернул ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let lastRender = 0;

        typing.classList.remove('active');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });

            const now = performance.now();
            if (now - lastRender > 40) {
                bubble.innerHTML = marked.parse(stripEmoji(fullText));
                scrollDown();
                lastRender = now;
            }
        }

        bubble.innerHTML = marked.parse(stripEmoji(fullText));
        bindCodeCopy(bubble);
        scrollDown();

        return { fullText, el, bubble };
    } catch (err) {
        typing.classList.remove('active');
        el.classList.add('error');
        bubble.textContent = 'Ошибка: ' + err.message;
        throw err;
    }
}

async function send() {
    const text = input.value.trim();
    if (!text) return;

    if (isCreatorQuestion(text)) {
        openCreatorCard();
    }

    const userMsg = { role: 'user', content: text };
    history.push(userMsg);
    renderMessage(userMsg);

    input.value = '';
    input.style.height = 'auto';
    updateSendState();
    sendBtn.disabled = true;

    try {
        const result = await streamResponse({ messages: history, mode: 'normal' });

        const botMsg = { role: 'assistant', content: result.fullText };
        history.push(botMsg);
        saveHistory();

        const copyBtn = result.el.querySelector('.copy-all-btn');
        if (copyBtn) {
            const fresh = copyBtn.cloneNode(true);
            copyBtn.replaceWith(fresh);
            fresh.addEventListener('click', (e) => copyAll(result.fullText, e.currentTarget));
        }

        const regenBtn = result.el.querySelector('.regenerate-action');
        if (regenBtn) {
            const fresh = regenBtn.cloneNode(true);
            regenBtn.replaceWith(fresh);
            fresh.addEventListener('click', (e) => regenerate(e.currentTarget));
        }
    } catch {}

    updateSendState();
    input.focus();
}

async function regenerate(btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    const original = btn.innerHTML;

    try {
        const withoutLast = [...history];
        if (withoutLast.length > 0 && withoutLast[withoutLast.length - 1].role === 'assistant') {
            withoutLast.pop();
        }

        btn.innerHTML = `Думаю...`;

        if (history.length > 0 && history[history.length - 1].role === 'assistant') {
            history.pop();
        }

        const result = await streamResponse({ messages: withoutLast, mode: 'regenerate' });

        const botMsg = { role: 'assistant', content: result.fullText };
        history.push(botMsg);
        saveHistory();

        const copyBtn = result.el.querySelector('.copy-all-btn');
        if (copyBtn) {
            const fresh = copyBtn.cloneNode(true);
            copyBtn.replaceWith(fresh);
            fresh.addEventListener('click', (e) => copyAll(result.fullText, e.currentTarget));
        }

        const regenBtn = result.el.querySelector('.regenerate-action');
        if (regenBtn) {
            const fresh = regenBtn.cloneNode(true);
            regenBtn.replaceWith(fresh);
            fresh.addEventListener('click', (e) => regenerate(e.currentTarget));
        }
    } catch {
        btn.innerHTML = original;
    } finally {
        btn.disabled = false;
    }
}

function saveHistory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

if (history.length === 0) {
    renderWelcome();
} else {
    history.forEach(m => renderMessage(m));
}