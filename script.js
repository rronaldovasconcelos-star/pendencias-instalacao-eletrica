// ===== Configuração =====
// Cole aqui a URL do App da Web do Google Apps Script (termina em /exec)
const API_URL = 'COLE_A_URL_DO_APPS_SCRIPT_AQUI';

// ===== Dados das pendências =====
const PENDENCIAS = [
  { numero: 1, foto: 'WhatsApp Image 2026-09-16 at 11.05.59 (2).jpeg', titulo: 'Cano elétrico aparente sobre o perfil', comentario: 'Cano elétrico aparente sobre o perfil; ao entrar na sala da frente, fica exposto.' },
  { numero: 2, foto: 'WhatsApp Image 2026-09-16 at 11.05.59.jpeg', titulo: 'Cano elétrico aparente sobre o perfil', comentario: 'Cano elétrico aparente sobre o perfil; ao entrar na sala da frente, fica exposto.' },
  { numero: 3, foto: 'WhatsApp Image 2026-09-16 at 11.06.00 (1).jpeg', titulo: 'Cano elétrico aparente sobre o perfil', comentario: 'Cano elétrico aparente sobre o perfil; ao entrar na sala da frente, fica exposto.' },
  { numero: 4, foto: 'WhatsApp Image 2026-09-16 at 11.06.00 (2).jpeg', titulo: 'Final da eletrocalha sem acabamento', comentario: 'Final da eletrocalha sem acabamento — verificar se é necessário conectá-la a algo neste ponto.' },
  { numero: 5, foto: 'WhatsApp Image 2026-09-16 at 11.06.00 (3).jpeg', titulo: 'Canos tortos, estética comprometida', comentario: 'Canos tortos, com a estética comprometida.' },
  { numero: 6, foto: 'WhatsApp Image 2026-09-16 at 11.06.00 (4).jpeg', titulo: 'Eletrocalha amassada na passagem dos tubos', comentario: 'Eletrocalha amassada durante a passagem dos tubos (sei que as chapas são finas, mas seria interessante tentar melhorar a aparência).' },
  { numero: 7, foto: 'WhatsApp Image 2026-09-16 at 11.06.00.jpeg', titulo: 'Perfis tortos / checar fixação no teto', comentario: 'Perfis tortos; falta checar a fixação dos parafusos no teto.' },
  { numero: 8, foto: 'WhatsApp Image 2026-09-16 at 11.06.01 (1).jpeg', titulo: 'Conexões da eletrocalha se desuniram', comentario: 'Ao passar os tubos, as conexões da eletrocalha se desuniram.' },
  { numero: 9, foto: 'WhatsApp Image 2026-09-16 at 11.06.01 (2).jpeg', titulo: 'Peça da abraçadeira fora do encaixe', comentario: 'Peça da abraçadeira fora do encaixe — sugiro conferir todas, para evitar que se soltem por pressão.' },
  { numero: 10, foto: 'WhatsApp Image 2026-09-16 at 11.06.01 (3).jpeg', titulo: 'Eletrocalha amassada na biblioteca', comentario: 'Eletrocalha amassada dentro da biblioteca durante a passagem da tubulação.' },
  { numero: 11, foto: 'WhatsApp Image 2026-09-16 at 11.06.01.jpeg', titulo: 'Eletrocalha amassada na biblioteca', comentario: 'Eletrocalha amassada dentro da biblioteca durante a passagem da tubulação.' },
  { numero: 12, foto: 'WhatsApp Image 2026-09-16 at 11.06.02 (1).jpeg', titulo: 'Marcas de parafuso no teto', comentario: 'Parafuso de fixação deixou marcas no teto ao ser inserido — há vários assim; sugiro correção e pintura.' },
  { numero: 13, foto: 'WhatsApp Image 2026-09-16 at 11.06.02 (2).jpeg', titulo: 'Eletrocalha se desencaixando', comentario: 'Eletrocalha se desencaixando devido à passagem dos tubos — conferir se há parafuso prendendo do lado da parede.' },
  { numero: 14, foto: 'WhatsApp Image 2026-09-16 at 11.06.02 (3).jpeg', titulo: 'Conduíte deve chegar por trás do quadro', comentario: 'O Seu Zé pediu que o conduíte encaixe por trás, chegando por trás do quadro, pois numa eventual manutenção será complicado fazer isso devido ao fio que ficará dentro da parede. Verificar por onde o conduíte passa para abrir a passagem até o quadro.' },
  { numero: 15, foto: 'WhatsApp Image 2026-09-16 at 11.06.02.jpeg', titulo: 'Alça sobrando', comentario: 'Alça sobrando.' }
];

// ===== Elementos =====
const cardsContainer = document.getElementById('cardsContainer');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');
const refreshBtn = document.getElementById('refreshBtn');
const statusMsg = document.getElementById('statusMsg');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const toast = document.getElementById('toast');

const apiConfigurada = /^https:\/\/script\.google\.com\/.+\/exec$/.test(API_URL);

