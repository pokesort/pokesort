import crypto from "crypto";

const SECRET = process.env.PROGRESS_SECRET_KEY;

export default function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!SECRET) {
            console.error("PROGRESS_SECRET_KEY não configurado.");

            return res.status(500).json({
                error: "Configuração do servidor inválida.",
            });
        }

        const { version, data } = req.body;

        const payload = JSON.stringify({
            version,
            data,
        });

        const signature = crypto
            .createHmac("sha256", SECRET)
            .update(payload)
            .digest("hex");

        return res.status(200).json({
            version,
            data,
            signature,
        });
    } catch {
        return res.status(400).json({
            error: "Dados inválidos.",
        });
    }
}