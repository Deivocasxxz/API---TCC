import * as dbAnimais from '../repository/animaisRepository.js';

import { Router } from "express";
const endpoints = Router();


endpoints.get('/mamifero', async (req, resp) => {
  let mam = await dbAnimais.listMamiferos();
  resp.send(mam);
})

endpoints.get('/aves', async (req, resp) => {
  let ave = await dbAnimais.listAves();
  resp.send(ave);
})

endpoints.get('/repteis', async (req, resp) => {
  let rep = await dbAnimais.listRepteis();
  resp.send(rep);
})

endpoints.get('/anfibios', async (req, resp) => {
  let anf = await dbAnimais.listAnfibios();
  resp.send(anf);
})

endpoints.get('/peixes', async (req, resp) => {
  let pei = await dbAnimais.listPeixes();
  resp.send(pei);
})

endpoints.get('/invertebrados', async (req, resp) => {
  let inv = await dbAnimais.listInvertebrados();
  resp.send(inv);
})

endpoints.get('/animais', async (req, resp) => {
  let ani = await dbAnimais.listAnimais();
  resp.send(ani);
})

endpoints.get('/pesquisa/:nome', async (req, resp) => {
    try {
    const nome = req.query.nome || '';

    const ani = await dbAnimais.listAnimaisPesquisa(nome);

    resp.send(ani);
  } catch (err) {
    console.error(err);
    resp.status(500).send({
      erro: 'Erro ao listar animais.'
    });
  }
});


export default endpoints;