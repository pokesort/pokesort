import { CHALLENGE_FIELDS, pickRandom, randomInRange, WEIGHT_VALUES } from "../scripts/utils"
// Classe para controlar campos disponíveis e evitar repetições
export class PuzzleFieldManager {
  constructor(challenge) {
    this.challenge = challenge;
    this.availableFields = JSON.parse(JSON.stringify(
      this.getAvailableFieldsForChallenge(challenge)
    ));
    this.usedFields = new Set(); // Armazena campos já utilizados no puzzle
    this.usedValues = new Map(); // Armazena valores específicos já utilizados por campo
  }

  // Obtém campos disponíveis para o nível de desafio
  getAvailableFieldsForChallenge(challenge) {
    return CHALLENGE_FIELDS[challenge] || CHALLENGE_FIELDS[1];
  }

  // Obtém campos disponíveis que ainda não foram usados
  getAvailableFields() {
    const available = {};
    for (const [field, values] of Object.entries(this.availableFields)) {
      if (!this.usedFields.has(field)) {
        available[field] = values;
      }
    }
    return available;
  }

  // Obtém valores disponíveis para um campo específico
  getAvailableValuesForField(field) {
    if (this.usedFields.has(field)) {
      return null; // Campo já foi usado completamente
    }

    const fieldDefinition = this.availableFields[field];
    if (!fieldDefinition) {
      return null;
    }

    // Se é um array, filtra valores já usados
    if (Array.isArray(fieldDefinition)) {
      const usedValues = this.usedValues.get(field) || new Set();
      return fieldDefinition.filter(value => !usedValues.has(value));
    }

    // Se é um objeto com min/max, verifica se ainda há valores disponíveis
    if (typeof fieldDefinition === 'object' && 'min' in fieldDefinition && 'max' in fieldDefinition) {
      const usedValues = this.usedValues.get(field) || new Set();
      const availableValues = [];

      for (let i = fieldDefinition.min; i <= fieldDefinition.max; i++) {
        if (!usedValues.has(i)) {
          availableValues.push(i);
        }
      }

      // Se não há mais valores disponíveis, retorna null
      if (availableValues.length === 0) {
        return null;
      }

      // Retorna array de valores disponíveis
      return availableValues;
    }

    return fieldDefinition;
  }

  // Marca um campo como usado (remove completamente)
  markFieldAsUsed(field) {
    this.usedFields.add(field);
  }

  // Marca um valor específico como usado
  markValueAsUsed(field, value) {
    if (!this.usedValues.has(field)) {
      this.usedValues.set(field, new Set());
    }
    this.usedValues.get(field).add(value);
  }

  // Marca uma query completa como usada (extrai campos e valores)
  markQueryAsUsed(query) {
    if (!query || typeof query !== 'string') return;

    const pairs = query.split('&');
    for (const pair of pairs) {
      const [field, value] = pair.split('=');
      if (field && value) {
        this.markValueAsUsed(field, value);
      }
    }
  }

  // Verifica se um campo ainda está disponível
  isFieldAvailable(field) {
    return !this.usedFields.has(field) && this.availableFields.hasOwnProperty(field);
  }

  // Verifica se um valor específico ainda está disponível
  isValueAvailable(field, value) {
    if (!this.isFieldAvailable(field)) return false;

    const usedValues = this.usedValues.get(field);
    return !usedValues || !usedValues.has(value);
  }

  // Gera um valor aleatório para um campo disponível
  generateRandomValueForField(field) {
    const availableValues = this.getAvailableValuesForField(field);
    if (!availableValues) return null;

    if (Array.isArray(availableValues)) {
      if (availableValues.length === 0) return null;
      return pickRandom(availableValues, 1)[0];
    } else if (typeof availableValues === 'object' && 'min' in availableValues && 'max' in availableValues) {
      return randomInRange(availableValues.min, availableValues.max);
    }

    return null;
  }

