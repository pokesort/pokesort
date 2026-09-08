// Exporta e importa os dados de localstorage do Pokesort
import { InvalidTransferDataError } from "../scripts/erros";

const transferableKeyPattern = /^(u_|s_)/;
const transferFileExtension = ".pokesortdata";

type TransferData = Record<string, string>;
type TransferFile = {
    version: 1;
    data: TransferData;
    signature: string;
};

function isTransferData(value: unknown): value is TransferData {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return Object.entries(value).every(([key, entry]) =>
        transferableKeyPattern.test(key) && typeof entry === "string"
    );
}

function isTransferFile(value: unknown): value is TransferFile {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const file = value as Partial<TransferFile>;
    return file.version === 1 && isTransferData(file.data) && typeof file.signature === "string";
}

export async function exportData() {
    const data: TransferData = {};

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);

        if (!key || !transferableKeyPattern.test(key))  continue;

        const value = localStorage.getItem(key);

        if (value !== null)  data[key] = value;
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transfer/sign`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: 1,
                data,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Não foi possível assinar os dados.");
    }

    const transferFile: TransferFile = await response.json();

    const blob = new Blob(
        [JSON.stringify(transferFile, null, 2)],
        {
            type: "application/x-pokesortdata",
        }
    );

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `backup${transferFileExtension}`;

    link.click();

    URL.revokeObjectURL(downloadUrl);
    link.remove();
}

export async function importData(file: File) {

    if (!file.name.toLowerCase().endsWith(transferFileExtension)) {
        throw new InvalidTransferDataError("Invalid Pokesort data file extension");
    }

    const transferFile: unknown = JSON.parse(await file.text());

    if (!isTransferFile(transferFile)) {
        throw new InvalidTransferDataError("Invalid Pokesort data file");
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/transfer/verify`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: transferFile.version,
                data: transferFile.data,
                signature: transferFile.signature,
            }),
        }
    );

    if (!response.ok) {
        console.log("Invalid or modified Pokesort data file");
        throw new InvalidTransferDataError("Invalid or modified Pokesort data file");
    }

    const result: unknown = await response.json();

    if (
        !result ||
        typeof result !== "object" ||
        !("valid" in result) ||
        result.valid !== true
    ) {
        throw new InvalidTransferDataError("Invalid or modified Pokesort data file");
    }

    return transferFile.data;

    // Object.entries(transferFile.data).forEach(([key, value]) => {
    //     localStorage.setItem(key, value);
    // });
}

export function replaceTransferData(data: TransferData) {

    //Remove as chaves atuais presentes para não mesclar o progresso
    const keysToRemove: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);

        if (key && transferableKeyPattern.test(key)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) =>  localStorage.removeItem(key));

    Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
}