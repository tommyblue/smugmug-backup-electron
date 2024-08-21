import { ArrowDownOnSquareStackIcon } from "@heroicons/react/24/solid"
import { Progress, Snippet, Spinner } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import Button from "../../components/nextui/Button"
import useConfig from "../../hooks/config"
import { BackupResponse } from "../../smugmug/backup"

type DownloadInfo = {
	total: number
	progress: number
	percentage: number
}

export default function BackupPage() {
	const { t } = useTranslation()
	const { config } = useConfig()
	const [isDownloading, setIsDownloading] = useState(false)
	const [backupResult, setBackupResult] = useState<BackupResponse | null>(null)
	const [messages, setMessages] = useState<string[]>([])
	const [progress, setProgress] = useState<DownloadInfo>({ total: 0, progress: 0, percentage: 0 })
	useEffect(() => {
		window.comms.logMessage((msg: string) => {
			console.log("logMessage:", msg)
			setMessages(prev => [...prev, msg])
		})
		window.comms.downloadProgress((total: number, progress: number) => {
			console.log("downloadProgress:", total, progress, Math.floor((progress * 100) / total))
			setProgress({ total, progress, percentage: Math.floor((progress * 100) / total) })
		})
	}, [])

	function handleBackup() {
		if (isDownloading) {
			toast.error(t("Backup already running"))
			return
		}

		setIsDownloading(true)
		setMessages([])
		setBackupResult(null)

		window.api
			.makeBackup(config)
			.then((res: BackupResponse) => {
				console.log("account:analyze response:", res)
				if (res) {
					if (res.IsValid && res.Content) {
						setBackupResult(res)
						toast.success(t("Backup done"))
					} else {
						toast.error(t("Backup failed"))
					}
				} else {
					toast.error(t("Backup failed"))
				}
			})
			.finally(() => {
				setIsDownloading(false)
			})
	}

	return (
		<div className="flex flex-col items-center justify-center">
			<div className="text-4xl font-bold">Backup</div>
			<div className="text-lg">
				<Button
					onClick={handleBackup}
					color="primary"
					endContent={<ArrowDownOnSquareStackIcon className="size-6 text-white-400" />}
				>
					{t("Download")}
				</Button>
			</div>
			{isDownloading && (
				<div className="text-lg">
					<Spinner label={t("Backup is running...")} />
					<Progress
						label={t(`${progress.progress} over ${progress.total}`)}
						isStriped
						color="secondary"
						aria-label="Loading..."
						value={progress.percentage}
						className="max-w-md"
					/>
				</div>
			)}
			{backupResult && <div className="text-lg">{backupResult.IsValid ? t("Backup done") : t("Backup failed")}</div>}
			<Snippet hideSymbol hideCopyButton size="sm">
				{messages.map((msg, i) => (
					<span key={i}>{msg}</span>
				))}
			</Snippet>
		</div>
	)
}
