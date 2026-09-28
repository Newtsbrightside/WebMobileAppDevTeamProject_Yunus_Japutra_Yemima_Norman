// CONTOH: ubah vite.config.js repo Anda menjadi seperti ini (tambah baris `base`)
// supaya CSS/JS termuat saat di-deploy ke GitHub Pages.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/WebMobileAppDevTeamProject_Yunus_Japutra_Yemima_Norman/',
  plugins: [react()],
})
