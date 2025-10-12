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
                    v === '' ||
                    /^\d{4}-\d{2}-\d{2}$/.test(v)
                );
            },
            message: 'Date must be in format YYYY-MM-DD or null.',
        },
        default: null,
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
    groups: {
        type: [groupSchema],
        validate: {
            validator: function (groups) {
                if (groups.length !== this.rows) return false;

                return groups.every(group => group.pokemons.length === this.cols);
            },
            message: 'Groups length must match "rows" and each "pokemons" array must match "cols".',
        },
    },
});

export const getPuzzleModel = (conn) => {
    return conn.models.Puzzle || conn.model('Puzzle', puzzleSchema);
};