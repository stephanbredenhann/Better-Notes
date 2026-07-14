import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radii, spacing } from '@/theme/tokens';
import { PrimaryButton } from './ui';

export function AddItemModal({
  visible,
  title,
  placeholder,
  submitLabel,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.fadedGray}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <View style={styles.actions}>
            <PrimaryButton label={submitLabel} onPress={submit} />
            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 4, 55, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: spacing[24],
  },
  sheet: {
    backgroundColor: colors.paperWhite,
    borderRadius: radii.sheet,
    borderWidth: 2,
    borderColor: colors.nightInk,
    padding: spacing[16],
    gap: spacing[12],
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    color: colors.charcoal,
    fontSize: 19,
  },
  input: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 17,
    color: colors.charcoal,
    borderWidth: 2,
    borderColor: colors.fadedGray,
    borderRadius: radii.control,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[12],
  },
  actions: {
    gap: spacing[8],
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  cancelText: {
    fontFamily: 'NunitoSans_700Bold',
    color: colors.pencilGray,
    fontSize: 14,
  },
});
