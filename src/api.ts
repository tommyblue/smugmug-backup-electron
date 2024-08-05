import { Auth } from "./config"
import Oauth from "./oauth"

export type CurrentUserResponse = {
	User: {
		NickName: string
	}
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

export type AlbumsResponse = {
	Uri: string
	Album: AlbumType[]
	Pages: {
		NextPage: string
	}
}

type ApiResponse<T extends CurrentUserResponse | UserResponse | AlbumsResponse> = {
	Code: number
	Message: string
	Response: T
}

export async function makeApiCall<T extends CurrentUserResponse | UserResponse | AlbumsResponse>(
	url: string,
	cfg: Auth
): Promise<ApiResponse<T>> {
	const oauth = new Oauth(cfg.api_key, cfg.api_secret, cfg.user_token, cfg.user_secret)
	const h = oauth.authorizationHeader(url)

	const res = await fetch(url, {
		headers: {
			Accept: "application/json",
			Authorization: h,
		},
	})
		.then(res => res.json() as Promise<ApiResponse<T>>)
		.then(json => {
			console.log(json)
			return json
		})

	return res
}
