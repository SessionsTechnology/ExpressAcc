import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'expressAcc',
    themes: {
      expressAcc: {
        dark: false,
        colors: {
          background: '#F3EEDF',
          surface: '#FFFDF6',
          'surface-variant': '#E9E3D4',
          'on-background': '#202B2A',
          'on-surface': '#202B2A',
          'on-surface-variant': '#4E5B58',
          primary: '#1E5B4F',
          'on-primary': '#FFFFFF',
          secondary: '#365F7D',
          'on-secondary': '#FFFFFF',
          accent: '#A94C32',
          'on-accent': '#FFFFFF',
          error: '#A63A35',
          'on-error': '#FFFFFF',
          warning: '#8A5A00',
          'on-warning': '#FFFFFF',
          success: '#2F6B4F',
          'on-success': '#FFFFFF',
          info: '#365F7D',
          'on-info': '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0 },
    VCard: { rounded: 'lg' },
    VAlert: { rounded: 'lg' },
    VChip: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary', bgColor: 'surface' },
    VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary', bgColor: 'surface' },
    VFileInput: { variant: 'outlined', density: 'comfortable', color: 'primary', bgColor: 'surface' },
    VListItem: { rounded: 'lg' },
  },
})
