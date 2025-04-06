// src/constants/theme.js

// Core color palette
const colors = {
    // Primary colors
    primary: {
      main: '#4A6572',      // Muted blue - main primary color
      light: '#90A4AE',     // Lighter shade
      dark: '#344955',      // Darker shade
      contrast: '#FFFFFF',  // Text color on primary
    },
    
    // Secondary colors
    secondary: {
      main: '#6A5ACD',      // Mint green - main secondary color
      light: '#6A5ACD',     // Lighter shade
      dark: '#6A5ACD',      // Darker shade
      contrast: '#FFFFFF',  // Text color on secondary
    },
  
    // Tertiary colors
    tertiary: {
      main: '#A675A1',     // Soft purple
      light: '#D4B6D1',    // Lighter shade
      dark: '#7A5278',     // Darker shade
    },
    
    // Accent colors for specific modules
    accent: {
      pregnancy: {
        main: '#6A5ACD',    // Soft purple
        light: '#D4B6D1',   // Lighter shade
        dark: '#7A5278',    // Darker shade
      },
      alzheimers: {
        main: '#825EE4',    // Mint green
        light: '#5E72E4',   // Lighter shade
        dark: '#318C7E',    // Darker shade
      },
    },
    
    // Status colors
    status: {
      success: '#66BB6A',   // Green
      warning: '#FFA726',   // Orange
      error: '#EF5350',     // Red
      info: '#29B6F6',      // Blue
    },
    
    // Grayscale
    gray: {
      50: '#FAFAFA',
      100: '#F5F7FA',
      200: '#E1E8ED',
      300: '#CFD8DC',
      400: '#B0BEC5',
      500: '#90A4AE',
      600: '#78909C',
      700: '#607D8B',
      800: '#546E7A',
      900: '#37474F',
    },
    
    // Core colors
    white: '#FFFFFF',
    black: '#212121',
    transparent: 'transparent',
  };
  
  // Typography settings
  const typography = {
    fontFamily: {
      base: undefined,   // Default system font
      heading: undefined, // Default system font for headings
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      heading1: 28,
      heading2: 24,
      heading3: 20,
      heading4: 18,
    },
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
    },
  };
  
  // Spacing values
  const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };
  
  // Border radius
  const borderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 100,
  };
  
  // Shadows
  const shadows = {
    none: {},
    sm: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 8,
      elevation: 4,
    },
  };
  
  // Common UI element styles
  const common = {
    card: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.md,
    },
    button: {
      primary: {
        backgroundColor: colors.primary.main,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        minHeight: 50,
      },
      secondary: {
        backgroundColor: colors.secondary.main,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        minHeight: 50,
      },
      tertiary: {
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.primary.main,
        minHeight: 50,
      },
      disabled: {
        backgroundColor: colors.gray[300],
        padding: spacing.md,
        borderRadius: borderRadius.md,
        minHeight: 50,
      },
    },
    input: {
      backgroundColor: colors.gray[100],
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.gray[200],
      minHeight: 50,
    }
  };
  
  // Theme object export
  export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    common,
  };