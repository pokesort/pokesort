import crypto from "crypto";

const SECRET = process.env.PROGRESS_SECRET_KEY;

export default function handler(req,res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!SECRET) {
        console.error("PROGRESS_SECRET_KEY não configurado.");
        return res.status(500).json({ error: "Configuração do servidor inválida.", });
    }

    try {
        const { version, data, signature } = req.body;

        if (
            typeof version !== "number" ||
            !data ||
            typeof data !== "object" ||
            typeof signature !== "string"
        ) {
            return res.status(400).json({error: "Dados inválidos.",});
        }

        const payload = JSON.stringify({
            version,
            data,
        });

        const expectedSignature = crypto
            .createHmac("sha256", SECRET)
            .update(payload)
            .digest("hex");

        const receivedBuffer = Buffer.from(signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");

        if (
            receivedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
        ) {
            console.log("Assinatura inválida. Esperado:", expectedSignature, "Recebido:", signature);
            return res.status(401).json({
                error: "Assinatura inválida.",
            });
        }

        return res.status(200).json({
            valid: true,
        });
    } catch {
        return res.status(400).json({
            error: "Dados inválidos.",
        });
    }
}