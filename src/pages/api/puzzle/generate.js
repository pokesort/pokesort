import {
  FIELD_OPTIONS,
  randomInRange,
  pickRandom,
  getRandomFieldValue,
  pickRandomMult,
  generateTips
} from '@/src/scripts/utils.js';

import { populate } from './_utils';
import { FetchPokemonError, MaxAttemptsError } from '../../../scripts/erros';

let idsUsed = [];

export default async function handler(req, res) {

  let amount = req.query.amount;
  if (!amount) amount = 1;

  const password = req.query.password;
  const infinite = req.query.infinite == 'true';

  if (infinite && req.method !== 'POST') return res.status(403).json({ success: false, message: "Método não suportado" });
  const { generation, excludeFields } = req.body;

  if (amount > 30) return res.status(403).json({ success: false, message: "Quantidade de puzzles pedidos maior que o permitido" });

  if (!infinite && (password != process.env.AUTHORIZATION_BATCH)) return res.status(403).json({ success: false, message: "Usuário não permitido" });

  const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const puzzles = [];

  for (let i = 0; i < amount; i++) {
    const rows = randomInRange(4, 5);
    const cols = randomInRange(4, 6);
    idsUsed = [];

    const groups = [];
    try {
      for (let j = 0; j < rows; j++) {
        const group = await generateGroup(cols, generation, excludeFields, infinite);
        groups.push(group);
      }
    } catch (error) {
      if (error instanceof MaxAttemptsError) {
        return res.status(503).json({ error: error.message, code: 'MAX_ATTEMPTS' });
      }

      if (error instanceof FetchPokemonError) {
        return res.status(502).json({ error: error.message, code: 'FETCH_POKEMON_FAIL' });
      }
    }

    puzzles.push({
      author: "admin",
      from: "system",
      rows,
      cols,
      groups
    });
  }

  if (infinite) {
    const dictionary = await populate(res, puzzles[0]);
    return res.status(200).json({ success: true, data: puzzles[0], dictionary: dictionary });
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/puzzle/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(puzzles)
  });

  const result = await response.json();
  return res.status(response.status).json(result);
}

export async function generateGroup(cols, generation, excludeFields, infinite) {

  const max_attempt = 5;
  let attempt = 0;

  while (!infinite || infinite && attempt <= max_attempt) {

    let allFields = Object.keys(FIELD_OPTIONS);
    if (excludeFields != undefined) {
      allFields = allFields.filter(f => !excludeFields.includes(f));
    }

    let numFields = 0;
    numFields = randomInRange(1, 3);

    const selectedFields = pickRandom(allFields, numFields);

    const queryParts = selectedFields.map((field) => {
      const value = getRandomFieldValue(field);
      return `${field}=${value}`;
    });

    const query = '?' + queryParts.join('&');
    const route = `/api/pokemon/get${query}${generation ? `&max_generation=${generation}` : ''}`
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${route}`);

    if (!response.ok) {
      throw new FetchPokemonError(`Erro ao buscar pokémons: ${response.statusText}`);
    }

    const { pokemons } = await response.json();
    const ids = pokemons.map(p => p.id);

    if (ids.length >= cols) {

      const selected = pickRandomMult(ids, cols);
      const hasOverlap = selected.some(id => idsUsed.includes(id));

      if (hasOverlap) continue;
      idsUsed.push(...selected);

      const tips = generateTips(selected, query);
      
      return {
        query,
        pokemons: selected,
        tips
      };
    }

    // console.log("###### Tentativa " + attempt + " Falhou ######");

    attempt -= -1;
  }

  throw new MaxAttemptsError("Máximo de Tentativas alcançado")
}