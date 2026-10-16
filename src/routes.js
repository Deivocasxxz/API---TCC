import login from './controller/loginController.js'
import diario from './controller/diarioController.js'
import anotacao from './controller/anotacaoController.js'

export function addRoutes(api) {
  api.use(login);
  api.use(diario)
  api.use(anotacao)
 
}

