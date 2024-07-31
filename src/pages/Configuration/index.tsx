import { Checkbox, Input, Link, Button as ModalButton } from "@nextui-org/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "../../components/nextui/Button"
import Modal from "../../components/nextui/Modal"
import useConfig from "../../hooks/config"

export default function (): JSX.Element {
	const { t } = useTranslation()
	const { config, setConfig } = useConfig()
	const [isOpen, setIsOpen] = useState(false)
	const onClose = () => {
		setIsOpen(false)
	}

	function openTokenInstructions(e: React.MouseEvent<HTMLAnchorElement>) {
		e.preventDefault()
		window.api.openBrowser("https://github.com/tommyblue/smugmug-backup?tab=readme-ov-file#obtain-api-keys")
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
							<ModalButton color="primary" onPress={onClose}>
								Action
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
						type="password"
						variant="bordered"
						value={config.auth.api_key}
						onChange={e => setConfig({ ...config, auth: { ...config.auth, api_key: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("API Secret")}
						type="password"
						variant="bordered"
						value={config.auth.api_secret}
						onChange={e => setConfig({ ...config, auth: { ...config.auth, api_secret: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("User token")}
						type="password"
						variant="bordered"
						value={config.auth.user_token}
						onChange={e => setConfig({ ...config, auth: { ...config.auth, user_token: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("User secret")}
						type="password"
						variant="bordered"
						value={config.auth.user_secret}
						onChange={e => setConfig({ ...config, auth: { ...config.auth, user_secret: e.target.value } })}
					/>
					<div className="flex py-2 px-1 justify-between">
						<Link color="primary" size="sm" onClick={openTokenInstructions} isExternal showAnchorIcon>
							How to get the keys?
						</Link>
					</div>

					<h3 className="text-default-500 text-small">{t("Store")}</h3>
					<Input
						isRequired
						label={t("Destination path")}
						type="file"
						variant="bordered"
						value={config.store.destination}
						onChange={e => setConfig({ ...config, store: { ...config.store, destination: e.target.value } })}
					/>
					<Input
						isRequired
						label={t("File names")}
						type="text"
						variant="bordered"
						value={config.store.file_names}
						onChange={e => setConfig({ ...config, store: { ...config.store, file_names: e.target.value } })}
					/>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={config.store.use_metadata_times}
							onChange={e => setConfig({ ...config, store: { ...config.store, use_metadata_times: e.target.checked } })}
						>
							{t("Use metadata times")}
						</Checkbox>
					</div>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={config.store.force_metadata_times}
							onChange={e =>
								setConfig({ ...config, store: { ...config.store, force_metadata_times: e.target.checked } })
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
							isSelected={config.store.write_csv}
							onChange={e => setConfig({ ...config, store: { ...config.store, write_csv: e.target.checked } })}
						>
							{t("Write CSV")}
						</Checkbox>
					</div>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "textsmall",
							}}
							isSelected={config.store.force_video_download}
							onChange={e =>
								setConfig({ ...config, store: { ...config.store, force_video_download: e.target.checked } })
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
						value={"" + config.store.concurrent_albums}
						onChange={e =>
							setConfig({ ...config, store: { ...config.store, concurrent_albums: e.target.valueAsNumber } })
						}
					/>
					<Input
						isRequired
						label={t("Concurrent downloads")}
						type="number"
						variant="bordered"
						value={"" + config.store.concurrent_downloads}
						onChange={e =>
							setConfig({ ...config, store: { ...config.store, concurrent_downloads: e.target.valueAsNumber } })
						}
					/>
				</Modal>
			)}
		</>
	)
}
