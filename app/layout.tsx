import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MSys Treinamentos',
  description: 'Plataforma de treinamento e capacitação MSys',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
