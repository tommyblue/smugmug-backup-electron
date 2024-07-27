import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/solid"
import { Checkbox, Input, Link, Button as ModalButton } from "@nextui-org/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import Button from "../../components/nextui/Button"
import Modal from "../../components/nextui/Modal"

export default function (): JSX.Element {
	const { t } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const onClose = () => {
		setIsOpen(false)
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
					<Input
						autoFocus
						endContent={<EnvelopeIcon className="size-6 text-default-400 pointer-events-none flex-shrink-0" />}
						label="Email"
						placeholder="Enter your email"
						variant="bordered"
					/>
					<Input
						endContent={<LockClosedIcon className="size-6 text-default-400 pointer-events-none flex-shrink-0" />}
						label="Password"
						placeholder="Enter your password"
						type="password"
						variant="bordered"
					/>
					<div className="flex py-2 px-1 justify-between">
						<Checkbox
							classNames={{
								label: "text-small",
							}}
						>
							Remember me
						</Checkbox>
						<Link color="primary" href="#" size="sm">
							Forgot password?
						</Link>
					</div>
				</Modal>
			)}
		</>
	)
}
