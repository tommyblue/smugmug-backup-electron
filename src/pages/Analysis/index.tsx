import { Button as ModalButton } from "@nextui-org/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import Button from "../../components/nextui/Button"
import Modal from "../../components/nextui/Modal"
import useConfig from "../../hooks/config"

export default function AnalysisPage(): JSX.Element {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const { config, setConfig } = useConfig()

	const onClose = () => {
		setIsOpen(false)
	}

	function handleAnalyze() {
		setIsAnalyzing(true)
		window.api
			.analyzeAccount(config.auth)
			.then((res: string) => {
				if (res) {
					toast.success(t("Credentials are valid"))
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
				{t("Analyze")}
			</Button>
			{isOpen && (
				<Modal
					title={t("Account configuration")}
					isOpen={isOpen}
					footer={
						<>
							<ModalButton color="danger" variant="light" onPress={onClose}>
								Close
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
					<h3 className="text-default-500 text-small">{t("Account analysis")}</h3>
				</Modal>
			)}
		</>
	)
}
