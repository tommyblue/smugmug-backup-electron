import fs from "fs"
import path from "path"

export type LocalFile = {
	name: string
	size: number
	folder: boolean
}

export function* walkSync(dir: string): Generator<LocalFile> {
	const files = fs.readdirSync(dir, { withFileTypes: true })
	for (const file of files) {
		if (file.isDirectory()) {
			yield* walkSync(path.join(dir, file.name))
			yield { name: path.join(dir, file.name), size: 0, folder: true }
		} else {
			const filePath = path.join(dir, file.name)
			const stats = fs.statSync(filePath)
			yield { name: filePath, size: stats.size, folder: false }
		}
	}
}
