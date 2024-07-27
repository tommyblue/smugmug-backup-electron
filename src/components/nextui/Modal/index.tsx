import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps } from "@nextui-org/react"

export interface IModalProps {
	style: {
		placement?: ModalProps["placement"]
		backdrop?: ModalProps["backdrop"]
		size?: ModalProps["size"]
	}
	isOpen: boolean
	title: string
	footer?: JSX.Element
	children: JSX.Element[] | JSX.Element
}

export default function (props: IModalProps): JSX.Element {
	return (
		<>
			<Modal {...props.style} isOpen={props.isOpen}>
				<ModalContent>
					<ModalHeader className="flex flex-col gap-1">{props.title}</ModalHeader>
					<ModalBody>{props.children}</ModalBody>
					{props.footer && <ModalFooter>{props.footer}</ModalFooter>}
				</ModalContent>
			</Modal>
		</>
	)
}
