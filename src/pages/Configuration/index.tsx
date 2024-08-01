// import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"
import { Checkbox, Input, Link, Button as ModalButton } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import Button from "../../components/nextui/Button"
import { PasswordInput } from "../../components/nextui/Input"
import Modal from "../../components/nextui/Modal"
import { Config } from "../../config"
import useConfig from "../../hooks/config"

export default function (): JSX.Element {
	const { t } = useTranslation()
	const { config, setConfig } = useConfig()
	const [isOpen, setIsOpen] = useState(false)
	const [tempConfig, setTempConfig] = useState<Config>(config)
	const [isFormValid, setIsFormValid] = useState(false)

	useEffect(() => {
		setTempConfig({ ...config })
	}, [config])

	const onClose = () => {
		setIsOpen(false)
	}

	function openTokenInstructions(e: React.MouseEvent<HTMLAnchorElement>) {
		e.preventDefault()
		window.api.openBrowser("https://github.com/tommyblue/smugmug-backup?tab=readme-ov-file#obtain-api-keys")
	}

	function handleSave() {
		setConfig(tempConfig)
		toast.success(t("Configuration saved"))
		onClose()
	}

	return (
		<>
			<Button
				text={t("Configurations")}
				onClick={() => {
					setIsOpen(true)
				}}
			/>
			{isOpen && (
				<Modal
					title={t("Account configuration")}
					isOpen={isOpen}
					footer={
						<>
							<ModalButton color="danger" variant="light" onPress={onClose}>
								Close
							</ModalButton>
							<ModalButton color="primary" onPress={handleSave} isDisabled={!isFormValid}>
								Save
							</ModalButton>
						</>
					}
					style={{
						placement: "top-center",
						backdrop: "blur",
						size: "4xl",
					}}
				>
					<h3 className="text-default-500 text-small">{t("Authentication")}</h3>
					<PasswordInput
						autoFocus
						isRequired
						label={t("API Token")}
						validation={v => v.length > 0}
						value={tempConfig.auth.api_key}
						onValueChange={v => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, api_key: v } })}
					/>

					<PasswordInput
						autoFocus
						isRequired
						label={t("API Token")}
						validation={v => v.length > 0}
						value={tempConfig.auth.api_secret}
						onValueChange={v => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, api_secret: v } })}
					/>

					<PasswordInput
						autoFocus
						isRequired
						label={t("API Token")}
						validation={v => v.length > 0}
						value={tempConfig.auth.user_token}
						onValueChange={v => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, user_token: v } })}
					/>

					<PasswordInput
						autoFocus
						isRequired
						label={t("API Token")}
						validation={v => v.length > 0}
						value={tempConfig.auth.user_secret}
						onValueChange={v => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, user_secret: v } })}
					/>

					<div className="flex py-2 px-1 justify-between">
						<Link
							style={{ cursor: "pointer" }}
							color="primary"
							size="sm"
							onClick={openTokenInstructions}
							isExternal
							showAnchorIcon
						>
							{t("How to get the keys?")}
						</Link>
					</div>

					<h3 className="text-default-500 text-small">{t("Store")}</h3>
					<Input
						isRequired
						isReadOnly
						label={t("Destination path")}
						type="text"
						variant="bordered"
						value={tempConfig.store.destination}
						onClick={v => {
							window.api.openFile().then((files: string[]) => {
								if (!files || files.length === 0) return
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, destination: files[0] } })
							})
						}}
					/>
					<Input
						isRequired
						label={t("File names")}
						type="text"
						variant="bordered"
						value={tempConfig.store.file_names}
						onValueChange={v => setTempConfig({ ...tempConfig, store: { ...tempConfig.store, file_names: v } })}
					/>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={tempConfig.store.use_metadata_times}
							onValueChange={v =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, use_metadata_times: v } })
							}
						>
							{t("Use metadata times")}
						</Checkbox>
					</div>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={tempConfig.store.force_metadata_times}
							onValueChange={v =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, force_metadata_times: v } })
							}
						>
							{t("Force metadata times")}
						</Checkbox>
					</div>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={tempConfig.store.write_csv}
							onValueChange={v => setTempConfig({ ...tempConfig, store: { ...tempConfig.store, write_csv: v } })}
						>
							{t("Write CSV")}
						</Checkbox>
					</div>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={tempConfig.store.force_video_download}
							onValueChange={v =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, force_video_download: v } })
							}
						>
							{t("Force video download")}
						</Checkbox>
					</div>

					<Input
						isRequired
						label={t("Concurrent albums downloads")}
						type="number"
						variant="bordered"
						value={"" + tempConfig.store.concurrent_albums}
						onValueChange={v => {
							if (isNaN(parseInt(v))) {
								return
							}
							if (parseInt(v) < 1) {
								v = "1"
							}
							setTempConfig({
								...tempConfig,
								store: { ...tempConfig.store, concurrent_albums: parseInt(v) },
							})
						}}
					/>
					<Input
						isRequired
						label={t("Concurrent downloads")}
						type="number"
						variant="bordered"
						value={"" + tempConfig.store.concurrent_downloads}
						onValueChange={v => {
							if (isNaN(parseInt(v))) {
								return
							}
							if (parseInt(v) < 1) {
								v = "1"
							}
							setTempConfig({
								...tempConfig,
								store: { ...tempConfig.store, concurrent_downloads: parseInt(v) },
							})
						}}
					/>
				</Modal>
			)}
		</>
	)
}
