import { connect, data } from "@/lib/mongodb";

export default async function handler(req, res) {

  try {

    const validatedParams = validateParams(req.query);
    if (validatedParams.error) {
      return res.status(validatedParams.status).json({ error: validatedParams.error });
    }
    const { amount, rows, cols, challenge } = validatedParams;

    await connect();

    // Aqui você pode adicionar a lógica para gerar os puzzles
    // com os parâmetros validados

    return res.status(200).json({
      message: 'Parâmetros validados com sucesso',
      data: {
        amount,
        rows,
        cols,
        challenge
      }
    });

  } catch (error) {
    console.error('Erro ao gerar puzzle:', error);
    return res.status(500).json({ error: 'Erro ao gerar puzzle' });
  }
}

export function validateParams(params) {
  const { amount, password, rows, cols, challenge } = params;
  const errors = [];

  if (!amount || amount > 30 || amount < 1) {
    errors.push('Quantidade máxima de puzzles deve ser um número entre 1 e 30');
  }

  if (!password || password !== process.env.AUTHORIZATION_BATCH) {
    errors.push('Senha inválida');
  }

  const validDifficulties = ['trainer', 'gym_leader', 'elite_four', 'champion'];
  if (!challenge || !validDifficulties.includes(challenge)) {
    errors.push('Nível de desafio inválido para essa liga pokemon');
  }

  // Estrutura mais simples: mapeia challenge diretamente para configurações
  const challengeConfigs = {
    'trainer': [
      { rows: 4, cols: 4 }
    ],
    'gym_leader': [
      { rows: 4, cols: 5 },
      { rows: 5, cols: 4 }
    ],
    'elite_four': [
      { rows: 4, cols: 6 },
      { rows: 5, cols: 5 }
    ],
    'champion': [
      { rows: 5, cols: 6 }
    ]
  };

  let finalRows = rows;
  let finalCols = cols;

  // Se rows ou cols não foram fornecidos, escolher baseado no challenge
  if (!rows || !cols) {
    const availableConfigs = challengeConfigs[challenge];
    if (availableConfigs && availableConfigs.length > 0) {
      // Escolher configuração aleatória
      const randomConfig = availableConfigs[Math.floor(Math.random() * availableConfigs.length)];
      finalRows = randomConfig.rows;
      finalCols = randomConfig.cols;
    } else {
      // Fallback
      finalRows = 4;
      finalCols = 4;
    }
  } else {
    // Validar se a combinação fornecida é válida para o challenge
    const availableConfigs = challengeConfigs[challenge];
    const isValidCombo = availableConfigs?.some(config =>
      config.rows === parseInt(rows) && config.cols === parseInt(cols)
    );

    if (!isValidCombo) {
      errors.push(`Combinação ${rows}x${cols} inválida para challenge ${challenge}`);
    } else {
      finalRows = parseInt(rows);
      finalCols = parseInt(cols);
    }
  }

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
    challenge
  };
}