import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
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
    }
});

const puzzleSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
    },
    created_at: {
        type: String,
        default: function () {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        },
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