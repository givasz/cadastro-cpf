import { Citizen } from '../domain/Citizen.js';

/**
 * Converte cidadãos de/para o formato gravado em disco.
 * O CPF é armazenado só com dígitos; a formatação é responsabilidade da apresentação.
 */
export class CitizenRecordMapper {
  static toRecord(citizen) {
    return {
      name: citizen.name.value,
      cpf: citizen.cpf.value,
      registeredAt: citizen.registeredAt.toISOString(),
    };
  }

  static toDomain(record) {
    return new Citizen({
      name: record.name,
      cpf: record.cpf,
      registeredAt: new Date(record.registeredAt),
    });
  }
}
