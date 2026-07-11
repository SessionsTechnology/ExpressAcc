import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'expressAcc',
    themes: {
      expressAcc: {
        dark: true,
        colors: {
          background: '#09111f',
          surface: '#121d2e',
          primary: '#6ee7c7',
          secondary: '#8ba8ff',
          accent: '#ffcc80',
          error: '#ff8795',
          warning: '#ffd166',
          success: '#63d5a1',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0 },
    VCard: { rounded: 'xl' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
  },
})
