export type ProfileData = {
    name: string,
    partner: string
}

export type TransferData = Record<string, string>;
export type TransferFile = {
    version: 1;
    data: TransferData;
    signature: string;
};