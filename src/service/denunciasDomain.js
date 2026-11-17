// Regras puras do módulo demonstrativo de denúncias do TCC R.O.P.
// Compatível com Banco de Dados TCC - R.O.P(2).sql.

export const ETAPAS = Object.freeze([
  'Recebida', 'Em análise', 'Equipe acionada', 'A caminho', 'No local',
  'Animal resgatado', 'Em transporte', 'Em atendimento', 'Em tratamento',
  'Em recuperação', 'Reintroduzido à natureza', 'Concluída'
]);

export const ENCERRAMENTOS = Object.freeze([
  'Animal não localizado',
  'Encaminhado a outro órgão',
  'Denúncia duplicada',
  'Animal não sobreviveu',
  'Denúncia falsa intencional'
]);

export function erroValidacao(mensagem, status = 400) {
  return Object.assign(new Error(mensagem), { status });
}

export function texto(valor, campo, tamanho, obrigatorio = false) {
  if (valor === undefined || valor === null || valor === '') {
    if (obrigatorio) throw erroValidacao(`Informe ${campo}.`);
    return '';
  }
  if (typeof valor !== 'string') throw erroValidacao(`${campo} deve ser um texto.`);
  const normalizado = valor.trim();
  if (normalizado.length > tamanho) {
    throw erroValidacao(`${campo} deve ter no máximo ${tamanho} caracteres.`);
  }
  if (obrigatorio && !normalizado) throw erroValidacao(`Informe ${campo}.`);
  return normalizado;
}

export function idPositivo(valor, campo = 'ID') {
  const textoId = String(valor ?? '');
  if (!/^[1-9]\d*$/.test(textoId) || !Number.isSafeInteger(Number(textoId))) {
    throw erroValidacao(`${campo} inválido.`);
  }
  return Number(textoId);
}

export function identificarChamado(valor) {
  const id = String(valor ?? '').trim();
  if (/^[1-9]\d*$/.test(id)) return { coluna: 'id_denuncia', valor: idPositivo(id, 'Chamado') };
  if (/^ROP-[A-F0-9]{18,32}$/i.test(id)) return { coluna: 'protocolo', valor: id.toUpperCase() };
  throw erroValidacao('Protocolo ou ID de denúncia inválido.');
}

function urlImagem(valor, campo, permitirData = false) {
  const url = texto(valor, campo, permitirData ? 2_000_000 : 500);
  if (!url) return null;
  // Aceita somente imagens previamente embutidas, páginas de assets do site ou URLs HTTPS.
  if (/^\/assets\/img\/(?:[\w-]+\/)*[\w-]+\.(?:png|jpe?g|webp)$/i.test(url)) return url;
  if (!permitirData && /^https:\/\/[^\s]+$/i.test(url)) return url;
  if (permitirData) {
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
    if (match) {
      const bytes = Buffer.from(match[2], 'base64');
      if (bytes.length === 0 || bytes.length > 1_400_000) throw erroValidacao('A foto ultrapassou o tamanho permitido.');
      const tipo = match[1];
      const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      if ((tipo === 'jpeg' && jpg) || (tipo === 'png' && png) || (tipo === 'webp' && webp)) return url;
    }
  }
  throw erroValidacao(`${campo} deve conter uma imagem válida.`);
}

function numeroCoordenada(valor, limite, campo) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) > limite) {
    throw erroValidacao(`${campo} inválida.`);
  }
  return valor;
}

