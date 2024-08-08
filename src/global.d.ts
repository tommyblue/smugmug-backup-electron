export {}

declare global {
	interface Window {
		api: {
			openBrowser: (url: string) => void
			openFile: () => Promise<string[]>
			testCredentials: (cfg: Auth) => Promise<boolean>
			analyzeAccount: (cfg: Config) => Promise<AccountAnalysisResponse>
			analyzeStore: (cfg: Store) => Promise<StoreAnalysisResponse>
		}
	}
}
