import { con } from './connection.js';
import { decidirAtualizacao, ENCERRAMENTOS, ETAPAS, erroValidacao, estadoChamado } from '../service/denunciasDomain.js';

const SELECT_DENUNCIA = `
  SELECT d.*, m.variacao AS credito_chamado
  FROM denuncias AS d
  LEFT JOIN creditos_movimentacoes AS m ON m.id_denuncia = d.id_denuncia`;

function json(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'object') return valor;
  try { return JSON.parse(valor); } catch { return null; }
}

function dataISO(valor) {
  if (valor instanceof Date) return valor.toISOString();
  if (!valor) return null;
  return String(valor).replace(' ', 'T');
}

export function mapearDenuncia(row, historico = undefined) {
  const resposta = {
    id: row.protocolo,
    id_denuncia: row.id_denuncia,
    protocolo: row.protocolo,
    id_usuario: row.id_usuario,
    id_catalogo: row.id_catalogo,
    especie: row.especie || '',
    especieImagem: row.especie_imagem_url || '',
    local: row.localidade,
    localizacao: json(row.localizacao_dados),
    localizacao_modo: row.localizacao_modo,
    detalhesLocal: row.detalhes_local || '',
    condicao: row.condicao,
    descricao: row.descricao,
    foto: row.foto || '',
    acompanhar: Boolean(row.acompanhar),
    etapa: Number(row.etapa),
    validacao: row.validacao,
    observacao_validacao: row.observacao_validacao || '',
    encerramento: row.encerramento || '',
    status: estadoChamado(row),
    credito: Number(row.credito_chamado || 0),
    criadoEm: dataISO(row.criado_em),
    atualizadoEm: dataISO(row.atualizado_em)
  };
  if (historico !== undefined) resposta.historico = historico;
  return resposta;
}

function mapearHistorico(row) {
  return {
    id_historico: row.id_historico,
    estado: row.estado,
    etapa: row.etapa === null ? null : Number(row.etapa),
    observacao: row.observacao || '',
    data: dataISO(row.data_evento)
  };
}

export async function consultarHistorico(id_denuncia) {
  const [rows] = await con.execute(
    `SELECT id_historico, estado, etapa, observacao, data_evento
       FROM denuncias_historico WHERE id_denuncia = ?
       ORDER BY data_evento ASC, id_historico ASC`,
    [id_denuncia]
  );
  return rows.map(mapearHistorico);
}

export async function procurarDenuncia(id_usuario, identificador, comHistorico = true) {
  // A coluna nunca recebe um valor livre: é escolhida no service entre duas opções fixas.
  const [rows] = await con.execute(
    `${SELECT_DENUNCIA} WHERE d.${identificador.coluna} = ? AND d.id_usuario = ? LIMIT 1`,
    [identificador.valor, id_usuario]
  );
  if (!rows.length) return null;
  return mapearDenuncia(rows[0], comHistorico ? await consultarHistorico(rows[0].id_denuncia) : undefined);
}

