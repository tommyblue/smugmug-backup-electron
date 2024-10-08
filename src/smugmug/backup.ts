import fs from "fs"
import path from "path"
import { Account } from "./account"
import {
	AlbumImageName,
	AlbumImageType,
	AlbumVideoResponse,
	ImageMetadataResponse,
	makeApiCall,
	makeRawApiCall,
} from "./api"
import { Config } from "./config"

export type BackupResponse = {
	IsValid: boolean
	Content?: string
}

type LogFn = (msg: string) => void
type ProgressFn = (total: number, progress: number) => void
export class Backup {
	private _cfg: Config
	private logger: LogFn
	private progressFn: ProgressFn
	private totalImages: number = 0
	private downloadedImages: number = 0
	private mustStop: boolean = false

	constructor(cfg: Config, logFn: LogFn, progressFn: ProgressFn) {
		this._cfg = cfg
		this.logger = logFn
		this.progressFn = progressFn
	}

	async Run(): Promise<BackupResponse> {
		const account = new Account(this._cfg)

		this.logger("Analyzing account...")
		const info = await account.info()

		if (!info.IsValid) {
			return { IsValid: false }
		}

		for (const album of info.Albums!) {
			this.totalImages += album.Images.length
		}
		this.logger("Found " + info.Albums!.length + " albums and " + this.totalImages + " photos")
		this.progressFn(this.totalImages, this.downloadedImages)

		for (const album of info.Albums!) {
			if (this.mustStop) {
				console.log("Backup stopped")
				return { IsValid: true, Content: "Backup stopped" }
			}

			// check if the folder exists or create it
			if (!fs.existsSync(album.Folder)) {
				fs.mkdirSync(album.Folder, { recursive: true })
			}

			// const promises: Promise<void>[] = []
			// for (let i = 0; i < album.Images.length; i++) {
			// 	const promise = this.download(album.Images[i], album.Folder)
			// 	promises.push(promise)

			// 	if (promises.length === this._cfg.store.concurrent_downloads) {
			// 		await Promise.race(promises)
			// 		promises.splice(
			// 			promises.findIndex(p => p === promise),
			// 			1
			// 		)
			// 	}
			// }
			// await Promise.all(promises)
			let total = album.Images.length
			for (const image of album.Images) {
				if (this.mustStop) {
					console.log("Backup stopped")
					return { IsValid: true, Content: "Backup stopped" }
				}
				this.download(image, album.Folder).finally(() => {
					total--
					if (process.env.NODE_ENV === "debug") {
						console.log("Remaining downloads:", total)
					}
				})
			}
			while (total > 0) {
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}

		return { IsValid: true, Content: "Backup content" }
	}

	stop() {
		this.mustStop = true
	}

	private async download(image: AlbumImageType, folder: string) {
		const imageName = AlbumImageName(image)
		if (imageName === "") {
			return
		}

		const dest = path.join(folder, imageName)
		this.logger(dest)

		let ok = false
		if (image.IsVideo) {
			// Skip videos if under processing
			if (image.Processing && !this._cfg.store.force_video_download) {
				console.log("skipping video", image.FileName, "because under processing")
				return
			}

			ok = await this.downloadVideo(dest, image.Uris.LargestVideo.Uri, image.ArchivedSize)
		} else {
			ok = await this.downloadImage(dest, image.ArchivedUri, image.ArchivedSize)
		}

		if (!ok) {
			// TODO: notify user
			console.error("Error downloading image:", image)
			return
		}

		this.downloadedImages++
		this.progressFn(this.totalImages, this.downloadedImages)

		if (this._cfg.store.use_metadata_times) {
			await this.setChTime(image, dest)
		}
	}

	private async downloadImage(dest: string, uri: string, size: number): Promise<boolean> {
		if (this.checkFileWithSameSize(dest, size)) {
			if (process.env.NODE_ENV === "debug") {
				console.log("File already exists with the same size:", dest)
			}
			return true
		}

		const response = await makeRawApiCall(uri, this._cfg.auth)
		if (!response.ok || !response.body) {
			console.error("Error downloading image:", response)
			return false
		}

		const buffer = await response.buffer()
		try {
			fs.writeFileSync(dest, buffer)
		} catch (err) {
			console.error("Error writing file:", err)
			return false
		}

		return true
	}

	private async downloadVideo(dest: string, uri: string, _: number): Promise<boolean> {
		const video = await makeApiCall<AlbumVideoResponse>(Account.baseUrl + uri, this._cfg.auth)
		if (process.env.NODE_ENV === "debug") {
			console.log("Downloading video:", uri, "to", dest, "size:", video.Response.LargestVideo.Size)
		}

		if (this.checkFileWithSameSize(dest, video.Response.LargestVideo.Size)) {
			if (process.env.NODE_ENV === "debug") {
				console.log("File already exists with the same size:", dest)
			}
			return true
		}
		const response = await makeRawApiCall(video.Response.LargestVideo.Url, this._cfg.auth)
		if (!response.ok || !response.body) {
			console.error("Error downloading image:", response)
			return false
		}

		const buffer = await response.buffer()
		try {
			fs.writeFileSync(dest, buffer)
		} catch (err) {
			console.error("Error writing file:", err)
			return false
		}

		return true
	}

	// Check if the destination file already exists and has the same size
	private checkFileWithSameSize(dest: string, size: number): boolean {
		if (fs.existsSync(dest)) {
			const stats = fs.statSync(dest)
			if (stats.size === size) {
				return true
			}
		}

		return false
	}

	private async setChTime(image: AlbumImageType, dest: string) {
		// Try first with the date in the image, to avoid making an additional call
		let dt = image.DateTimeOriginal
		if (!dt) {
			dt = image.DateTimeUploaded
		}

		let created
		try {
			created = new Date(dt)
			if (isNaN(created.getTime())) {
				created = null
			}
		} catch (err) {
			created = null
		}

		if (!created || created.getTime() === 0) {
			created = await this.imageTimestamp(image)
		}

		if (created && created.getTime() !== 0) {
			const now = new Date()
			if (!fs.existsSync(dest)) {
				console.error("File does not exist:", dest)
				return null
			}
			fs.utimes(dest, now, created, err => {
				if (err) {
					console.error("Error setting file times:", err)
				}
			})
		}

		return null
	}

	private async imageTimestamp(image: AlbumImageType): Promise<Date | null> {
		const res = await makeApiCall<ImageMetadataResponse>(image.Uris.ImageMetadata.Uri, this._cfg.auth)
		if (res.Code !== 200) {
			return null
		}

		return new Date(res.Response.DateTimeCreated)
	}
}
