import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/**
 * Serve arquivos estáticos a partir de um ou mais diretórios, cada um associado a um prefixo de URL.
 */
export class StaticFileServer {
  #mounts;

  /**
   * @param {{ prefix: string, directory: string }[]} mounts
   */
  constructor(mounts) {
    // Prefixos mais específicos têm prioridade ("/domain/" antes de "/").
    this.#mounts = mounts
      .map(({ prefix, directory }) => ({ prefix, directory: resolve(directory) }))
      .sort((a, b) => b.prefix.length - a.prefix.length);
  }

  /**
   * @param {string} urlPath
   * @param {import('node:http').ServerResponse} response
   * @returns {Promise<boolean>} false quando não existe arquivo para o caminho informado
   */
  async serve(urlPath, response) {
    const filePath = this.#resolveFilePath(urlPath);
    if (!filePath || !(await StaticFileServer.#isFile(filePath))) {
      return false;
    }

    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    await pipeline(createReadStream(filePath), response);
    return true;
  }

  #resolveFilePath(urlPath) {
    const mount = this.#mounts.find(({ prefix }) => urlPath.startsWith(prefix));
    if (!mount) return null;

    let relativePath;
    try {
      relativePath = decodeURIComponent(urlPath.slice(mount.prefix.length));
    } catch {
      return null;
    }
    if (relativePath.includes('\0')) return null;
    if (relativePath === '' || relativePath.endsWith('/')) {
      relativePath += 'index.html';
    }

    // Impede que caminhos como "/../package.json" acessem arquivos fora do diretório publicado.
    const filePath = resolve(mount.directory, relativePath);
    return filePath.startsWith(mount.directory + sep) ? filePath : null;
  }

  static async #isFile(filePath) {
    try {
      return (await stat(filePath)).isFile();
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
      throw error;
    }
  }
}
