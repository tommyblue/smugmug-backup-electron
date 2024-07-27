import { Button } from "@nextui-org/react"

interface IButtonProps {
	text: string
	onClick: React.MouseEventHandler<HTMLButtonElement>
}

export default function (props: IButtonProps): JSX.Element {
	return (
		<Button size="lg" color="primary" radius="md" onClick={props.onClick}>
			{props.text}
		</Button>
	)
}
