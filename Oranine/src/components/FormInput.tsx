import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { COLORS } from '../../constants/theme';

type FormInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function FormInput({
  label,
  error,
  ...textInputProps
}: FormInputProps) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <TextInput
        {...textInputProps}
        placeholderTextColor="#75668E"
        style={[
          styles.input,
          error ? styles.inputError : null,
        ]}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },

  label: {
    marginBottom: 5,
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },

  input: {
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 9,
    color: COLORS.text,
    fontSize: 14,
    backgroundColor: '#D8C8FA',
  },

  inputError: {
    borderColor: '#FCA5A5',
  },

  error: {
    marginTop: 3,
    color: '#FECACA',
    fontSize: 10,
  },
});