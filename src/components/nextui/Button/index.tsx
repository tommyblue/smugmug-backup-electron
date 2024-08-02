import { Button, ButtonProps } from "@nextui-org/react"

export default function (props: ButtonProps): JSX.Element {
	return <Button {...props}>{props.children}</Button>
}
