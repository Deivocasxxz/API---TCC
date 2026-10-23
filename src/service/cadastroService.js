import * as db from '../repository/cadastroRepository.js';
import { generateToken } from '../utils/jwt.js';

export async function saveCadastro(usuario_cadastro) {
      let contaAtual = await db.getCadastroaByEmail(usuario_cadastro.email);

       if (contaAtual != null) {
    throw new Error('Conta já existe.');
  }

  return db.saveCadastro(conta);
}

export async function saveSenha(senha_hash) {
    let senha = await db.saveSenha(senha_hash)

    if (senha = senha_hash){
        throw new Error('Mesma senha que antes.');
    }

    return db.saveSenha(senha);
}

export async function saveEmail(email) {
    let e = await db.saveEmail(email)

    if (e = email){
        throw new Error('Mesmo email que antes.')
    }

    return db.saveEmail(e);
    
}

export async function login(email, senha_hash) {
  let conta = await db.login(email, senha_hash);
  if (conta == null) {
    throw new Error('Email ou senha inválidos.');
  }

  let token = generateToken(conta);
  return token;
}