import { Input, InputProps } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { EyeIcon, EyeSlashIcon } from "./icons"

interface IInputProps extends InputProps {
	reveal?: boolean
	validation?: (value: string) => boolean
	setValidation?: (value: boolean) => void
}

export function PasswordInput(props: IInputProps): JSX.Element {
	const [isVisible, setIsVisible] = useState(false)
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

	const toggleVisibility = () => {
		setIsVisible(isVisible => !isVisible)
	}

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
			endContent={
				<button
					className="focus:outline-none"
					type="button"
					onClick={toggleVisibility}
					aria-label="toggle password visibility"
				>
					{isVisible ? (
						<EyeSlashIcon className="text-2xl text-default-400 pointer-events-none" />
					) : (
						<EyeIcon className="text-2xl text-default-400 pointer-events-none" />
					)}
				</button>
			}
			type={isVisible ? "text" : "password"}
			variant="bordered"
			value={props.value}
			onValueChange={handleValueChange}
			{...props}
		/>
	)
}