  // Gera uma query aleatória com campos disponíveis, usando pesos de WEIGHT_VALUES
  generateRandomQuery() {
    const availableFields = this.getAvailableFields();
    let fieldNames = Object.keys(availableFields);

    if (fieldNames.length === 0) return null;

    const getValidFields = () => {
      return fieldNames.filter(field => {
        const availableValues = this.getAvailableValuesForField(field);
        const weight = WEIGHT_VALUES[field];
        return availableValues !== null &&
          availableValues !== undefined &&
          (Array.isArray(availableValues) ? availableValues.length > 0 : true) &&
          weight !== undefined;
      });
    };

    let validFields = getValidFields();
    if (validFields.length === 0) return null;

    const maxAttempts = 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {

      validFields = getValidFields();
      if (validFields.length === 0) return null;

      const numFields = randomInRange(1, Math.min(3, validFields.length));

      const shuffledFields = pickRandom(validFields, validFields.length);

      const selectedFields = [];
      let totalWeight = 0;

      for (const field of shuffledFields) {
        const weight = WEIGHT_VALUES[field];

        const availableValues = this.getAvailableValuesForField(field);
        if (availableValues === null || availableValues === undefined) {
          continue;
        }

        selectedFields.push(field);
        totalWeight += weight;

        if (selectedFields.length === numFields) {
          break;
        }
      }
      
      if (totalWeight >= 5 && selectedFields.length === numFields) {
        
        const queryParts = [];
        for (const field of selectedFields) {
          const value = this.generateRandomValueForField(field);
          if (value !== null) {
            queryParts.push(`${field}=${value}`);
            this.markValueAsUsed(field, value);
          }
        }
        console.log(queryParts);
        
        return queryParts.length > 0 ? queryParts.join('&') : null;
      }
    }

    return null;
  }

  // Reset para um novo puzzle
  reset() {
    this.usedFields.clear();
    this.usedValues.clear();
  }
}

// Funções auxiliares para facilitar o uso da estrutura

// Obtém campos disponíveis para um nível de desafio
export function getFieldsForChallenge(challenge) {
  return CHALLENGE_FIELDS[challenge] || CHALLENGE_FIELDS[1];
}

// Cria um novo gerenciador de campos para um puzzle
export function createPuzzleFieldManager(challenge) {
  return new PuzzleFieldManager(challenge);
}

// Verifica se um nível de desafio é válido
export function isValidChallenge(challenge) {
  return CHALLENGE_FIELDS.hasOwnProperty(challenge);
}

// Obtém todos os níveis de desafio disponíveis
export function getAvailableChallenges() {
  return Object.keys(CHALLENGE_FIELDS).map(Number).sort();
}

// Obtém informações sobre um nível de desafio
export function getChallengeInfo(challenge) {
  if (!isValidChallenge(challenge)) {
    return null;
  }

  const fields = getFieldsForChallenge(challenge);
  const fieldNames = Object.keys(fields);

  return {
    level: challenge,
    availableFields: fieldNames,
    fieldCount: fieldNames.length,
    fields: fields
  };
}

// Função para gerar uma query sem repetições usando o gerenciador
export function generateUniqueQuery(fieldManager) {
  return fieldManager.generateRandomQuery();
}

// Função para verificar se uma query pode ser usada (não tem conflitos)
export function canUseQuery(fieldManager, query) {
  if (!query || typeof query !== 'string') return false;

  const pairs = query.split('&');
  for (const pair of pairs) {
    const [field, value] = pair.split('=');
    if (field && value && !fieldManager.isValueAvailable(field, value)) {
      return false;
    }
  }
  return true;
}

// Exemplo de uso da estrutura:
/*
// Criar um gerenciador para desafio nível 2
const fieldManager = createPuzzleFieldManager(2);
 
// Gerar uma query única
const query1 = generateUniqueQuery(fieldManager, 2);
console.log('Query 1:', query1); // Ex: "types=5&color=red"
 
// Marcar a query como usada
fieldManager.markQueryAsUsed(query1);
 
// Gerar outra query (não repetirá os valores usados)
const query2 = generateUniqueQuery(fieldManager, 2);
console.log('Query 2:', query2); // Ex: "types=12&color=blue" (diferente da primeira)
 
// Verificar se uma query específica pode ser usada
const testQuery = "types=5&color=red";
console.log('Pode usar testQuery?', canUseQuery(fieldManager, testQuery)); // false (já foi usada)
 
// Reset para novo puzzle
fieldManager.reset();
*/