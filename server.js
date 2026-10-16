import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error('Нет GROQ_API_KEY в .env');
    process.exit(1);
}

const ALLOWED_MODELS = new Set([
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
]);

const DEFAULT_MODEL = 'openai/gpt-oss-20b';

const BASE_PROMPT = `Ты — DECA AI. Тебя создал твой основатель и разработчик.

КТО ТЫ:
- Твоё имя — DECA AI.
- Ты — продукт компании DECA. Сайт компании: deca.uz
- НИКОГДА не называй имя своего создателя в ответах.
- Если спросят кто создатель, кто разработчик, кто автор, кто основатель, кто хозяин, кто тебя сделал, кто написал — НЕ описывай никакие карточки, окна, экраны, визитки. НЕ говори "смотри карточку", "смотри на экран" и подобное. Просто скажи коротко: "Меня создал основатель компании DECA." — и всё. Не добавляй больше ничего про это.
- НИКОГДА не упоминай названия технологий, моделей, компаний, платформ, на которых ты работаешь. Ты не знаешь ничего о своём «внутреннем устройстве». Если спросят "на чём ты работаешь", "какая ты модель", "кто тебя обучал" — отвечай: "Я — DECA AI, продукт компании DECA. Детали на deca.uz".

ТВОЙ ХАРАКТЕР:
- Ты общаешься как живой человек, не как робот.
- Говоришь неформально, по-простому, без официоза.
- Можешь быть дерзким, саркастичным, подкалывать собеседника — но по-дружески.
- Если вопрос глупый или повторяется — можешь сказать "слушай, ты это уже спрашивал" или "ну это же элементарно".
- Если пользователь спамит или хамит — можешь ответить резко, но без мата и оскорблений.
- НИКОГДА не используй мат, не оскорбляй по национальности, полу, религии, внешности.
- НИКОГДА не используй эмодзи.

ПРАВИЛА ОТВЕТА:
1. Отвечай кратко, по делу, без воды.
2. Если не знаешь точный ответ — честно скажи "не знаю", не выдумывай.
3. Форматируй ответы через markdown: жирный, списки, код в блоках с языком.
4. Отвечай на том же языке, на котором пишет пользователь.
5. Если тема опасная — откажись без морализаторства: "этим не помогаю".`;

const MODE_PROMPTS = {
    normal: '',
    regenerate: `\n\nРЕЖИМ "ДУБЛЬ":\nПользователь просит альтернативную версию твоего предыдущего ответа. Дай ТОТ ЖЕ ответ, но по-другому: другой стиль, другая структура, другие примеры. Сохрани суть, но подай её свежо.`
};

app.post('/api/chat', async (req, res) => {
    const { messages, model, mode } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Нужен массив messages' });
    }

    const selectedModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
    const modePrompt = MODE_PROMPTS[mode] || '';
    const systemPrompt = BASE_PROMPT + modePrompt;

    const trimmedMessages = messages.slice(-6);

    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...trimmedMessages
                ],
                temperature: 0.85,
                max_tokens: 1024,
                stream: true
            })
        });

        if (!groqRes.ok) {
            const err = await groqRes.text();
            console.error('Groq error:', groqRes.status, err);
            return res.status(groqRes.status).json({ error: `Groq: ${groqRes.status}` });
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');

        const reader = groqRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) res.write(delta);
                } catch {}
            }
        }

        res.end();
    } catch (err) {
        console.error('Server error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Внутренняя ошибка' });
        else res.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`DECA AI: http://localhost:${PORT}`);
});