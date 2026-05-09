import React from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { useController, Control, FieldValues, Path } from 'react-hook-form'
import { tokens } from '@/theme/tokens'

interface Props<T extends FieldValues> extends TextInputProps {
  name: Path<T>
  control: Control<T>
  label?: string
  error?: string
}

export const FormInput = <T extends FieldValues>({
  name,
  control,
  label,
  error: manualError,
  ...textInputProps
}: Props<T>) => {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({ name, control })

  const errorMessage = error?.message || manualError

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, !!errorMessage && styles.inputError]}
        onBlur={onBlur}
        onChangeText={onChange}
        value={value}
        placeholderTextColor={tokens.colors.gray400}
        accessible
        accessibilityLabel={label || name}
        {...textInputProps}
      />
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: tokens.spacing[4] },
  label: { 
    fontSize: tokens.typography.size.sm, 
    color: tokens.colors.gray600, 
    fontWeight: tokens.typography.weight.semibold, 
    marginBottom: tokens.spacing[2] 
  },
  input: {
    backgroundColor: tokens.colors.bgLight,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.gray200,
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    fontSize: tokens.typography.size.base,
    color: tokens.colors.gray900,
  },
  inputError: { borderColor: tokens.colors.error },
  errorText: { color: tokens.colors.error, fontSize: tokens.typography.size.xs, marginTop: tokens.spacing[1] },
})

