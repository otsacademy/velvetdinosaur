'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type NavigationAction = () => void

const GUARD_STATE_KEY = '__news_unsaved_guard__'

export function useNewsUnsavedChangesGuard(isDirty: boolean) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingActionRef = useRef<NavigationAction | null>(null)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  const requestNavigation = useCallback((action: NavigationAction) => {
    if (!isDirtyRef.current) {
      action()
      return
    }
    pendingActionRef.current = action
    setDialogOpen(true)
  }, [])

  const confirmNavigation = useCallback(() => {
    const pendingAction = pendingActionRef.current
    pendingActionRef.current = null
    setDialogOpen(false)
    pendingAction?.()
  }, [])

  const cancelNavigation = useCallback(() => {
    pendingActionRef.current = null
    setDialogOpen(false)
  }, [])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])

  useEffect(() => {
    const pushGuardState = () => {
      window.history.pushState({ [GUARD_STATE_KEY]: true }, '', window.location.href)
    }

    pushGuardState()

    const onPopState = () => {
      if (!isDirtyRef.current) {
        window.removeEventListener('popstate', onPopState)
        window.history.back()
        return
      }

      pendingActionRef.current = () => {
        window.removeEventListener('popstate', onPopState)
        window.history.go(-2)
      }

      setDialogOpen(true)
      pushGuardState()
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current) return
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.dataset.allowUnsavedBypass === 'true') return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      const nextUrl = new URL(href, window.location.href)
      if (nextUrl.href === window.location.href) return

      event.preventDefault()
      pendingActionRef.current = () => {
        window.location.assign(nextUrl.toString())
      }
      setDialogOpen(true)
    }

    document.addEventListener('click', onDocumentClick, true)
    return () => {
      document.removeEventListener('click', onDocumentClick, true)
    }
  }, [])

  return {
    dialogOpen,
    setDialogOpen,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
  }
}
