import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getAuthentication } from '../utils/jwt.js';
import * as service from '../service/denunciasService.js';

const endpoints = Router();
const autenticado = getAuthentication();

const limitarCriacao = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Limite de denúncias atingido. Tente novamente mais tarde.' }
});

const limitarSimulacao = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 150,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Limite de simulações atingido.' }
});

function executar(resp, fn) {
  return Promise.resolve().then(fn).catch((erro) => {
    const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500
      ? erro.status
      : erro.code === 'ER_NO_REFERENCED_ROW_2' ? 400
        : erro.code === 'ER_DUP_ENTRY' ? 409 : 500;
    if (status === 500) console.error('[R.O.P. denúncias]', erro);
    resp.status(status).json({
      erro: status === 500 ? 'Erro interno ao processar a denúncia.' : erro.message
    });
  });
}

// Rotas estáticas antes das rotas com :id.
endpoints.get('/denuncias/opcoes', (req, resp) => resp.json(service.opcoes()));

endpoints.get('/denuncias/me/resumo', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.resumo(req.user.id_usuario))));

endpoints.get('/denuncias/me', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.listar(req.user.id_usuario, req.query))));

endpoints.get('/creditos/me', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.saldo(req.user.id_usuario))));

endpoints.get('/creditos/me/movimentacoes', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.movimentacoes(req.user.id_usuario, req.query))));

endpoints.post('/denuncias', autenticado, limitarCriacao, (req, resp) =>
  executar(resp, async () => resp.status(201).json(await service.criar(req.user.id_usuario, req.body))));

endpoints.get('/denuncias/:id/historico', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.historico(req.user.id_usuario, req.params.id))));

endpoints.patch('/denuncias/:id/acompanhar', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.acompanhar(req.user.id_usuario, req.params.id, req.body))));

endpoints.post('/denuncias/:id/simular', autenticado, limitarSimulacao, (req, resp) =>
  executar(resp, async () => resp.json(await service.simular(req.user.id_usuario, req.params.id, req.body))));

endpoints.get('/denuncias/:id', autenticado, (req, resp) =>
  executar(resp, async () => resp.json(await service.detalhar(req.user.id_usuario, req.params.id))));

export default endpoints;
