export type Auth = {
	api_key: string
	api_secret: string
	user_token: string
	user_secret: string
}

type Store = {
	destination: string
	file_names: string
	use_metadata_times: boolean
	force_metadata_times: boolean
	write_csv: boolean
	force_video_download: boolean
	concurrent_albums: number
	concurrent_downloads: number
}

export type Config = {
	auth: Auth
	store: Store
}

export const defaultConfig: Config = {
	auth: {
		api_key: "",
		api_secret: "",
		user_token: "",
		user_secret: "",
	},
	store: {
		destination: "",
		file_names: "{{.FileName}}",
		use_metadata_times: false,
		force_metadata_times: false,
		write_csv: false,
		force_video_download: false,
		concurrent_albums: 1,
		concurrent_downloads: 1,
	},
}
