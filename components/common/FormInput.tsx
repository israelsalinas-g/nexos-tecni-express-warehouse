import React from 'react'
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'
import { useController, Control } from 'react-hook-form'

interface Props extends TextInputProps {
  name: string
  control: Control<any>
  label?: string
  error?: string
}

export const FormInput: React.FC<Props> = ({
  name,
  control,
  label,
  error: manualError,
  ...textInputProps
}) => {
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
        placeholderTextColor="#9ca3af"
        {...textInputProps}
      />
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4 },
})
