import { createTheme, ThemeOptions } from "@mui/material";
const themeOptions: ThemeOptions = {
  typography: {
    button: {
      fontSize: 10,
      fontStyle: 'normal',
      textTransform: 'none',
    },
  },
}

export const theme = createTheme(themeOptions)