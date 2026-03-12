import { createTheme, ThemeOptions } from "@mui/material";
const themeOptions: Partial<ThemeOptions> = {
  palette: {
    background: {
      default: '#f1e9d2', // Main Parchment
      paper: '#E6DDBF',   // Slightly darker for Cards/Modals
    },
    primary: {
      main: '#2C2621',    // Ink Black
      light: '#554D46',
      dark: '#000000',
      contrastText: '#f1e9d2',
    },
    secondary: {
      main: '#9E7E4F',    // Antique Gold
      light: '#C4A478',
      dark: '#7A5E33',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#2C2621', // Deep Brown/Black
      secondary: '#5F5449', // Muted Sepia
      disabled: '#AFA493',
    },
    divider: '#D4C8A8',
    error: {
      main: '#8B3A3A',    // Scholarly Red
    },
    success: {
      main: '#4F6D4F',    // Muted Green
    },
  },
  typography: {
    fontFamily: '"Marmelad", "serif"', // Academic feel
    button: {
      textTransform: 'none',
      fontWeight: 600,

      normal: {
        fontSize: 10,
        fontWeight: 400,
        lineHeight: 1.5,
      },
    },
  },
  shape: {
    borderRadius: 4, // Subtle corners for a paper-like feel
  },
}

export const theme = createTheme(themeOptions)