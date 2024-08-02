import { Input, InputProps } from "@nextui-org/react"
import { useEffect, useState } from "react"

interface IInputProps extends InputProps {
	reveal?: boolean
	validation?: (value: string) => boolean
	setValidation?: (value: boolean) => void
}

export function TextInput(props: IInputProps): JSX.Element {
	const [isInvalid, setIsInvalid] = useState(() => {
		if (!props.validation) {
			return false
		}
		return !props.validation(props.value!)
	})

	useEffect(() => {
		if (props.setValidation) {
			props.setValidation(!isInvalid)
		}
	}, [])

	useEffect(() => {
		if (props.setValidation) {
			props.setValidation(!isInvalid)
		}
	}, [isInvalid])

	function handleValueChange(value: string) {
		if (props.validation) {
			setIsInvalid(!props.validation(value))
		}
		props.onValueChange && props.onValueChange(value)
	}

	return (
		<Input
			autoFocus={props.autoFocus}
			isRequired={props.isRequired}
			label={props.label}
			isInvalid={isInvalid}
			type="text"
			variant="bordered"
			value={props.value}
			onValueChange={handleValueChange}
			{...props}
		/>
	)
}
