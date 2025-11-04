export interface ElectronAPI {
    importTextFile: () => Promise<{ content: string; fileName: string } | null>;
    loadDocuments: () => Promise<any>;
    saveDocuments: (documents: any) => Promise<boolean>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}