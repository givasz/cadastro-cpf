import { createApp } from './app.js';
import { CitizenService } from './application/CitizenService.js';
import { loadConfig } from './config.js';
import { JsonFileCitizenRepository } from './infrastructure/JsonFileCitizenRepository.js';

const config = loadConfig();

const repository = await JsonFileCitizenRepository.open(config.dataFile);
const app = createApp({ citizenService: new CitizenService(repository) });

const { port } = await app.listen(config.port, config.host);
console.log(`Aplicação disponível em http://${config.host}:${port}`);
console.log(`Dados armazenados em ${config.dataFile}`);

const shutdown = async (signal) => {
  console.log(`\n${signal} recebido, encerrando o servidor...`);
  await app.close();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
