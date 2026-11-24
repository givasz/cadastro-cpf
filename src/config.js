import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));

const DEFAULT_PORT = 3000;
const DEFAULT_DATA_FILE = 'data/citizens.json';

/**
 * Lê a configuração a partir das variáveis de ambiente, aplicando valores padrão.
 * Caminhos relativos são resolvidos a partir da raiz do projeto, e não do diretório atual.
 */
export function loadConfig(env = process.env) {
  const port = env.PORT === undefined ? DEFAULT_PORT : Number(env.PORT);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT inválida: "${env.PORT}". Informe um número entre 0 e 65535.`);
  }

  return Object.freeze({
    port,
    host: env.HOST ?? 'localhost',
    dataFile: resolve(PROJECT_ROOT, env.DATA_FILE ?? DEFAULT_DATA_FILE),
  });
}
