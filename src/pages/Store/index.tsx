import { Button as ModalButton, Spinner } from "@nextui-org/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import Button from "../../components/nextui/Button"
import Modal from "../../components/nextui/Modal"
import useConfig from "../../hooks/config"
import { StoreAnalysisResponse } from "../../smugmug/store"

export default function AnalysisPage(): JSX.Element {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<StoreAnalysisResponse | null>(null)
	const { config } = useConfig()

	const onClose = () => {
		setIsOpen(false)
	}

	function handleAnalyze() {
		setIsAnalyzing(true)
		setAnalysisResult(null)
		window.api
			.analyzeStore(config.store)
			.then((res: StoreAnalysisResponse) => {
				if (res) {
					if (res.IsValid && res.Content) {
						setAnalysisResult(res)
						toast.success(t("Credentials are valid"))
					} else {
						let msg = t("Credentials are not valid")
						if (res.Reason) {
							msg = t(res.Reason)
						}
						toast.error(msg)
					}
				} else {
					toast.error(t("Credentials are not valid"))
				}
			})
			.finally(() => {
				setIsAnalyzing(false)
			})
	}

	return (
		<>
			<Button
				onClick={() => {
					setIsOpen(true)
				}}
			>
				{t("Analyze local store")}
			</Button>
			{isOpen && (
				<Modal
					title={t("Store analysis")}
					isOpen={isOpen}
					footer={
						<>
							<ModalButton color="danger" variant="light" onPress={onClose}>
								{t("Close")}
							</ModalButton>
							<ModalButton color="primary" onPress={handleAnalyze} isLoading={isAnalyzing}>
								{isAnalyzing ? t("Analyzing") : t("Analyze")}
							</ModalButton>
						</>
					}
					style={{
						placement: "top-center",
						backdrop: "blur",
						size: "4xl",
					}}
				>
					{isAnalyzing ? (
						<Spinner label={t("Analyzing...")} />
					) : (
						<>
							{analysisResult ? (
								<div className="text-default-500">
									<ul>
										<li>
											{t("Folders")}: {analysisResult.Content!.Folders}
										</li>
										<li>
											{t("Images")}: {analysisResult.Content!.Images}
										</li>
										<li>
											{t("Videos")}: {analysisResult.Content!.Videos}
										</li>
										<li>
											{t("Size")}: {(analysisResult.Content!.Size / 1024 / 1024).toFixed(2)} MB
										</li>
									</ul>
								</div>
							) : (
								<div className="text-default-500">
									{t("The operation analyzes the local store for folders (albums) and images. It may take a while.")}
								</div>
							)}
						</>
					)}
				</Modal>
			)}
		</>
	)
}
