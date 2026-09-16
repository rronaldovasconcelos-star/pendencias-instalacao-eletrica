const API_BASE = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/issues/${CONFIG.issueNumber}`;
const ISSUE_URL = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/issues/${CONFIG.issueNumber}`;

const cardsContainer = document.getElementById('cardsContainer');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const obsText = document.getElementById('obsText');
const issueLink = document.getElementById('issueLink');
const refreshBtn = document.getElementById('refreshBtn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const toast = document.getElementById('toast');

issueLink.href = ISSUE_URL;

let saving = false;

function showToast(msg, isError) {
  toast.textContent = msg;
  toast.classList.toggle('error', !!isError);
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 2600);
}

function parseBody(body) {
  const lines = body.split('\n');
  const items = [];
  const itemRegex = /^-\s\[([ xX])\]\s\*\*(\d+)\.\s*(.+?)\*\*\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(itemRegex);
    if (!m) continue;
    const item = {
      checked: m[1].toLowerCase() === 'x',
      number: parseInt(m[2], 10),
      title: m[3].trim(),
      lineIndex: i,
      image: null,
      comment: ''
    };
    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed.startsWith('- [') || trimmed === '---') break;
      if (!item.image) {
        const imgMatch = lines[j].match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) { item.image = imgMatch[1]; continue; }
      } else if (trimmed !== '' && !trimmed.startsWith('<')) {
        item.comment = trimmed;
        break;
      }
    }
    items.push(item);
  }

  let observacoes = '';
  const obsIdx = lines.findIndex(l => l.includes('Observações gerais'));
  if (obsIdx !== -1) {
    observacoes = lines.slice(obsIdx + 1).join('\n').trim();
  }

  return { lines, items, observacoes };
}

function render(parsed) {
  const { items, observacoes } = parsed;

  if (!items.length) {
    cardsContainer.innerHTML = '<p class="loading">Nenhuma pendência encontrada.</p>';
    return;
  }

  cardsContainer.innerHTML = '';
  items.sort((a, b) => a.number - b.number).forEach(item => {
    const card = document.createElement('div');
    card.className = 'card' + (item.checked ? ' done' : '');
    card.dataset.number = item.number;

    card.innerHTML = `
      <div class="card-photo-wrap">
        <span class="card-num">${item.number}/${items.length}</span>
        <img src="${item.image || ''}" alt="Pendência ${item.number}" loading="lazy">
      </div>
      <div class="card-body">
        <p class="card-title">${item.title}</p>
        <p class="card-comment">${item.comment}</p>
        <div class="check-row">
          <input type="checkbox" id="check-${item.number}" ${item.checked ? 'checked' : ''}>
          <label for="check-${item.number}">${item.checked ? 'Resolvido ✓' : 'Marcar como resolvido'}</label>
        </div>
      </div>
    `;

    const img = card.querySelector('img');
    img.addEventListener('click', () => openLightbox(item.image, item.title));

    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => toggleItem(item.number, checkbox, card));

    cardsContainer.appendChild(card);
  });

  const doneCount = items.filter(i => i.checked).length;
  const pct = Math.round((doneCount / items.length) * 100);
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${doneCount}/${items.length} concluídas`;

  obsText.textContent = observacoes || '—';
}

function openLightbox(src, alt) {
  if (!src) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.hidden = false;
}
lightboxClose.addEventListener('click', () => { lightbox.hidden = true; });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.hidden = true; });

let currentParsed = null;

async function loadIssue() {
  try {
    const res = await fetch(API_BASE, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentParsed = parseBody(data.body || '');
    render(currentParsed);
  } catch (err) {
    cardsContainer.innerHTML = '<p class="loading">Não foi possível carregar a lista agora. Toque em "Atualizar lista" para tentar de novo.</p>';
    console.error(err);
  }
}

async function toggleItem(number, checkboxEl, cardEl) {
  if (saving) { checkboxEl.checked = !checkboxEl.checked; return; }
  saving = true;
  const desiredChecked = checkboxEl.checked;
  checkboxEl.disabled = true;
  showToast('Salvando...');

  try {
    const res = await fetch(API_BASE, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const fresh = parseBody(data.body || '');
    const freshItem = fresh.items.find(i => i.number === number);
    if (!freshItem) throw new Error('item não encontrado');

    const lines = fresh.lines;
    lines[freshItem.lineIndex] = lines[freshItem.lineIndex].replace(
      /\[( |x|X)\]/,
      desiredChecked ? '[x]' : '[ ]'
    );
    const newBody = lines.join('\n');

    const patchRes = await fetch(API_BASE, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body: newBody })
    });
    if (!patchRes.ok) throw new Error('HTTP ' + patchRes.status);

    cardEl.classList.toggle('done', desiredChecked);
    cardEl.querySelector('label').textContent = desiredChecked ? 'Resolvido ✓' : 'Marcar como resolvido';
    showToast(desiredChecked ? 'Marcado como resolvido!' : 'Desmarcado.');
    await loadIssue();
  } catch (err) {
    console.error(err);
    checkboxEl.checked = !desiredChecked;
    showToast('Não foi possível salvar. Verifique sua internet e tente de novo.', true);
  } finally {
    checkboxEl.disabled = false;
    saving = false;
  }
}

refreshBtn.addEventListener('click', () => {
  cardsContainer.innerHTML = '<p class="loading">Atualizando…</p>';
  loadIssue();
});

loadIssue();
setInterval(() => { if (!saving) loadIssue(); }, 45000);
