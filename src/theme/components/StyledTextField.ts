import { TextField, TextFieldProps } from "@mui/material";

import { styled } from '@mui/material/styles';

export const StyledTextField = styled(TextField)<TextFieldProps>(({ theme }) => ({
  // Label Styling
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    '&.Mui-focused': {
      color: theme.palette.secondary.main,
    },
  },

  // Input Base Styling
  '& .MuiInputBase-root': {
    backgroundColor: theme.palette.background.default,
    fontFamily: theme.typography.fontFamily,
    borderRadius: `${theme.shape.borderRadius}px`,
    color: theme.palette.text.primary,

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
      borderWidth: '1px',
    },

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.secondary.main,
    },

    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.secondary.main,
      borderWidth: '2px',
    },

    '& .MuiInputBase-input': {
      padding: '12px 14px',
      '&::placeholder': {
        color: theme.palette.text.disabled,
        opacity: 1,
      },
    },
  },

  // Helper Text Styling
  '& .MuiFormHelperText-root': {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.secondary,
    marginTop: '4px',
  },

  // Error State Styling
  '& .Mui-error': {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: `${theme.palette.error.main} !important`,
    },
    '&.MuiInputLabel-root': {
      color: theme.palette.error.main,
    },
  },
}));