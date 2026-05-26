/* ── data.js ── shared store ── */

const DB_KEY = 'info_db_v1';
// const N8N_READ_URL = 'http://localhost:5678/webhook-test/get-records';
const N8N_READ_URL = 'https://duplicate-kentucky-adaptation-layers.trycloudflare.com/webhook/get-records';

/* ── 同步版（給 getById / update / remove / toggleStar 內部用） ── */
function getAllSync() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}

/* ── 非同步版（給 index / date / edit 頁面呼叫） ── */
export async function getAll({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getAllSync();
    if (cached.length > 0) return cached;
  }
  try {
    // const res = await fetch(N8N_READ_URL);
    const res = await fetch(N8N_READ_URL, {
      headers: { 
        'ngrok-skip-browser-warning': '1',   // ← 加這行
      }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const records = data.records || [];
    save(records);
    return records;
  } catch (e) {
    console.warn('n8n 讀取失敗，改用本地資料', e);
    const cached = getAllSync();
    return cached.length > 0 ? cached : getSampleData();
  }
}

export function save(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

export function getById(id) {
  return getAllSync().find(r => r.id === id) || null;
}

export function add(record) {
  const all = getAllSync();
  record.id = Date.now().toString();
  record.createdAt = record.createdAt || new Date().toISOString().slice(0,10);
  all.unshift(record);
  save(all);
  return record;
}

export function update(id, fields) {
  const all = getAllSync();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...fields };
  save(all);
  return all[idx];
}

export function remove(id) {
  const all = getAllSync().filter(r => r.id !== id);
  save(all);
}

export function toggleStar(id) {
  const all = getAllSync();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return;
  all[idx].starred = !all[idx].starred;
  save(all);
  return all[idx].starred;
}

/* ── helpers ── */
export const CAT_MAP = {
  ai:     { label: 'AI',     cls: 'ai' },
  aitool: { label: 'AI工具', cls: 'ai' },
  paper:  { label: '論文',   cls: 'paper' },
  beauty: { label: '美妝',   cls: 'beauty' },
  buy:    { label: '想買',   cls: 'buy' },
  work:   { label: '工作',   cls: 'buy' },
  life:   { label: '生活',   cls: 'other' },
  other:  { label: '其他',   cls: 'other' },
};

export function catBadge(cat) {
  const m = CAT_MAP[cat] || CAT_MAP.other;
  return `<span class="cat-badge ${m.cls}">${m.label}</span>`;
}

export function starHtml(starred, id) {
  return `<button class="card-star ${starred ? 'starred' : ''}" data-id="${id}" title="標記重要">
    ${starred ? '★' : '☆'}
  </button>`;
}

export function tagHtml(tags = []) {
  return tags.map(t => `<span class="tag">#${t}</span>`).join('');
}

export function cardHtml(r) {
  const imgInner = r.image
    ? `<img src="${r.image}" alt="${r.title}">`
    : `<div class="card-img-placeholder">📷</div>`;
  return `
  <div class="card ${r.starred ? 'starred' : ''} fade-in" data-id="${r.id}">
    <div class="card-img-wrap" data-url="${r.url || '#'}">${imgInner}</div>
    <div class="card-body">
      <div class="card-meta">
        ${catBadge(r.category)}
        <span class="card-date">${r.date || r.createdAt || ''}</span>
        <span class="card-source">${r.source ? 'from ' + r.source : ''}</span>
          ${starHtml(r.starred, r.id)}
      </div>
      <div class="card-title">${r.title || '（無標題）'}</div>
      <div class="card-desc">${r.summary || ''}</div>
      <div class="card-tags">${tagHtml(r.tags)}</div>
    </div>
  
  </div>`;
}

/* ── Sample data（n8n 失敗時的備用） ── */
function getSampleData() {
  const d = [
    { id:'1', title:'GPT-5 正式發布，多模態能力全面升級', summary:'OpenAI 於 2026 年發布 GPT-5，推理能力大幅提升。', category:'ai', source:'IG', date:'2026/05/15', tags:['GPT-5','OpenAI'], starred:true, createdAt:'2026-05-15', image:'', url:'https://openai.com' },
  ];
  save(d);
  return d;
}
