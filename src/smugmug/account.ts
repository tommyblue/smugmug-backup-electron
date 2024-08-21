import { renderString } from "nunjucks"
import path from "path"
import {
	AlbumImageType,
	AlbumsImagesResponse,
	AlbumsResponse,
	AlbumType,
	CurrentUserResponse,
	makeApiCall,
	UserResponse,
} from "./api"
import { Config } from "./config"

export type AccountAnalysisResponse = {
	IsValid: boolean
	Content?: {
		Albums: number
		Images: number
	}
}

type AlbumsInfo = {
	Folder: string
	Images: AlbumImageType[]
}

export type AccountInfo = {
	IsValid: boolean
	Albums?: AlbumsInfo[]
}
export class Account {
	private _cfg: Config
	static baseUrl = "https://api.smugmug.com"

	constructor(cfg: Config) {
		this._cfg = cfg
	}

	async info(): Promise<AccountInfo> {
		const currentUser = await this.getUser()
		if (!currentUser) {
			return { IsValid: false }
		}

		let userAlbumsURI: string
		const url = Account.baseUrl + "/api/v2/user/" + currentUser
		try {
			const res = await makeApiCall<UserResponse>(url, this._cfg.auth)
			if (res.Code !== 200) {
				console.log("account:info wrong response:", res)
				return { IsValid: false }
			}
			userAlbumsURI = res.Response.User.Uris.UserAlbums.Uri
		} catch (err) {
			console.error("account:info error:", err)
			return { IsValid: false }
		}

		const rawAlbums = await this.getAlbums(userAlbumsURI)
		console.log("Found", rawAlbums.length, "albums")
		const albums: AlbumsInfo[] = []
		// const promises: Promise<void>[] = []

		// for (let i = 0; i < rawAlbums.length; i++) {
		// 	const promise = this.fetchImagesInfo(rawAlbums[i]).then(album => {
		// 		albums.push(album)
		// 	})
		// 	promises.push(promise)

		// 	if (promises.length === this._cfg.store.concurrent_albums) {
		// 		await Promise.race(promises)
		// 		promises.splice(
		// 			promises.findIndex(p => p === promise),
		// 			1
		// 		)
		// 	}
		// }
		// await Promise.all(promises)
		let total = rawAlbums.length
		for (const album of rawAlbums) {
			this.fetchImagesInfo(album)
				.then(albumInfo => albums.push(albumInfo))
				.finally(() => {
					total--
					if (process.env.NODE_ENV === "debug") {
						console.log("Remaining albums:", total)
					}
				})
		}

		while (total > 0) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}

		return { IsValid: true, Albums: albums }
	}

	async fetchImagesInfo(album: AlbumType): Promise<AlbumsInfo> {
		const images = await this.getAlbumImages(album.Uris.AlbumImages.Uri, album.UrlPath)
		return { Folder: path.join(this._cfg.store.destination, album.UrlPath), Images: images }
	}

	async analyze(): Promise<AccountAnalysisResponse> {
		const info = await this.info()
		if (!info.IsValid) {
			return { IsValid: false }
		}

		const albums = info.Albums
		if (!albums) {
			return { IsValid: false }
		}

		// Count the number of images in all albums
		const numImages = albums.reduce((acc, album) => acc + album.Images.length, 0)

		return { IsValid: true, Content: { Albums: albums.length, Images: numImages } }
	}

	async getUser(): Promise<string> {
		let url = Account.baseUrl + "/api/v2!authuser"
		let currentUser: string
		try {
			const res = await makeApiCall<CurrentUserResponse>(url, this._cfg.auth)
			if (res.Code !== 200) {
				console.log("account:analyze wrong response:", res)
				return ""
			}
			currentUser = res.Response.User.NickName
		} catch (err) {
			console.error("account:analyze error:", err)
			return ""
		}

		return currentUser
	}

	async getAlbums(firstURI: string): Promise<AlbumType[]> {
		let uri = firstURI
		let albums: AlbumType[] = []

		while (uri) {
			const res = await makeApiCall<AlbumsResponse>(Account.baseUrl + uri, this._cfg.auth)
			if (res.Code !== 200) {
				console.log("getAlbums wrong response:", res)
				throw new Error("Invalid credentials")
			}

			albums.push(...res.Response.Album)

			if (!res.Response.Pages.NextPage) {
				break
			}
			uri = res.Response.Pages.NextPage
			if (process.env.NODE_ENV === "debug") {
				// For debugging purposes, limit the number of albums to 1
				return albums.slice(0, 1)
			}
		}

		return albums
	}

	async getAlbumImages(firstURI: string, albumPath: string): Promise<AlbumImageType[]> {
		let uri = firstURI
		let images: AlbumImageType[] = []

		while (uri) {
			const res = await makeApiCall<AlbumsImagesResponse>(Account.baseUrl + uri, this._cfg.auth)
			if (res.Code !== 200) {
				console.log("getAlbumImages wrong response:", res)
				throw new Error("Invalid credentials")
			}

			// If the album is empty, a.Response.AlbumImage is missing instead of an empty array (weird...)
			if (!res.Response.AlbumImage) {
				if (process.env.NODE_ENV === "debug") {
					console.log("album is empty: ", albumPath)
				}
				break
			}

			// Loop over response in inject the albumPath and then append to the images
			for (const img of res.Response.AlbumImage) {
				img.AlbumPath = albumPath

				const fname = Account.buildFilename(img, this._cfg.store.file_names)
				if (!fname) {
					console.log("cannot build image filename")
				}
				img.builtFilename = fname
				images.push(img)
			}
			if (!res.Response.Pages.NextPage) {
				break
			}
			uri = res.Response.Pages.NextPage
		}

		return images
	}

	async testCredentials(): Promise<boolean> {
		return this.getUser().then(user => !!user)
	}

	static buildFilename(img: AlbumImageType, templateString: string): string {
		const replacementVars = {
			FileName: img.FileName,
			ImageKey: img.ImageKey,
			ArchivedMD5: img.ArchivedMD5,
			UploadKey: img.UploadKey,
		}

		return renderString(templateString, replacementVars)
	}
}
