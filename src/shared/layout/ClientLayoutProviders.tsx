"use client"

import { UIProvider } from "@/state/UIContext"
import { LayoutProvider } from "@/state/LayoutContext"
import { UserProvider } from "@/state/UserContext"
import { UserInfo } from "@/types/auth"
import { LoginTransitionWrapper } from "@/shared/layout/LoginTransitionWrapper"
import { MobileLayoutWrapper } from "@/shared/layout/MobileLayoutWrapper"
import { TagsProvider } from "@/state/TagsContext"
import { StatsProvider } from "@/state/StatsContext"
import { HeatmapStats } from "@/types/stats"
import { PageDataCacheProvider } from "@/state/PageDataCache"
import { UnlockedMemosProvider } from "@/state/UnlockedMemosContext"
import { ExportProvider } from "@/state/ExportContext"
import { ExportProgressPanel } from "@/shared/layout/ExportProgressPanel"
import { ConfirmProvider } from "@/state/ConfirmContext"

interface ClientLayoutProvidersProps {
  children: React.ReactNode
  initialTags?: { tag_name: string; count: number }[]
  initialStats?: HeatmapStats | null
}

export function ClientLayoutProviders({
  children,
  initialTags = [],
  initialStats,
  initialUser,
}: ClientLayoutProvidersProps & { initialUser?: UserInfo | null }) {
  return (
    <UserProvider initialUser={initialUser}>
      <ConfirmProvider>
        <UnlockedMemosProvider>
          <PageDataCacheProvider>
            <ExportProvider>
              <StatsProvider initialData={initialStats}>
                <LayoutProvider>
                  <UIProvider>
                    <TagsProvider initialData={initialTags}>
                      <LoginTransitionWrapper>
                        <MobileLayoutWrapper>
                          {children}
                          <ExportProgressPanel />
                        </MobileLayoutWrapper>
                      </LoginTransitionWrapper>
                    </TagsProvider>
                  </UIProvider>
                </LayoutProvider>
              </StatsProvider>
            </ExportProvider>
          </PageDataCacheProvider>
        </UnlockedMemosProvider>
      </ConfirmProvider>
    </UserProvider>
  )
}
