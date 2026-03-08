import { Text as RNText, TextInput as RNTextInput, TextProps as RNTextProps, TextInputProps as RNTextInputProps, StyleSheet, TextStyle } from 'react-native';
import React from 'react';

const getFontFamily = (style: any) => {
  const flattenedStyle = StyleSheet.flatten(style || {}) as any;
  const weight = flattenedStyle.fontWeight || '400';
  
  switch(weight) {
    case '100': return 'GoogleSansFlex_100Thin';
    case '200': return 'GoogleSansFlex_200ExtraLight';
    case '300': return 'GoogleSansFlex_300Light';
    case '400':
    case 'normal': return 'GoogleSansFlex_400Regular';
    case '500': return 'GoogleSansFlex_500Medium';
    case '600': return 'GoogleSansFlex_600SemiBold';
    case '700': 
    case 'bold': return 'GoogleSansFlex_700Bold';
    case '800': return 'GoogleSansFlex_800ExtraBold';
    case '900': return 'GoogleSansFlex_900Black';
    default: return 'GoogleSansFlex_400Regular';
  }
};

export const Text = React.forwardRef<RNText, RNTextProps>((props, ref) => {
  const fontFamily = getFontFamily(props.style);
  return <RNText ref={ref} {...props} style={[props.style, { fontFamily, fontWeight: undefined }]} />;
});

export const TextInput = React.forwardRef<RNTextInput, RNTextInputProps>((props, ref) => {
  const fontFamily = getFontFamily(props.style);
  return <RNTextInput ref={ref} {...props} style={[props.style, { fontFamily, fontWeight: undefined }]} />;
});
