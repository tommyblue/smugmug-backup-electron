import { Checkbox, Input, Link, Button as ModalButton } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "../../components/nextui/Button"
import Modal from "../../components/nextui/Modal"
import { Config } from "../../config"
import useConfig from "../../hooks/config"

export default function (): JSX.Element {
	const { t } = useTranslation()
	const { config, setConfig } = useConfig()
	const [isOpen, setIsOpen] = useState(false)
	const [tempConfig, setTempConfig] = useState<Config>(config)

	useEffect(() => {
		setTempConfig(config)
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
							<ModalButton color="primary" onPress={handleSave}>
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
					<Input
						autoFocus
						isRequired
						label={t("API Token")}
						type="text"
						variant="bordered"
						value={tempConfig.auth.api_key}
						onChange={e => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, api_key: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("API Secret")}
						type="text"
						variant="bordered"
						value={tempConfig.auth.api_secret}
						onChange={e => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, api_secret: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("User token")}
						type="text"
						variant="bordered"
						value={tempConfig.auth.user_token}
						onChange={e => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, user_token: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("User secret")}
						type="text"
						variant="bordered"
						value={tempConfig.auth.user_secret}
						onChange={e => setTempConfig({ ...tempConfig, auth: { ...tempConfig.auth, user_secret: e.target.value } })}
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
							How to get the keys?
						</Link>
					</div>

					<h3 className="text-default-500 text-small">{t("Store")}</h3>
					<Input
						isRequired
						label={t("Destination path")}
						type="file"
						variant="bordered"
						value={tempConfig.store.destination}
						onChange={e =>
							setTempConfig({ ...tempConfig, store: { ...tempConfig.store, destination: e.target.value } })
						}
					/>
					<Input
						isRequired
						label={t("File names")}
						type="text"
						variant="bordered"
						value={tempConfig.store.file_names}
						onChange={e => setTempConfig({ ...tempConfig, store: { ...tempConfig.store, file_names: e.target.value } })}
					/>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={tempConfig.store.use_metadata_times}
							onChange={e =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, use_metadata_times: e.target.checked } })
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
							onChange={e =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, force_metadata_times: e.target.checked } })
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
							onChange={e =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, write_csv: e.target.checked } })
							}
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
							onChange={e =>
								setTempConfig({ ...tempConfig, store: { ...tempConfig.store, force_video_download: e.target.checked } })
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
						onChange={e =>
							setTempConfig({
								...tempConfig,
								store: { ...tempConfig.store, concurrent_albums: e.target.valueAsNumber },
							})
						}
					/>
					<Input
						isRequired
						label={t("Concurrent downloads")}
						type="number"
						variant="bordered"
						value={"" + tempConfig.store.concurrent_downloads}
						onChange={e =>
							setTempConfig({
								...tempConfig,
								store: { ...tempConfig.store, concurrent_downloads: e.target.valueAsNumber },
							})
						}
					/>
				</Modal>
			)}
		</>
	)
}
