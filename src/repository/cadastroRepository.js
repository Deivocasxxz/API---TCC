import { con } from "./connection.js";

export async function criarConta(usuario_cadastro) {
  const command = `
    insert into usuario_cadastro (nome_usuario, email, senha_hash)
                 values (?, ?, ?)
  `

  const [result] = await con.query(command, [
    usuario_cadastro.nome_usuario,
    usuario_cadastro.email,
    usuario_cadastro.senha_hash,
  ]);

  return result.insertId;
}

export async function atualizarEmail(id_usuario, usuario_cadastro) {
  const command = `
    update usuario_cadastro
       set email
     where id_usuario = ?
  `

  const [result] = await con.query(command, [
    usuario_cadastro.email,
    id_usuario
  ]);
  return result.affectedRows;
}

export async function atualizarSenha(id_usuario, usuario_cadastro) {
  const command = `
    update usuario_cadastro
       set senha_hash
     where id_usuario = ?
  `

  const [result] = await con.query(command, [
    usuario_cadastro.senha,
    id_usuario
  ]);
  return result.affectedRows;
}