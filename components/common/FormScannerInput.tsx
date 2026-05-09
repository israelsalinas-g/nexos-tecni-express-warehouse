import React from 'react'
import { useController, Control } from 'react-hook-form'
import { ScannerInput } from './ScannerInput'

interface Props {
  name: string
  control: Control<any>
  label?: string
  placeholder?: string
}

export const FormScannerInput: React.FC<Props> = ({
  name,
  control,
  label,
  placeholder,
}) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({ name, control })

  return (
    <ScannerInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      error={error?.message}
    />
  )
}
