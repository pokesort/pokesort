export const FIELD_OPTIONS = {
  types: { min: 1, max: 18 },
  color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
  region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
  shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
  egg_groups: ['monster', 'dragon', 'field', 'water1', 'bug', 'flying', 'ground', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
  categories: { min: 1, max: 17 },
  others: { min: 1, max: 2 },
  methods: { min: 1, max: 11 },
  moves: { min: 1, max: 919 },
  generation: { min: 1, max: 9 },
  abilities: { min: 1, max: 307 },
  // habitat: ['cave', 'forest', 'grassland', 'mountain', 'rare', 'rough-terrain', 'sea', 'urban', 'waters-edge'],
  step: ['no_line', 'has_split', 'is_split'],
  weak: { min: 1, max: 18 },
  strong: { min: 1, max: 18 },
  // immune: [1, 2, 4, 5, 8, 13, 14, 16], //normal, fighting, poison, ground, fantasma, eletrico, psychic, dragao
  form: ['first', 'middle', 'final'],
  dual: { min: 1, max: 2 },
};

// Estrutura de desafios por nível com campos disponíveis
export const CHALLENGE_FIELDS = {
  1: {
    types: { min: 1, max: 18 },
    color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final']
  },
  2: {
    types: { min: 1, max: 18 },
    color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
    egg_groups: ['monster', 'dragon', 'field', 'water1', 'bug', 'flying', 'ground', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    others: { min: 1, max: 2 },
    methods: { min: 1, max: 11 }
  },
  3: {
    types: { min: 1, max: 18 },
    color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
    egg_groups: ['monster', 'dragon', 'field', 'water1', 'bug', 'flying', 'ground', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    others: { min: 1, max: 2 },
    methods: { min: 1, max: 11 },
    abilities: { min: 1, max: 307 },
    step: ['no_line', 'has_split', 'is_split']
  },
  4: {
    types: { min: 1, max: 18 },
    color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
    egg_groups: ['monster', 'dragon', 'field', 'water1', 'bug', 'flying', 'ground', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    others: { min: 1, max: 2 },
    methods: { min: 1, max: 11 },
    abilities: { min: 1, max: 307 },
    step: ['no_line', 'has_split', 'is_split'],
    weak: { min: 1, max: 18 },
    strong: { min: 1, max: 18 },
    dual: { min: 1, max: 2 }
  }
};

export const MAX_SELECT = {
  types: 2,
  color: 1,
  region: 1,
  shape: 1,
  egg_groups: 2,
  categories: 0,
  others: 1,
  methods: 1,
  moves: 0,
  generation: 1,
  abilities: 3,
  // habitat: 1,
  step: 1,
  weak: 0,
  strong: 0,
  // immune: 0,
  form: 1,
  dual: 1,
};

export const REGIONALS = ['-alola', '-galar', '-hisui', '-paldea'];

export const getNextRefresh = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return tomorrow;
}

export const randomInRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pickRandom = (array, count = 1) => {
  const copy = [...array];
  const result = [];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
};


export function pickRandomMult(array, count = 1) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const getRandomFieldValue = (field, fields) => {
  const definition = fields[field];
  if (Array.isArray(definition)) {
    return pickRandom(definition, 1)[0];
  } else if (typeof definition === 'object' && 'min' in definition && 'max' in definition) {
    return randomInRange(definition.min, definition.max);
  } else {
    throw new Error(`Invalid field definition for "${field}"`);
  }
};

export function validateGenerateParams(params) {
  const { amount, password, rows, cols, challenge, max_generation } = params;
  const errors = [];

  if (!amount || amount > 30 || amount < 1) {
    errors.push('Quantidade máxima de puzzles deve ser um número entre 1 e 30');
  }

  if (!password || password !== process.env.AUTHORIZATION_BATCH) {
    errors.push('Senha inválida');
  }

  if (max_generation && (max_generation < 1 || max_generation > 9)) {
    errors.push('Geração máxima inválida');
  }

  const validDifficulties = ['1', '2', '3', '4'];
  if (!challenge || !validDifficulties.includes(challenge)) {
    errors.push('Nível de desafio inválido para essa liga pokemon');
  }

  const { finalRows, finalCols } = getGridSize(challenge, rows, cols);

  if (errors.length > 0) {
    return {
      error: errors.join('; '),
      status: 400
    };
  }

  return {
    amount,
    rows: finalRows,
    cols: finalCols,
    challenge,
    max_generation,
  };
}

export function getGridSize(challenge, rows, cols) {
  const challengeConfigs = {
    1: [
      { rows: 4, cols: 4 }
    ],
    2: [
      { rows: 4, cols: 5 },
      { rows: 5, cols: 4 }
    ],
    3: [
      { rows: 4, cols: 6 },
      { rows: 5, cols: 5 }
    ],
    4: [
      { rows: 5, cols: 6 }
    ]
  };

  let finalRows = rows;
  let finalCols = cols;

  if (!rows || !cols) {
    const availableConfigs = challengeConfigs[challenge];
    if (availableConfigs && availableConfigs.length > 0) {

      const randomConfig = availableConfigs[Math.floor(Math.random() * availableConfigs.length)];
      finalRows = randomConfig.rows;
      finalCols = randomConfig.cols;
    } else {
      finalRows = 4;
      finalCols = 4;
    }
  }

  return { finalRows, finalCols };
}

export const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') {
    return "";
  }

  str = str.replaceAll('-', ' ');

  return str.toLowerCase().split(' ')
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export function formatDate(inputDate, locale, full = true) {
  const date = new Date(`${inputDate}T00:00:00`);
  if (full) {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } else {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long'
    });
  }
}

