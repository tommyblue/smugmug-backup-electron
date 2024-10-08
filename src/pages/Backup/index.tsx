import { ArrowDownOnSquareStackIcon, StopCircleIcon } from "@heroicons/react/24/solid"
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
			setMessages(prev => [...prev, msg])
		})
		window.comms.downloadProgress((total: number, p: number) => {
			setProgress(_ => ({ total: total, progress: p, percentage: Math.floor((p * 100) / total) }))
		})
	}, [])

	useEffect(() => {
		console.log("downloadProgress:", progress)
	}, [progress])

	function cleanup() {
		setIsDownloading(false)
		setBackupResult(null)
		setMessages([])
		setProgress({ total: 0, progress: 0, percentage: 0 })
	}

	function handleBackup() {
		if (isDownloading) {
			toast.error(t("Backup already running"))
			return
		}

		cleanup()
		setIsDownloading(true)

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

	function stopBackup() {
		window.api.stopBackup()
		cleanup()
	}

	return (
		<div className="flex flex-col items-center justify-center">
			<div className="text-4xl font-bold">Backup</div>
			<div className="text-lg">
				{isDownloading ? (
					<Button color="danger" onClick={stopBackup} endContent={<StopCircleIcon className="size-6 text-white-400" />}>
						{t("Stop!")}
					</Button>
				) : (
					<Button
						onClick={handleBackup}
						color="primary"
						endContent={<ArrowDownOnSquareStackIcon className="size-6 text-white-400" />}
					>
						{t("Download")}
					</Button>
				)}
			</div>
			{isDownloading && (
				<div className="text-lg">
					<Spinner label={t("Backup is running...")} />
					<Progress
						label={t(`${progress.progress} out of ${progress.total}`)}
						color="secondary"
						aria-label="Loading..."
						value={progress.percentage}
						className="max-w-md"
					/>
				</div>
			)}
			{backupResult && (
				<div className="text-lg">
					{backupResult.IsValid ? backupResult.Content : t("Backup failed: ") + backupResult.Content}
				</div>
			)}
			<Snippet hideSymbol hideCopyButton size="sm">
				{messages.map((msg, i) => (
					<span key={i}>{msg}</span>
				))}
			</Snippet>
		</div>
	)
}
