import { join } from 'node:path';
import { PROJECT_ROOT } from './config.js';
import { CitizenController } from './http/CitizenController.js';
import { ErrorResponder } from './http/ErrorResponder.js';
import { HttpApplication } from './http/HttpApplication.js';
import { Router } from './http/Router.js';
import { StaticFileServer } from './http/StaticFileServer.js';

/**
 * Monta a aplicação HTTP a partir dos serviços já construídos.
 * Fica separado do server.js para que os testes possam subir a aplicação com outras dependências.
 *
 * @param {{
 *   citizenService: import('./application/CitizenService.js').CitizenService,
 *   logger?: Pick<Console, 'error'>,
 * }} dependencies
 */
export function createApp({ citizenService, logger = console }) {
  const citizens = new CitizenController(citizenService);

  const router = new Router()
    .get('/api/citizens', (request) => citizens.search(request))
    .post('/api/citizens', (request) => citizens.register(request));

  // O diretório de domínio também é publicado para que a interface valide nome e CPF
  // com exatamente as mesmas regras do servidor, sem duplicar código.
  const staticFiles = new StaticFileServer([
    { prefix: '/', directory: join(PROJECT_ROOT, 'public') },
    { prefix: '/domain/', directory: join(PROJECT_ROOT, 'src', 'domain') },
  ]);

  return new HttpApplication({
    router,
    staticFiles,
    errorResponder: new ErrorResponder(logger),
  });
}
