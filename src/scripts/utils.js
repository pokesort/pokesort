export const FIELD_OPTIONS = {
  types: { min: 1, max: 18 },
  color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
  region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
  shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
  egg_groups: ['monster', 'dragon', 'ground', 'water1', 'bug', 'flying', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
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

export const easy = [1, 2, 3, 11];
export const medium = [4, 5, 12, 17];
export const hard = [6, 13, 14, 15];
export const expert = [7, 8, 9, 10];

// Estrutura de desafios por nível com campos disponíveis
export const CHALLENGE_FIELDS = {
  1: {
    types: { min: 1, max: 18 },
    // color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    dual: { min: 1, max: 2 },
    categories: [...easy],
  },
  2: {
    types: { min: 1, max: 18 },
    // color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    dual: { min: 1, max: 2 },
    others: { min: 1, max: 2 },
    step: ['no_line', 'has_split', 'is_split'],
    categories: [...easy, ...medium],
  },
  3: {
    types: { min: 1, max: 18 },
    // color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    dual: { min: 1, max: 2 },
    others: { min: 1, max: 2 },
    step: ['no_line', 'has_split', 'is_split'],
    weak: { min: 1, max: 18 },
    strong: { min: 1, max: 18 },
    methods: { min: 2, max: 11 },
    categories: [...easy, ...medium, ...hard],
  },
  4: {
    types: { min: 1, max: 18 },
    // color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
    region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
    generation: { min: 1, max: 9 },
    form: ['first', 'middle', 'final'],
    dual: { min: 1, max: 2 },
    others: { min: 1, max: 2 },
    step: ['no_line', 'has_split', 'is_split'],
    weak: { min: 1, max: 18 },
    strong: { min: 1, max: 18 },
    methods: { min: 2, max: 11 },
    abilities: { min: 1, max: 307 },
    moves: { min: 1, max: 919 },
    categories: [...easy, ...medium, ...hard, ...expert],
    shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
    egg_groups: ['monster', 'dragon', 'ground', 'water1', 'bug', 'flying', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
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
  methods: 3,
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

export const WEIGHT_VALUES = {
  shape: 5,
  egg_groups: 5,
  methods: 5,
  abilities: 4,
  moves: 4,
  categories: 3,
  others: 3,
  types: 3,
  weak: 2,
  strong: 2,
  region: 2,
  generation: 2,
  step: 2,
  form: 2,
  color: 1,
  dual: 1,
  // immune: 1,
  // habitat: 1,
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
  const { amount, password, rows, cols, challenge, generation, infinite } = params;
  let challengeValue = parseInt(challenge);
  const errors = [];

  if (!amount || amount > 30 || amount < 1) {
    errors.push('Quantidade máxima de puzzles deve ser um número entre 1 e 30');
  }

  if (!infinite && (!password || password !== process.env.AUTHORIZATION_BATCH)) {
    errors.push('Senha inválida');
  }

  if (generation && (generation < 1 || generation > 9)) {
    errors.push('Geração máxima inválida');
  }

  const validDifficulties = [1, 2, 3, 4, 5];
  if (!challenge || !validDifficulties.includes(challengeValue)) {
    errors.push('Nível de desafio inválido para essa liga pokemon');
  }

  const { finalRows, finalCols } = getGridSize(challenge, rows, cols);

  if (errors.length > 0) {
    console.log(errors);
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
    generation,
    infinite
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

  if (queries[0] == "?") {    
    queries = queries.slice(1);
  }
  queries = queries.split('&');
  
  const text = queries.reduce((best, cur) => {
    return (WEIGHT_VALUES[cur.split("=")[0]] ?? 0) >
          (WEIGHT_VALUES[best.split("=")[0]] ?? 0)
      ? cur
      : best;
  });
  const values = pokemons;

  return [
    `pair?${values}`,
    `text?${text}`
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

export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

export function compareArrays(a, b) {
  if (a.length !== b.length) return false;
  return a.slice().sort().every((val, i) => val === b.slice().sort()[i]);
}

export function adjustDateTime(date) {
  const offset = process.env.TIME_OFFSET_HOURS || 0;

  const offsetInMiliseconds = offset * 60 * 60 * 1000;
  date.setTime(date.getTime() + offsetInMiliseconds);

  return date;
}

export const getPuzzleStatus = (ids) => {
  let data = null;

  ids.forEach(id => {
      const userData = localStorage.getItem(`s_${id}`);
      if (!userData) return;

      if (!data) data = {status: -1};
      
      const parsed = JSON.parse(userData);
      if (parsed.shiny != undefined && parsed.shiny.length > 0) {
          data["shiny"] = parsed.shiny;
      }
      if (parsed.status > data.status) {
          data["status"] = parsed.status;
      }
  })

  return data;
}