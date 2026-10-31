import type { ReactNode } from "react"
import { colorClasses } from "@theme/tokens"

type MainLayoutShellProps = {
  children: ReactNode
}

/** Page content shell only — MobileBottomNav lives once in MainLayout. */
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  return (
    <main className={`${colorClasses.pageBg} min-h-screen w-full mobile-layout-shell`}>
      {children}
    </main>
  )
}
