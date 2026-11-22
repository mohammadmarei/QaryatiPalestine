import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · قريتي Qaryati` : 'قريتي · Qaryati'
  }, [title])
}
