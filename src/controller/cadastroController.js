import * as dbCadastro from '../repository/cadastroRepository.js';

import { Router } from "express";
const endpoints = Router();

endpoints.post('/cadastro', async (req, resp) => {
  let cad = req.body;

  let id_usuario = await dbCadastro.criarConta(cad);
  resp.send({ id_usuario });
})

endpoints.put('/email/:id', async (req, resp) => {
  let id_usuario = req.params.id;
  let email = req.body;

  let qtd = await dbCadastro.atualizarEmail(id_usuario, email);
  resp.send({ qtd })
})

endpoints.put('/senha/:id', async (req, resp) => {
  let id_usuario = req.params.id;
  let senha = req.body;

  let qtd = await dbCadastro.atualizarSenha(id_usuario, senha);
  resp.send({ qtd })
})

export default endpoints;