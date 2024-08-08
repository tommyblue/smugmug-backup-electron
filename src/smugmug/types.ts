export type AccountAnalysisResponse = {
	IsValid: boolean
	Content?: {
		Albums: number
		Images: number
	}
}

export type StoreAnalysisResponse = {
	IsValid: boolean
	Content?: {
		Folders: number
		Images: number
	}
}
