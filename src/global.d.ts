export {}

declare global {
	interface Window {
		api: {
			openBrowser: (url: string) => void
			openFile: () => Promise<string[]>
			testCredentials: (cfg: Config) => Promise<boolean>
			analyzeAccount: (cfg: Config) => Promise<AccountAnalysisResponse>
			stopAccountAnalysis: () => Promise<void>
			makeBackup: (cfg: Config) => Promise<BackupResponse>
			stopBackup: () => Promise<void>
			analyzeStore: (cfg: Store) => Promise<StoreAnalysisResponse>
		}
		comms: {
			logMessage: (callback: (string) => void) => void
			downloadProgress: (callback: (total: number, progress: number) => void) => void
		}
	}
}
