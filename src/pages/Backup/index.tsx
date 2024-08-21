import { ArrowDownOnSquareStackIcon } from "@heroicons/react/24/solid"
import { Progress, Spinner } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import Button from "../../components/nextui/Button"
import useConfig from "../../hooks/config"
import { BackupResponse } from "../../smugmug/backup"

export default function BackupPage() {
	const { t } = useTranslation()
	const { config } = useConfig()
	const [isDownloading, setIsDownloading] = useState(false)
	const [backupResult, setBackupResult] = useState<BackupResponse | null>(null)
	const [messages, setMessages] = useState<string[]>([])
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		window.comms.logMessage((msg: string) => {
			console.log("logMessage:", msg)
			setMessages(prev => [...prev, msg])
		})
		window.comms.downloadProgress((total: number, progress: number) => {
			console.log("downloadProgress:", total, progress, Math.floor((progress * 100) / total))
			setProgress(Math.floor((progress * 100) / total))
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
					<Progress aria-label="Loading..." value={progress} className="max-w-md" />
				</div>
			)}
			{backupResult && <div className="text-lg">{backupResult.IsValid ? t("Backup done") : t("Backup failed")}</div>}
			<pre className="text-lg">
				{messages.map((msg, i) => (
					<div key={i}>{msg}</div>
				))}
			</pre>
		</div>
	)
}
