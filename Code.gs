/**
 * Checklist de pendências — Instalação Elétrica
 * Cole este código em: Planilha > Extensões > Apps Script
 * Depois: Implantar > Nova implantação > Tipo "App da Web"
 *   Executar como: Eu | Quem pode acessar: Qualquer pessoa
 */

const NOME_ABA = 'Pendencias';

const ITENS = [
  [1, 'Cano elétrico aparente sobre o perfil'],
  [2, 'Cano elétrico aparente sobre o perfil'],
  [3, 'Cano elétrico aparente sobre o perfil'],
  [4, 'Final da eletrocalha sem acabamento'],
  [5, 'Canos tortos, estética comprometida'],
  [6, 'Eletrocalha amassada na passagem dos tubos'],
  [7, 'Perfis tortos / checar fixação no teto'],
  [8, 'Conexões da eletrocalha se desuniram'],
  [9, 'Peça da abraçadeira fora do encaixe'],
  [10, 'Eletrocalha amassada na biblioteca'],
  [11, 'Eletrocalha amassada na biblioteca'],
  [12, 'Marcas de parafuso no teto'],
  [13, 'Eletrocalha se desencaixando'],
  [14, 'Conduíte deve chegar por trás do quadro'],
  [15, 'Alça sobrando']
];

function obterAba_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) {
    aba = planilha.insertSheet(NOME_ABA);
    aba.appendRow(['Nº', 'Pendência', 'Status', 'Atualizado em']);
    ITENS.forEach(function (item) {
      aba.appendRow([item[0], item[1], 'Pendente', '']);
    });
    aba.setFrozenRows(1);
    aba.getRange('A1:D1').setFontWeight('bold');
    aba.getRange('D2:D100').setNumberFormat('dd/mm/yyyy hh:mm');
    const regra = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Resolvido')
      .setBackground('#d9f2e3')
      .setRanges([aba.getRange('C2:C100')])
      .build();
    aba.setConditionalFormatRules([regra]);
    aba.autoResizeColumns(1, 4);
  }
  return aba;
}

function lerEstado_() {
  const aba = obterAba_();
  const total = aba.getLastRow() - 1;
  if (total < 1) return [];
  const linhas = aba.getRange(2, 1, total, 4).getValues();
  return linhas.map(function (l) {
    const data = l[3] instanceof Date
      ? Utilities.formatDate(l[3], 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm')
      : '';
    return { numero: Number(l[0]), feito: l[2] === 'Resolvido', atualizadoEm: data };
  });
}

function responder_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Leitura: a página chama isto ao abrir e a cada 45 segundos
function doGet() {
  return responder_({ ok: true, itens: lerEstado_() });
}

// Escrita: a página chama isto quando alguém marca/desmarca um item
function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents);
    const numero = Number(dados.numero);
    const feito = dados.feito === true;

    const aba = obterAba_();
    const numeros = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getValues()
      .map(function (l) { return Number(l[0]); });
    const indice = numeros.indexOf(numero);
    if (indice === -1) {
      return responder_({ ok: false, erro: 'Item não encontrado' });
    }

    aba.getRange(indice + 2, 3, 1, 2)
      .setValues([[feito ? 'Resolvido' : 'Pendente', new Date()]]);

    return responder_({ ok: true, itens: lerEstado_() });
  } catch (erro) {
    return responder_({ ok: false, erro: String(erro) });
  } finally {
    trava.releaseLock();
  }
}

// Opcional: rode uma vez pelo editor para criar a aba antes de implantar
function configurar() {
  obterAba_();
}
