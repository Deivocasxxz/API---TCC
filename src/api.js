    import 'dotenv/config'
    import express from 'express'
    import cors from 'cors'
    import { addRoutes } from './routes.js'; 

    const api = express();
    api.use(cors());
    api.use(express.json());

    addRoutes(api);

    const PORT = process.env.PORT;
    api.listen(PORT, () => console.log(`API subiu na porta ${PORT}`))

