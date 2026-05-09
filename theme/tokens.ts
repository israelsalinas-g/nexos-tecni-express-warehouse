// src/theme/tokens.ts
export const tokens = {
  colors: {
    primary:   '#2563eb', // Blue 600 - Main action
    secondary: '#374151', // Gray 700 - Secondary action
    success:   '#16a34a', // Green 600
    warning:   '#ca8a04', // Yellow 600
    error:     '#dc2626', // Red 600
    info:      '#0284c7', // Sky 600

    // Neutrals
    gray50:  '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray400: '#9ca3af',
    gray600: '#4b5563',
    gray800: '#1f2937',
    gray900: '#111827',

    // Backgrounds
    bgLight: '#ffffff',
    bgScreen: '#f3f4f6',
  },

  typography: {
    size: { 
      xs: 12, 
      sm: 13, 
      base: 15, 
      lg: 18, 
      xl: 22, 
      '2xl': 26 
    },
    weight: { 
      regular: '400', 
      medium: '500', 
      semibold: '600', 
      bold: '700', 
      extrabold: '800' 
    },
  },

  spacing: { 
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

