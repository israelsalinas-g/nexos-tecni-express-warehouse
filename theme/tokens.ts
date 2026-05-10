// src/theme/tokens.ts
export const tokens = {
  colors: {
    primary:   '#00542e', // Tecni Express Green
    primaryContainer: '#126e40',
    onPrimary: '#ffffff',
    secondary: '#545f72',
    secondaryContainer: '#d5e0f7',
    onSecondaryContainer: '#586377',
    tertiary: '#3e485a',
    tertiaryContainer: '#566073',
    onTertiaryContainer: '#d1dbf1',
    success:   '#126e40', 
    warning:   '#f59e0b',
    error:     '#ba1a1a',
    errorContainer: '#ffdad6',
    info:      '#3b82f6',

    // Neutrals
    gray50:  '#f9f9fc',
    gray100: '#f3f3f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray600: '#4b5563',
    gray800: '#1f2937',
    gray900: '#111827',

    // Backgrounds
    bgLight: '#ffffff',
    bgScreen: '#f9f9fc',
    surface: '#f9f9fc',
    surfaceVariant: '#e2e2e5',
    outline: '#6f7a70',
    outlineVariant: '#bec9be',
    onSurface: '#1a1c1e',
    onSurfaceVariant: '#3f4941',
  },

  typography: {
    size: { 
      xs: 12, 
      sm: 13, 
      base: 15, 
      lg: 18, 
      xl: 22, 
      '2xl': 26,
      '3xl': 32,
      '4xl': 40
    },
    weight: { 
      regular: '400' as any, 
      medium: '500' as any, 
      semibold: '600' as any, 
      bold: '700' as any, 
      extrabold: '800' as any 
    },
  },

  spacing: { 
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 
  },

  radius: { 
    sm: 4, 
    md: 8, 
    lg: 12, 
    xl: 16, 
    '2xl': 24,
    full: 9999 
  },

  shadow: {
    sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,  elevation: 2 },
    md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,  elevation: 4 },
    lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  },
} as const

