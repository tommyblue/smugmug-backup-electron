import fs from "fs"
import path from "path"
import { Account } from "./account"
import { AlbumImageName, AlbumImageType, ImageMetadataResponse, makeApiCall, makeRawApiCall } from "./api"
import { Config } from "./config"

export type BackupResponse = {
	IsValid: boolean
	Content?: string
}

export class Backup {
	private _cfg: Config

	constructor(cfg: Config) {
		this._cfg = cfg
	}

	async Run(): Promise<BackupResponse> {
		const account = new Account(this._cfg)

		const info = await account.info()

		if (!info.IsValid) {
			return { IsValid: false }
		}

		for (const album of info.Albums!) {
			// check if the folder exists or create it
			if (!fs.existsSync(album.Folder)) {
				fs.mkdirSync(album.Folder, { recursive: true })
			}

			// download each image
			for (const image of album.Images) {
				const imageName = AlbumImageName(image)
				if (imageName === "") {
					continue
				}

				const dest = path.join(album.Folder, imageName)
				const ok = await this.download(dest, image.ArchivedUri, image.ArchivedSize, image.IsVideo)
				if (this._cfg.store.use_metadata_times && (ok || this._cfg.store.force_metadata_times)) {
					await this.setChTime(image, dest)
				}
			}
		}

		return { IsValid: true, Content: "Backup content" }
	}

	private async download(dest: string, uri: string, size: number, isVideo: boolean = false): Promise<boolean> {
		if (isVideo) {
			return this.downloadVideo(dest, uri, size)
		}

		return this.downloadImage(dest, uri, size)
	}

	private async downloadImage(dest: string, uri: string, size: number): Promise<boolean> {
		if (this.checkFileWithSameSize(dest, size)) {
			console.log("File already exists with the same size:", dest)
			return true
		}

		console.log("Downloading image:", uri)

		const response = await makeRawApiCall(uri, this._cfg.auth)
		if (!response.ok || !response.body) {
			console.error("Error downloading image:", response)
			return false
		}

		const buffer = await response.buffer()
		try {
			fs.writeFile(dest, buffer, () => console.log("finished downloading!"))
		} catch (err) {
			console.error("Error writing file:", err)
			return false
		}

		return true
	}

	private async downloadVideo(dest: string, uri: string, size: number): Promise<boolean> {
		throw new Error("Not implemented")
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