// estado: numero -> { feito, atualizadoEm }
let estado = {};
let salvando = false;

// ===== Utilidades =====
function mostrarToast(msg, erro) {
  toast.textContent = msg;
  toast.classList.toggle('error', !!erro);
  toast.hidden = false;
  clearTimeout(mostrarToast.t);
  mostrarToast.t = setTimeout(function () { toast.hidden = true; }, 2600);
}

function mostrarStatus(msg) {
  statusMsg.textContent = msg || '';
  statusMsg.hidden = !msg;
}

function aplicarEstado(itens) {
  estado = {};
  (itens || []).forEach(function (i) {
    estado[i.numero] = { feito: !!i.feito, atualizadoEm: i.atualizadoEm || '' };
  });
}

// ===== Renderização =====
function criarCards() {
  cardsContainer.innerHTML = '';
  PENDENCIAS.forEach(function (p) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.numero = p.numero;

    const fotoUrl = encodeURIComponent(p.foto);

    card.innerHTML =
      '<div class="card-photo-wrap">' +
        '<span class="card-num">' + p.numero + '/' + PENDENCIAS.length + '</span>' +
        '<img src="' + fotoUrl + '" alt="Pendência ' + p.numero + '" loading="lazy">' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-title"></h3>' +
        '<p class="card-comment"></p>' +
        '<div class="check-row">' +
          '<input type="checkbox" id="check-' + p.numero + '">' +
          '<label for="check-' + p.numero + '">Marcar como resolvido</label>' +
        '</div>' +
        '<p class="card-date" hidden></p>' +
      '</div>';

    card.querySelector('.card-title').textContent = p.titulo;
    card.querySelector('.card-comment').textContent = p.comentario;

    card.querySelector('img').addEventListener('click', function () {
      abrirFoto(fotoUrl, p.titulo);
    });

    const caixa = card.querySelector('input');
    caixa.disabled = !apiConfigurada;
    caixa.addEventListener('change', function () {
      alternar(p.numero, caixa);
    });

    cardsContainer.appendChild(card);
  });
}

function atualizarTela() {
  let feitos = 0;
  PENDENCIAS.forEach(function (p) {
    const card = cardsContainer.querySelector('[data-numero="' + p.numero + '"]');
    if (!card) return;
    const info = estado[p.numero] || { feito: false, atualizadoEm: '' };
    if (info.feito) feitos++;

    card.classList.toggle('done', info.feito);
    const caixa = card.querySelector('input');
    caixa.checked = info.feito;
    card.querySelector('label').textContent = info.feito ? 'Resolvido ✓' : 'Marcar como resolvido';

    const data = card.querySelector('.card-date');
    if (info.feito && info.atualizadoEm) {
      data.textContent = 'Resolvido em ' + info.atualizadoEm;
      data.hidden = false;
    } else {
      data.hidden = true;
    }
  });

  const pct = Math.round((feitos / PENDENCIAS.length) * 100);
  progressFill.style.width = pct + '%';
  progressLabel.textContent = feitos + '/' + PENDENCIAS.length + ' concluídas';
}

// ===== Comunicação com a planilha =====
async function carregar(silencioso) {
  if (!apiConfigurada) {
    mostrarStatus('Modo visualização: o salvamento ainda não foi configurado.');
    atualizarTela();
    return;
  }
  try {
    const resp = await fetch(API_URL, { method: 'GET' });
    const dados = await resp.json();
    if (!dados.ok) throw new Error(dados.erro || 'resposta inválida');
    aplicarEstado(dados.itens);
    atualizarTela();
    mostrarStatus('');
  } catch (err) {
    console.error(err);
    if (!silencioso) mostrarStatus('Não foi possível carregar o status agora. Toque em "Atualizar lista" para tentar de novo.');
  }
}

async function alternar(numero, caixa) {
  const desejado = caixa.checked;
  if (salvando) { caixa.checked = !desejado; return; }
  salvando = true;
  caixa.disabled = true;
  mostrarToast('Salvando...');

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ numero: numero, feito: desejado })
    });
    const dados = await resp.json();
    if (!dados.ok) throw new Error(dados.erro || 'falha ao salvar');
    aplicarEstado(dados.itens);
    atualizarTela();
    mostrarToast(desejado ? 'Marcado como resolvido!' : 'Desmarcado.');
  } catch (err) {
    console.error(err);
    caixa.checked = !desejado;
    mostrarToast('Não foi possível salvar. Verifique a internet e tente de novo.', true);
  } finally {
    caixa.disabled = false;
    salvando = false;
  }
}

// ===== Foto ampliada =====
function abrirFoto(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.hidden = false;
}
lightboxClose.addEventListener('click', function () { lightbox.hidden = true; });
lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.hidden = true; });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lightbox.hidden = true; });

// ===== Início =====
refreshBtn.addEventListener('click', function () {
  mostrarToast('Atualizando...');
  carregar(false);
});

criarCards();
carregar(false);
setInterval(function () {
  if (!salvando && document.visibilityState === 'visible') carregar(true);
}, 45000);
