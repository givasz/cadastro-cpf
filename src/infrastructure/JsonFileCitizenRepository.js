import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CitizenRepository } from '../domain/CitizenRepository.js';
import { CitizenAlreadyRegisteredError } from '../domain/errors.js';
import { CitizenRecordMapper } from './CitizenRecordMapper.js';

/**
 * Persiste os cidadãos em um arquivo JSON, mantendo uma cópia em memória para as consultas.
 *
 * As gravações são enfileiradas para que duas requisições simultâneas não sobrescrevam
 * uma à outra, e o arquivo é escrito em um temporário e depois renomeado, evitando que
 * uma falha no meio da escrita deixe o arquivo corrompido.
 */
export class JsonFileCitizenRepository extends CitizenRepository {
  #filePath;
  #citizensByCpf;
  #pendingWrite = Promise.resolve();

  constructor(filePath, citizens = []) {
    super();
    this.#filePath = filePath;
    this.#citizensByCpf = new Map(citizens.map((citizen) => [citizen.cpf.value, citizen]));
  }

  static async open(filePath) {
    const records = await JsonFileCitizenRepository.#readRecords(filePath);
    return new JsonFileCitizenRepository(filePath, records.map(CitizenRecordMapper.toDomain));
  }

  add(citizen) {
    const write = this.#pendingWrite.then(() => this.#insert(citizen));
    // A fila segue em frente mesmo se esta gravação falhar; quem chamou recebe o erro via `write`.
    this.#pendingWrite = write.catch(() => {});
    return write;
  }

  async search(query) {
    return query.apply(this.#citizensByCpf.values());
  }

  async #insert(citizen) {
    if (this.#citizensByCpf.has(citizen.cpf.value)) {
      throw new CitizenAlreadyRegisteredError(citizen.cpf);
    }

    // Só atualiza o estado em memória depois que o arquivo foi gravado com sucesso.
    const updated = new Map(this.#citizensByCpf).set(citizen.cpf.value, citizen);
    await this.#writeRecords([...updated.values()].map(CitizenRecordMapper.toRecord));
    this.#citizensByCpf = updated;
  }

  async #writeRecords(records) {
    const temporaryPath = `${this.#filePath}.tmp`;
    await mkdir(dirname(this.#filePath), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.#filePath);
  }

  static async #readRecords(filePath) {
    let content;
    try {
      content = await readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }

    try {
      const records = JSON.parse(content);
      if (!Array.isArray(records)) throw new TypeError('o conteúdo deve ser uma lista.');
      return records;
    } catch (error) {
      throw new Error(`Arquivo de dados inválido: ${filePath}`, { cause: error });
    }
  }
}
