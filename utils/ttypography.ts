import { TextStyle } from 'react-native';

type FontVariant = 'inter' | 'poppins' | 'nunito';

export const textStyles = (
  variant: FontVariant = 'inter',
  style: 'regular' | 'bold' = 'regular'
): TextStyle => ({
  fontFamily: variant,
  fontWeight: style === 'bold' ? '700' : '400',
});