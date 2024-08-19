export {}

declare global {
	interface Window {
		api: {
			openBrowser: (url: string) => void
			openFile: () => Promise<string[]>
			testCredentials: (cfg: Config) => Promise<boolean>
			analyzeAccount: (cfg: Config) => Promise<AccountAnalysisResponse>
			makeBackup: (cfg: Config) => Promise<BackupResponse>
			analyzeStore: (cfg: Store) => Promise<StoreAnalysisResponse>
		}
	}
}
