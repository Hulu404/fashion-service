import './globals.css'
import { Jost, Bodoni_Moda } from 'next/font/google'
import Navigation from '../components/Navigation'
import ChatLauncher from '../components/chat/ChatLauncher'

const jost = Jost({ subsets: ['latin'], weight: ['300','400','600','700'], variable: '--font-jost' })
const bodoni = Bodoni_Moda({ subsets: ['latin'], weight: ['400','600','700'], variable: '--font-bodoni' })

export const metadata = {
  title: 'ÉCLAT — Витрина',
  description: 'Мобильный AI-стилист — витрина'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${jost.variable} ${bodoni.variable} bg-porcelain-2 text-ink`}>
        {/* App shell: sidebar (desktop) + tab bar (mobile) + stage. */}
        <div className="app">
          <Navigation />
          <div className="stage">{children}</div>
          <ChatLauncher />
        </div>
      </body>
    </html>
  )
}
