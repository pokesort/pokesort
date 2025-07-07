export const FIELD_OPTIONS = {
  types: { min: 1, max: 18 }, 
  color: ['red', 'blue', 'green', 'yellow', 'black', 'brown', 'gray', 'pink', 'purple', 'white'],
  region: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea'],
  shape: ['armor', 'wings', 'quadruped', 'ball', 'squiggle', 'fish', 'arms', 'blob', 'upright', 'legs', 'heads', 'bug-wings', 'humanoid', 'tentacles'],
  egg_groups: ['monster', 'dragon', 'field', 'water1', 'bug', 'flying', 'ground', 'fairy', 'plant', 'humanshape', 'water3', 'mineral', 'indeterminate', 'water2', 'ditto', 'dragon', 'no-eggs'],
  categories: { min: 1, max: 16 },
  others: { min: 1, max: 2 },
  methods: { min: 1, max: 11 },
  moves: { min: 1, max: 919 },
  generation: { min: 1, max: 9 },
  abilities: { min: 1, max: 307 },
  habitat: ['cave', 'forest', 'grassland', 'mountain', 'rare', 'rough-terrain', 'sea', 'urban', 'waters-edge'],
  step: ['no_line', 'has_split', 'is_split'],
  weak: { min: 1, max: 18 },
  strong: { min: 1, max: 18 },
  immune: [1, 2, 3, 4, 5, 8, 13, 14, 16], //normal, fighting, flying, poison, ground, fantasma, eletrico, psychic, dragao
  form: ['first', 'middle', 'final'],
  dual: { min: 1, max: 2 },
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

export const getRandomFieldValue = (field) => {
  const definition = FIELD_OPTIONS[field];
  if (Array.isArray(definition)) {
    return pickRandom(definition, 1)[0];
  } else if (typeof definition === 'object' && 'min' in definition && 'max' in definition) {
    return randomInRange(definition.min, definition.max);
  } else {
    throw new Error(`Invalid field definition for "${field}"`);
  }
};

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

export function formatDate(inputDate, locale, full=true) {
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