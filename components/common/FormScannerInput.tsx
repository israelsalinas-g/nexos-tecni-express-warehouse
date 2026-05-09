import React from 'react'
import { useController, Control, FieldValues, Path } from 'react-hook-form'
import { ScannerInput } from './ScannerInput'

interface Props<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label?: string
  placeholder?: string
}

export const FormScannerInput = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
}: Props<T>) => {
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
