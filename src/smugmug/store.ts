import fs from "fs"
import { walkSync } from "../lib/fs"
import { Store } from "./config"

export type StoreAnalysisResponse = {
	IsValid: boolean
	Reason?: string
	Content?: {
		Folders: number
		Images: number
		Videos: number
		Size: number
	}
}

export async function analyzeStore(cfg: Store): Promise<StoreAnalysisResponse> {
	console.log("analyzeStore: ", cfg.destination)
	if (!fs.existsSync(cfg.destination)) {
		return { IsValid: false, Reason: "Destination folder does not exist" }
	}

	let size = 0
	const images = []
	const videos = []
	const folders = []

	for (const file of walkSync(cfg.destination)) {
		if (file.folder) {
			folders.push(file.name)
		} else if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
			images.push(file)
			size += file.size // in bytes
		} else if (file.name.toLowerCase().match(/\.(mp4|mov|avi|mkv)$/)) {
			videos.push(file)
			size += file.size // in bytes
		}
	}

	return {
		IsValid: true,
		Content: { Size: size, Folders: folders.length, Images: images.length, Videos: videos.length },
	}
}
