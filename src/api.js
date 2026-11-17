
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { addRoutes } from './routes.js';

const api = express();

// Configurações do servidor
api.use(cors());
// Recebe fotos JPEG comprimidas pelo frontend, sem aceitar payloads ilimitados.
api.use(express.json({ limit: '3mb' }));
api.use((erro, req, resp, next) => {
    if (erro?.type === 'entity.too.large') {
        return resp.status(413).json({ erro: 'Imagem ou conteúdo grande demais (limite de 3 MB).' });
    }
    if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
        return resp.status(400).json({ erro: 'JSON inválido.' });
    }
    next(erro);
});

// Teste de funcionamento da API
api.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        mensagem: 'API R.O.P. funcionando'
    });
});

// Mantém as rotas existentes
addRoutes(api);

// Porta do servidor
const PORT = Number(process.env.PORT) || 5050;

api.listen(PORT, () => {
    console.log(
        `API R.O.P. iniciada em http://localhost:${PORT}`
    );
});
