import * as service from '../service/cadastroService.js';

import { Router } from "express";
const endpoints = Router();



endpoints.post('/cadastro', async (req, resp) => {
  try {
    let conta = req.body;

    let id = await service.saveCadastro(conta);
    resp.send({ id });
  }
  catch (err) {
    resp.status(400).send({
      erro: err.message
    })
  }
})

endpoints.post('/cadastro/login', async (req, resp) => {
  try {
    let email = req.body.email;
    let senha_hash = req.body.senha_hash;

    let token = await service.login(email, senha_hash);
    resp.send({token});
  }
  catch (err) {
    resp.status(401).send({
      erro: err.message
    })
  }
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