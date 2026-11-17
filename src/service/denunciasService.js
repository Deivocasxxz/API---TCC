import { randomBytes } from 'node:crypto';
import * as db from '../repository/denunciasRepository.js';
import {
  ETAPAS, ENCERRAMENTOS, erroValidacao, idPositivo, identificarChamado,
  parseFiltros, texto, validarDenuncia
} from './denunciasDomain.js';

function usuarioValido(id) {
  return idPositivo(id, 'Usuário');
}

export function opcoes() {
  return {
    etapas: ETAPAS,
    encerramentos: ENCERRAMENTOS,
    simulacao_habilitada: process.env.ROP_DEMO_DENUNCIAS === 'true',
    aviso: 'Sistema demonstrativo do TCC. Não realiza nem encaminha resgates reais.'
  };
}

export async function criar(id_usuario, dados) {
  const id = usuarioValido(id_usuario);
  const validado = validarDenuncia(dados);
  // Gerado no servidor; não utiliza o protocolo fornecido pelo navegador.
  const protocolo = `ROP-${randomBytes(12).toString('hex').toUpperCase()}`;
  const id_denuncia = await db.criarDenuncia(id, protocolo, validado);
  return db.procurarDenuncia(id, { coluna: 'id_denuncia', valor: id_denuncia });
}

export async function listar(id_usuario, filtros) {
  return db.listarDenuncias(usuarioValido(id_usuario), parseFiltros(filtros));
}

export async function detalhar(id_usuario, identificador) {
  const chamado = await db.procurarDenuncia(usuarioValido(id_usuario), identificarChamado(identificador));
  if (!chamado) throw erroValidacao('Denúncia não encontrada.', 404);
  return chamado;
}

export async function historico(id_usuario, identificador) {
  const chamado = await detalhar(id_usuario, identificador);
  return chamado.historico;
}

export async function resumo(id_usuario) {
  return db.resumoDenuncias(usuarioValido(id_usuario));
}

export async function saldo(id_usuario) {
  return db.consultarCredito(usuarioValido(id_usuario));
}

export async function movimentacoes(id_usuario, filtros) {
  return db.listarMovimentacoes(usuarioValido(id_usuario), parseFiltros({
    pagina: filtros?.pagina,
    limite: filtros?.limite
  }));
}

export async function acompanhar(id_usuario, identificador, dados) {
  if (!dados || typeof dados.acompanhar !== 'boolean') {
    throw erroValidacao('Informe acompanhar como verdadeiro ou falso.');
  }
  const id = usuarioValido(id_usuario);
  const chave = identificarChamado(identificador);
  const alterou = await db.definirAcompanhamento(id, chave, dados.acompanhar);
  if (!alterou) throw erroValidacao('Denúncia não encontrada.', 404);
  return db.procurarDenuncia(id, chave);
}

export async function simular(id_usuario, identificador, dados = {}) {
  if (process.env.ROP_DEMO_DENUNCIAS !== 'true') {
    throw erroValidacao('Simulação desabilitada no servidor.', 403);
  }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw erroValidacao('Dados de simulação inválidos.');
  }
  const encerramento = texto(dados.encerramento, 'o encerramento', 80);
  if (encerramento && !ENCERRAMENTOS.includes(encerramento)) {
    throw erroValidacao('Encerramento inválido.');
  }
  const observacao = texto(dados.observacao, 'a observação', 500);
  return db.simularProximaEtapa(
    usuarioValido(id_usuario), identificarChamado(identificador), encerramento, observacao
  );
}