export function validarDenuncia(dados = {}) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw erroValidacao('Informe os dados da denúncia.');
  }
  const especie = texto(dados.especie, 'a espécie', 100) || null;
  const id_catalogo = dados.id_catalogo === undefined || dados.id_catalogo === null || dados.id_catalogo === ''
    ? null : idPositivo(dados.id_catalogo, 'ID da espécie no catálogo');
  const especie_imagem_url = urlImagem(dados.especie_imagem_url ?? dados.especieImagem, 'Imagem da espécie');
  const condicao = texto(dados.condicao, 'o estado do animal', 80, true);
  const descricao = texto(dados.descricao, 'a descrição', 1200, true);
  const detalhes_local = texto(dados.detalhes_local ?? dados.detalhesLocal, 'detalhes do local', 500) || null;
  const foto = urlImagem(dados.foto, 'Foto', true);

  const acompanhar = dados.acompanhar === undefined ? true : dados.acompanhar;
  if (typeof acompanhar !== 'boolean') throw erroValidacao('Acompanhar deve ser verdadeiro ou falso.');

  const entrada = dados.localizacao_dados ?? dados.localizacao ?? {};
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada)) {
    throw erroValidacao('Localização inválida.');
  }
  const modo = entrada.modo ?? dados.localizacao_modo ?? 'bairro';
  if (!['bairro', 'aproximada', 'exata'].includes(modo)) throw erroValidacao('Modo de localização inválido.');
  let localizacao_dados;
  let localidade;
  if (modo === 'bairro') {
    const bairro = texto(entrada.bairro, 'o bairro ou referência', 100);
    const rua = texto(entrada.rua, 'a rua', 150);
    const cidade = texto(entrada.cidade, 'a cidade', 100);
    // Aceita localidade textual do formulário ou do botão de exemplo fictício.
    const localSalvo = texto(dados.localidade ?? dados.local, 'a localidade', 400);
    if (!bairro && !localSalvo) throw erroValidacao('Informe o bairro ou a localidade.');
    localidade = localSalvo || [rua, bairro, cidade].filter(Boolean).join(', ');
    localizacao_dados = { modo, bairro, rua, cidade };
  } else {
    const coord = entrada.coordenadas;
    if (!coord || typeof coord !== 'object' || Array.isArray(coord)) {
      throw erroValidacao('Informe as coordenadas da localização.');
    }
    const latitude = numeroCoordenada(coord.latitude, 90, 'Latitude');
    const longitude = numeroCoordenada(coord.longitude, 180, 'Longitude');
    const precisao = coord.precisao === undefined || coord.precisao === null
      ? null : numeroCoordenada(coord.precisao, 1_000_000, 'Precisão');
    if (precisao !== null && precisao < 0) throw erroValidacao('Precisão inválida.');
    const casas = modo === 'aproximada' ? 2 : 5;
    const lat = Number(latitude.toFixed(casas));
    const lon = Number(longitude.toFixed(casas));
    localidade = `${modo === 'aproximada' ? 'Localização aproximada' : 'Localização GPS'}: ${lat.toFixed(casas)}, ${lon.toFixed(casas)}`;
    localizacao_dados = { modo, coordenadas: { latitude: lat, longitude: lon, precisao } };
  }
  if (localidade.length > 400) throw erroValidacao('Localidade deve ter no máximo 400 caracteres.');

  return {
    especie, id_catalogo, especie_imagem_url,
    localidade, localizacao_modo: modo, localizacao_dados,
    detalhes_local, condicao, descricao, foto, acompanhar
  };
}

export function estadoChamado(chamado) {
  return chamado.encerramento || ETAPAS[chamado.etapa] || 'Desconhecido';
}

export function finalizado(chamado) {
  return Boolean(chamado.encerramento) || Number(chamado.etapa) === ETAPAS.length - 1;
}

export function decidirAtualizacao(chamado, encerramento = '') {
  if (finalizado(chamado)) throw erroValidacao('O chamado já foi encerrado.', 409);
  if (encerramento && !ENCERRAMENTOS.includes(encerramento)) {
    throw erroValidacao('Encerramento inválido.');
  }
  if (encerramento === 'Denúncia falsa intencional' && chamado.validacao === 'confirmada') {
    throw erroValidacao('Não é possível aplicar fraude após confirmação.', 409);
  }
  const etapa = encerramento ? Number(chamado.etapa) : Number(chamado.etapa) + 1;
  let validacao = chamado.validacao;
  if (encerramento === 'Denúncia falsa intencional') validacao = 'falsa';
  else if (etapa >= 5) validacao = 'confirmada';
  else if (encerramento) validacao = 'inconclusiva';
  else validacao = 'pendente';
  const movimento = validacao === 'confirmada' && chamado.validacao !== 'confirmada'
    ? 'confirmacao'
    : validacao === 'falsa' && chamado.validacao !== 'falsa'
      ? 'fraude_intencional'
      : null;
  return { etapa, validacao, encerramento: encerramento || null, estado: encerramento || ETAPAS[etapa], movimento };
}

export function parseFiltros(entrada = {}) {
  const busca = texto(entrada.busca, 'a busca', 100);
  const filtro = texto(entrada.filtro, 'o filtro', 80) || 'todos';
  if (!['todos', 'ativos', 'encerrados', ...ETAPAS, ...ENCERRAMENTOS].includes(filtro)) {
    throw erroValidacao('Filtro de chamados inválido.');
  }
  const pagina = entrada.pagina === undefined ? 1 : idPositivo(entrada.pagina, 'Página');
  const limite = entrada.limite === undefined ? 50 : idPositivo(entrada.limite, 'Limite');
  if (limite > 100 || pagina > 100_000) throw erroValidacao('Paginação fora do limite permitido.');
  return { busca, filtro, pagina, limite, offset: (pagina - 1) * limite };
}
