import { getWords, generateCrosswordBySize } from "./_steps";

export default async function handler(req, res) {

    try {

        const MIN_SIZE = 7;
        const MAX_SIZE = 12;
        const AMOUNT = 30;

        const query = req.query || {};

        //TODO: Define criteria that maximize successful crossword generation
        const words = await getWords(query, AMOUNT);

        const result = generateCrosswordBySize(
            words,
            MIN_SIZE,
            MAX_SIZE
        );

        if (!result) {
            return res.status(422).json({
                success: false,
                error: "Could not generate crossword"
            });
        }

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error("Error generating crossword:", error);

        return res.status(500).json({
            error: "Failed to generate crossword"
        });
    }
}

//TODO: Mudar o comportamento da Ancora para ser dinamico
//TODO: Tentar mudar a palavra Ancora, escolher uma com a mesma quantidade de letras
//TODO: Não aumentar a quantidade de palavras a medida que a cruzadinha aumenta, mas sim aumentar a quantidade de palavras que podem ser escolhidas para a cruzadinha
//TODO: Melhorar o criterio de escolha das palavras, para que a cruzadinha seja mais fácil gerada, talvez uma agregation + query