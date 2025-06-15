import {
  FIELD_OPTIONS,
  randomInRange,
  pickRandom,
  getRandomFieldValue,
  pickRandomMult
} from '@/src/scripts/utils.js';

let idsUsed = [];

export default async function handler(req, res) {

  const amount = req.query.amount;
  const password = req.query.password;

  if (amount > 30) return res.status(403).json({ success: false, message: "Quantidade de puzzles pedidos maior que o permitido" });

  if (password != process.env.AUTHORIZATION_BATCH) return res.status(403).json({success: false, message: "Usuário não permitido"});

  const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const puzzles = [];

  for (let i = 0; i < amount; i++) {
    const rows = randomInRange(4, 5);
    const cols = randomInRange(4, 6);
    idsUsed = [];

    const groups = [];
    for (let j = 0; j < rows; j++) {
      const group = await generateGroup(cols);
      groups.push(group);
    }

    puzzles.push({
      author: "admin",
      from: "system",
      rows,
      cols,
      groups
    });
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

  // return res.status(200).json({ success: true, puzzles });
}

export async function generateGroup(cols) {

  while (true) {
    const allFields = Object.keys(FIELD_OPTIONS);
    const numFields = randomInRange(2, 3);
    const selectedFields = pickRandom(allFields, numFields);

    const queryParts = selectedFields.map((field) => {
      const value = getRandomFieldValue(field);
      return `${field}=${value}`;
    });

    const query = '?'+queryParts.join('&');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pokemon/get${query}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar pokémons: ${response.statusText}`);
    }

    const { pokemons } = await response.json();
    const ids = pokemons.map(p => p.id);

    if (ids.length >= cols) {

      const selected = pickRandomMult(ids, cols);
      const hasOverlap = selected.some(id => idsUsed.includes(id));

      if (hasOverlap) continue;
      idsUsed.push(...selected);

      return {
        query,
        pokemons: selected
      };
    }
  }
}