import fs from "fs"
import path from "path"
import { Account } from "./account"
import { AlbumImageName, AlbumImageType, ImageMetadataResponse, makeApiCall, makeRawApiCall } from "./api"
import { Config } from "./config"

export type BackupResponse = {
	IsValid: boolean
	Content?: string
}

export async function makeBackup(cfg: Config): Promise<BackupResponse> {
	const account = new Account(cfg)

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
			const ok = await download(cfg, dest, image.ArchivedUri, image.ArchivedSize, image.IsVideo)
			if (cfg.store.use_metadata_times && (ok || cfg.store.force_metadata_times)) {
				await setChTime(cfg, image, dest)
			}
		}
	}

	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve({ IsValid: true, Content: "Backup content" })
		}, 2000)
	})
}

async function download(
	cfg: Config,
	dest: string,
	uri: string,
	size: number,
	isVideo: boolean = false
): Promise<boolean> {
	if (isVideo) {
		return downloadVideo(dest, uri, size)
	}

	return downloadImage(cfg, dest, uri, size)
}

async function downloadImage(cfg: Config, dest: string, uri: string, size: number): Promise<boolean> {
	if (checkFileWithSameSize(dest, size)) {
		console.log("File already exists with the same size:", dest)
		return true
	}

	console.log("Downloading image:", uri)

	const response = await makeRawApiCall(uri, cfg.auth)
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

async function downloadVideo(dest: string, uri: string, size: number): Promise<boolean> {
	throw new Error("Not implemented")
}

// Check if the destination file already exists and has the same size
function checkFileWithSameSize(dest: string, size: number): boolean {
	if (fs.existsSync(dest)) {
		const stats = fs.statSync(dest)
		if (stats.size === size) {
			return true
		}
	}

	return false
}

async function setChTime(cfg: Config, image: AlbumImageType, dest: string) {
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
		created = await imageTimestamp(cfg, image)
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

async function imageTimestamp(cfg: Config, image: AlbumImageType): Promise<Date | null> {
	const res = await makeApiCall<ImageMetadataResponse>(image.Uris.ImageMetadata.Uri, cfg.auth)
	if (res.Code !== 200) {
		return null
	}

	return new Date(res.Response.DateTimeCreated)
}
