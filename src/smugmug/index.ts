import { renderString } from "nunjucks"
import {
	AlbumImageType,
	AlbumsImagesResponse,
	AlbumsResponse,
	AlbumType,
	CurrentUserResponse,
	makeApiCall,
	UserResponse,
} from "./api"
import { Auth, Config } from "./config"
import { AccountAnalysisResponse } from "./types"

export const BaseUrl = "https://api.smugmug.com"

export async function testCredentials(cfg: Auth): Promise<boolean> {
	return getUser(cfg).then(user => !!user)
}

export async function analyzeAccount(cfg: Config): Promise<AccountAnalysisResponse> {
	const currentUser = await getUser(cfg.auth)
	if (!currentUser) {
		return { IsValid: false }
	}

	let userAlbumsURI: string
	const url = BaseUrl + "/api/v2/user/" + currentUser
	try {
		const res = await makeApiCall<UserResponse>(url, cfg.auth)
		if (res.Code !== 200) {
			console.log("account:analyze wrong response:", res)
			return { IsValid: false }
		}
		userAlbumsURI = res.Response.User.Uris.UserAlbums.Uri
	} catch (err) {
		console.error("account:analyze error:", err)
		return { IsValid: false }
	}

	const albums = await getAlbums(cfg.auth, userAlbumsURI)

	let numImages = 0
	for (const album of albums) {
		const images = await getAlbumImages(cfg, album.Uris.AlbumImages.Uri, album.UrlPath)
		numImages += images.length
	}

	return { IsValid: true, Content: { Albums: albums.length, Images: numImages } }
}

export async function getUser(cfg: Auth): Promise<string> {
	let url = BaseUrl + "/api/v2!authuser"
	let currentUser: string
	try {
		const res = await makeApiCall<CurrentUserResponse>(url, cfg)
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

export async function getAlbums(cfg: Auth, firstURI: string): Promise<AlbumType[]> {
	let uri = firstURI
	let albums: AlbumType[] = []

	while (uri) {
		const res = await makeApiCall<AlbumsResponse>(BaseUrl + uri, cfg)
		if (res.Code !== 200) {
			console.log("getAlbums wrong response:", res)
			throw new Error("Invalid credentials")
		}

		albums.push(...res.Response.Album)
		if (!res.Response.Pages.NextPage) {
			break
		}
		uri = res.Response.Pages.NextPage
	}

	return albums
}

export async function getAlbumImages(cfg: Config, firstURI: string, albumPath: string): Promise<AlbumImageType[]> {
	let uri = firstURI
	let images: AlbumImageType[] = []

	while (uri) {
		const res = await makeApiCall<AlbumsImagesResponse>(BaseUrl + uri, cfg.auth)
		if (res.Code !== 200) {
			console.log("getAlbumImages wrong response:", res)
			throw new Error("Invalid credentials")
		}

		// If the album is empty, a.Response.AlbumImage is missing instead of an empty array (weird...)
		if (!res.Response.AlbumImage) {
			console.log("album is empty: ", albumPath)

			break
		}

		// Loop over response in inject the albumPath and then append to the images
		for (const img of res.Response.AlbumImage) {
			img.AlbumPath = albumPath

			const fname = buildFilename(img, cfg.store.file_names)
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

function buildFilename(img: AlbumImageType, templateString: string): string {
	const replacementVars = {
		FileName: img.FileName,
		ImageKey: img.ImageKey,
		ArchivedMD5: img.ArchivedMD5,
		UploadKey: img.UploadKey,
	}

	return renderString(templateString, replacementVars)
}
