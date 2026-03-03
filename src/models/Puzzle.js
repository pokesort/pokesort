import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
    {
        query: {
            type: String,
            required: true,
        },
        pokemons: {
            type: [Number],
            required: true,
        },
        tips: {
            type: [String],
            required: true,
        },
    },
    { _id: false }
);

const puzzleSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
        required: true,
    },
    from: {
        type: String,
        enum: ['admin', 'system', 'user'],
        required: true,
    },
    date: {
        type: String,
        validate: {
            validator: function (v) {
                return (
                    v === null ||
                    /^\d{4}-\d{2}-\d{2}$/.test(v)
                );
            },
            message: 'O formato da data deve ser YYYY-MM-DD',
        },
        default: null,
    },
    challenge: {
        type: Number,
        required: true,
    },
    rows: {
        type: Number,
        min: 4,
        max: 5,
        required: true,
    },
    cols: {
        type: Number,
        min: 4,
        max: 6,
        required: true,
    },
    opening: {
        pt: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    groups: {
        type: [groupSchema],
        validate: {
            validator: function (groups) {
                if (groups.length !== this.rows) return false;

                return groups.every(group => group.pokemons.length === this.cols);
            },
            message: 'Os grupos devem respeitar o número de linhas e colunas escolhido',
        },
    },
});

export const getPuzzleModel = (conn) => {
    return conn.models.Puzzle || conn.model('Puzzle', puzzleSchema);
};

puzzleSchema.methods.toString = function () {
    return `
Puzzle:
  Autor: ${this.author}
  Data de criação: ${this.created_at?.toISOString()}
  Origem: ${this.from}
  Data: ${this.date ?? 'null'}
  Dificuldade: ${this.challenge}
  Tamanho: ${this.rows}x${this.cols}
  Grupos:
${this.groups
    .map(
        (g, i) => `    Grupo ${i + 1}:
      Query: ${g.query}
      Pokémons: [${g.pokemons.join(', ')}]
      Dicas: [${g.tips.join(', ')}]`
    )
    .join('\n')}
    `.trim();
};