export {}

declare global {
	interface Window {
		api: {
			openBrowser: (url: string) => void
		}
	}
}