export async function criarDenuncia(id_usuario, protocolo, dados) {
  const db = await con.getConnection();
  try {
    await db.beginTransaction();
    // Verifica que a conta não foi excluída entre o login e o registro.
    const [usuarios] = await db.execute(
      'SELECT id_usuario FROM usuario_cadastro WHERE id_usuario = ? FOR UPDATE', [id_usuario]
    );
    if (!usuarios.length) throw erroValidacao('Sua conta não foi encontrada.', 401);
    const [result] = await db.execute(
      `INSERT INTO denuncias (
        protocolo, id_usuario, id_catalogo, especie, especie_imagem_url,
        localidade, localizacao_modo, localizacao_dados, detalhes_local,
        condicao, descricao, foto, acompanhar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        protocolo, id_usuario, dados.id_catalogo, dados.especie, dados.especie_imagem_url,
        dados.localidade, dados.localizacao_modo, JSON.stringify(dados.localizacao_dados),
        dados.detalhes_local, dados.condicao, dados.descricao, dados.foto,
        dados.acompanhar ? 1 : 0
      ]
    );
    await db.execute(
      `INSERT INTO denuncias_historico (id_denuncia, estado, etapa)
       VALUES (?, ?, 0)`,
      [result.insertId, ETAPAS[0]]
    );
    await db.commit();
    return result.insertId;
  } catch (erro) {
    await db.rollback();
    throw erro;
  } finally {
    db.release();
  }
}

export async function listarDenuncias(id_usuario, filtros) {
  const condicoes = ['d.id_usuario = ?'];
  const params = [id_usuario];
  const { filtro, busca } = filtros;
  if (filtro === 'ativos') condicoes.push('d.encerramento IS NULL AND d.etapa < 11');
  else if (filtro === 'encerrados') condicoes.push('(d.encerramento IS NOT NULL OR d.etapa = 11)');
  else if (ETAPAS.includes(filtro)) {
    condicoes.push('d.etapa = ? AND d.encerramento IS NULL');
    params.push(ETAPAS.indexOf(filtro));
  } else if (ENCERRAMENTOS.includes(filtro)) {
    condicoes.push('d.encerramento = ?');
    params.push(filtro);
  }
  if (busca) {
    condicoes.push('(d.protocolo LIKE ? OR d.especie LIKE ? OR d.localidade LIKE ? OR d.detalhes_local LIKE ?)');
    const q = `%${busca.replace(/[\\%_]/g, '\\$&')}%`;
    params.push(q, q, q, q);
  }
  const where = condicoes.join(' AND ');
  const [counts] = await con.execute(`SELECT COUNT(*) AS total FROM denuncias d WHERE ${where}`, params);
  const [rows] = await con.execute(
    `${SELECT_DENUNCIA} WHERE ${where}
     ORDER BY d.criado_em DESC, d.id_denuncia DESC LIMIT ? OFFSET ?`,
    [...params, filtros.limite, filtros.offset]
  );
  return {
    itens: rows.map((r) => mapearDenuncia(r)),
    paginacao: { total: Number(counts[0].total), pagina: filtros.pagina, limite: filtros.limite }
  };
}

export async function resumoDenuncias(id_usuario) {
  const [[usuario], [resumo]] = await Promise.all([
    con.execute('SELECT creditos FROM usuario_cadastro WHERE id_usuario = ? LIMIT 1', [id_usuario]),
    con.execute(`SELECT COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN encerramento IS NULL AND etapa < 11 THEN 1 ELSE 0 END), 0) AS ativos,
      COALESCE(SUM(CASE WHEN validacao = 'confirmada' THEN 1 ELSE 0 END), 0) AS confirmadas,
      COALESCE(SUM(CASE WHEN validacao = 'falsa' THEN 1 ELSE 0 END), 0) AS falsas,
      COALESCE(SUM(CASE WHEN encerramento IS NOT NULL OR etapa = 11 THEN 1 ELSE 0 END), 0) AS encerrados
      FROM denuncias WHERE id_usuario = ?`, [id_usuario])
  ]);
  if (!usuario.length) throw erroValidacao('Sua conta não foi encontrada.', 401);
  return {
    creditos: Number(usuario[0].creditos),
    total: Number(resumo[0].total), ativos: Number(resumo[0].ativos),
    confirmadas: Number(resumo[0].confirmadas), falsas: Number(resumo[0].falsas),
    encerrados: Number(resumo[0].encerrados)
  };
}

export async function consultarCredito(id_usuario) {
  const [rows] = await con.execute(
    'SELECT id_usuario, creditos FROM usuario_cadastro WHERE id_usuario = ? LIMIT 1',
    [id_usuario]
  );
  if (!rows.length) throw erroValidacao('Conta não encontrada.', 401);
  return { id_usuario: rows[0].id_usuario, creditos: Number(rows[0].creditos) };
}

export async function listarMovimentacoes(id_usuario, filtros) {
  const [rows] = await con.execute(
    `SELECT m.id_movimento, m.id_denuncia, d.protocolo, m.tipo,
            m.variacao, m.saldo_apos, m.criado_em
       FROM creditos_movimentacoes m
       JOIN denuncias d ON d.id_denuncia = m.id_denuncia
      WHERE m.id_usuario = ?
      ORDER BY m.criado_em DESC, m.id_movimento DESC LIMIT ? OFFSET ?`,
    [id_usuario, filtros.limite, filtros.offset]
  );
  return rows.map((r) => ({ ...r, criado_em: dataISO(r.criado_em) }));
}

export async function definirAcompanhamento(id_usuario, identificador, acompanhar) {
  // Primeiro consulta a existência: atualizar o mesmo valor não deve retornar falso 404.
  const [linhas] = await con.execute(
    `SELECT id_denuncia FROM denuncias
      WHERE ${identificador.coluna} = ? AND id_usuario = ? LIMIT 1`,
    [identificador.valor, id_usuario]
  );
  if (!linhas.length) return false;
  const [resultado] = await con.execute(
    'UPDATE denuncias SET acompanhar = ? WHERE id_denuncia = ? AND id_usuario = ?',
    [acompanhar ? 1 : 0, linhas[0].id_denuncia, id_usuario]
  );
  return resultado.affectedRows > 0;
}

export async function simularProximaEtapa(id_usuario, identificador, encerramento, observacao) {
  const db = await con.getConnection();
  let id_denuncia;
  let novoSaldo;
  try {
    await db.beginTransaction();
    const [rows] = await db.execute(
      `SELECT * FROM denuncias
        WHERE ${identificador.coluna} = ? AND id_usuario = ? LIMIT 1 FOR UPDATE`,
      [identificador.valor, id_usuario]
    );
    if (!rows.length) throw erroValidacao('Denúncia não encontrada.', 404);
    const atual = rows[0];
    id_denuncia = atual.id_denuncia;
    const decisao = decidirAtualizacao(atual, encerramento);

    // A linha do usuário é bloqueada antes de qualquer atualização financeira.
    const [usuarios] = await db.execute(
      'SELECT creditos FROM usuario_cadastro WHERE id_usuario = ? FOR UPDATE', [id_usuario]
    );
    if (!usuarios.length) throw erroValidacao('Conta não encontrada.', 401);
    novoSaldo = Number(usuarios[0].creditos);

    if (decisao.movimento) {
      const [existentes] = await db.execute(
        'SELECT id_movimento FROM creditos_movimentacoes WHERE id_denuncia = ? LIMIT 1', [id_denuncia]
      );
      if (existentes.length) throw erroValidacao('Já houve movimentação de créditos neste chamado.', 409);
      const variacao = decisao.movimento === 'confirmacao' ? 10 : -Math.min(25, novoSaldo);
      novoSaldo += variacao;
      await db.execute('UPDATE usuario_cadastro SET creditos = ? WHERE id_usuario = ?', [novoSaldo, id_usuario]);
      await db.execute(
        `INSERT INTO creditos_movimentacoes
            (id_usuario, id_denuncia, tipo, variacao, saldo_apos)
         VALUES (?, ?, ?, ?, ?)`,
        [id_usuario, id_denuncia, decisao.movimento, variacao, novoSaldo]
      );
    }

    await db.execute(
      `UPDATE denuncias
          SET etapa = ?, validacao = ?, encerramento = ?,
              observacao_validacao = CASE WHEN ? THEN ? ELSE observacao_validacao END
        WHERE id_denuncia = ?`,
      [decisao.etapa, decisao.validacao, decisao.encerramento,
        Boolean(encerramento), encerramento ? (observacao || null) : null, id_denuncia]
    );
    await db.execute(
      `INSERT INTO denuncias_historico (id_denuncia, estado, etapa, observacao)
       VALUES (?, ?, ?, ?)`,
      [id_denuncia, decisao.estado, decisao.etapa, observacao || null]
    );
    await db.commit();
  } catch (erro) {
    await db.rollback();
    throw erro;
  } finally {
    db.release();
  }
  const chamado = await procurarDenuncia(id_usuario, { coluna: 'id_denuncia', valor: id_denuncia });
  return { chamado, creditos: novoSaldo };
}
