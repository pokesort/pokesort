// Exporta e importa os dados de localstorage do Pokesort

const transferableKeyPattern = /^(u_|s_)/;
const transferFileExtension = ".pokesortdata";

type TransferData = Record<string, string>;
type TransferFile = {
    version: 1;
    data: TransferData;
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
    return file.version === 1 && isTransferData(file.data);
}

export function exportData () {
    const data: TransferData = {};

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !transferableKeyPattern.test(key)) {
            continue;
        }

        const value = localStorage.getItem(key);
        if (value !== null) {
            data[key] = value;
        }
    }

    const transferFile: TransferFile = {
        version: 1,
        data
    };
    const blob = new Blob([JSON.stringify(transferFile, null, 2)], { type: "application/x-pokesortdata" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `backup${transferFileExtension}`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    link.remove();
}

export async function importData (file: File) {
    if (!file.name.toLowerCase().endsWith(transferFileExtension)) {
        throw new Error("Invalid Pokesort data file extension");
    }

    const transferFile: unknown = JSON.parse(await file.text());

    if (!isTransferFile(transferFile)) {
        throw new Error("Invalid Pokesort data file");
    }

    Object.entries(transferFile.data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });
}