export function isYesterday(inputStr, todayStr) {
  const [inputYear, inputMonth, inputDay] = inputStr.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);

  const input = new Date(inputYear, inputMonth - 1, inputDay);
  const yesterday = new Date(todayYear, todayMonth - 1, todayDay - 1);

  return input.getTime() === yesterday.getTime();
}

export function includesAnySubstring(mainString, substrings) {
  return substrings.some(sub => mainString.includes(sub));
}

export function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export function generateTips(ids, queries) {
  const pokemons = pickRandomMult(ids, Math.floor(ids.length / 2));

  queries = queries.slice(1);
  queries = queries.split('&');

  const text = pickRandom(queries)[0];
  const values = pokemons;

  return [
    `text?${text}`,
    `pair?${values}`
  ];
}

export function decodeTips(tip) {
  const split = tip.split('?');
  let type = split[0];
  let values = (type == 'pair') ?
    split[1].split(',') :
    [{ key: split[1].split('=')[0], value: split[1].split('=')[1] }]

  return {
    type, values
  }
}

export function compareArrays(a, b) {
  if (a.length !== b.length) return false;
  return a.slice().sort().every((val, i) => val === b.slice().sort()[i]);
}

export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Classe para controlar campos disponíveis e evitar repetições
export class PuzzleFieldManager {
  constructor(challenge) {
    this.challenge = challenge;
    this.availableFields = this.getAvailableFieldsForChallenge(challenge);
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

    // Se é um objeto com min/max, retorna o objeto original
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

  // Gera uma query aleatória com campos disponíveis
  generateRandomQuery(maxFields = 2) {
    const availableFields = this.getAvailableFields();
    const fieldNames = Object.keys(availableFields);

    if (fieldNames.length === 0) return null;

    const numFields = Math.min(maxFields, fieldNames.length);
    const selectedFields = pickRandom(fieldNames, numFields);

    const queryParts = [];
    for (const field of selectedFields) {
      const value = this.generateRandomValueForField(field);
      if (value !== null) {
        queryParts.push(`${field}=${value}`);
        this.markValueAsUsed(field, value);
      }
    }

    return queryParts.length > 0 ? queryParts.join('&') : null;
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
export function generateUniqueQuery(fieldManager, maxFields = 2) {
  return fieldManager.generateRandomQuery(maxFields);
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