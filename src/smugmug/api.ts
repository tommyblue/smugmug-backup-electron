import fetch from "node-fetch"
import Oauth from "../lib/oauth"
import { Auth } from "./config"

export type CurrentUserResponse = {
	User: {
		NickName: string
	}
}

export type AlbumImageType = {
	FileName: string
	ImageKey: string // Use as unique ID if FileName is empty
	ArchivedMD5: string
	ArchivedSize: number
	ArchivedUri: string
	IsVideo: boolean
	Processing: boolean
	UploadKey: string
	DateTimeOriginal: string
	Caption: string
	DateTimeUploaded: string
	Keywords: string
	Latitude: string
	Longitude: string
	Uris: {
		ImageMetadata: {
			Uri: string
		}
		LargestVideo: {
			Uri: string
		}
	}

	AlbumPath: string // not in API response, but used to store the path of the album
	builtFilename: string // The final filename, after template replacements
}

export function AlbumImageName(image: AlbumImageType): string {
	if (image.builtFilename != "") {
		return image.builtFilename
	}

	if (image.FileName != "") {
		return image.FileName
	}

	return image.ImageKey
}

export type AlbumType = {
	UrlPath: string
	Uris: {
		AlbumImages: {
			Uri: string
		}
	}
}

export type UserResponse = {
	User: {
		Uris: {
			UserAlbums: {
				Uri: string
			}
		}
	}
}

export type AlbumsImagesResponse = {
	Uri: string
	AlbumImage: AlbumImageType[]
	Pages: {
		NextPage: string
	}
}

export type AlbumsResponse = {
	Uri: string
	Album: AlbumType[]
	Pages: {
		NextPage: string
	}
}

export type AlbumVideoResponse = {
	LargestVideo: {
		Size: number
		Url: string
	}
}

export type ImageMetadataResponse = {
	DateTimeCreated: string
	DateTimeModified: string
}

type ApiResponseTypes =
	| CurrentUserResponse
	| UserResponse
	| AlbumsResponse
	| AlbumsImagesResponse
	| ImageMetadataResponse
	| AlbumVideoResponse

type ApiResponse<T extends ApiResponseTypes> = {
	Code: number
	Message: string
	Response: T
}

function isValidUrl(url: string) {
	try {
		new URL(url)
		return true
	} catch (err) {
		return false
	}
}

export async function makeApiCall<T extends ApiResponseTypes>(url: string, cfg: Auth): Promise<ApiResponse<T>> {
	if (process.env.NODE_ENV === "debug") {
		console.log("Making API call to:", url)
	}
	if (!isValidUrl(url)) {
		throw new Error("Invalid URL: " + url)
	}
	const res = makeRawApiCall(url, cfg)
		.then(res => res.json() as Promise<ApiResponse<T>>)
		.then(json => json)
		.catch(err => {
			console.error("Error fetching", url, ":", err)
			return {
				Code: 500,
				Message: "Error fetching " + url,
				Response: {} as T,
			}
		})

	return res
}

let concurrentRequests = 0
const maxConcurrentRequests = 10

export async function makeRawApiCall(url: string, cfg: Auth): Promise<fetch.Response> {
	if (!isValidUrl(url)) {
		throw new Error("Invalid URL: " + url)
	}
	const oauth = new Oauth(cfg.api_key, cfg.api_secret, cfg.user_token, cfg.user_secret)
	const h = oauth.authorizationHeader(url)

	while (concurrentRequests >= maxConcurrentRequests) {
		if (process.env.NODE_ENV === "debug") {
			console.log("Too many concurrent requests, waiting")
		}
		await new Promise(resolve => setTimeout(resolve, 500))
	}

	const maxRetries = 3
	for (let i = 1; i <= maxRetries; i++) {
		concurrentRequests++
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				Authorization: h,
			},
		}).finally(() => {
			concurrentRequests--
		})

		if (res.status < 400) {
			return res
		}

		if (i === maxRetries) {
			console.error("Error fetching", url, ", max retries reached")

			return fetch.Response.error()
		}

		if (res.status === 429) {
			console.log("Rate limited, waiting 10s")
			i--
			return new Promise(resolve => setTimeout(resolve, 10000))
		}
	}

	return fetch.Response.error()
}
