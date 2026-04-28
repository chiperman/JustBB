"use client"

import { UIProvider } from "@/context/UIContext"
import { LayoutProvider } from "@/context/LayoutContext"
import { UserProvider } from "@/context/UserContext"
import { UserInfo } from "@/types/auth"
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper"
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper"
import { TagsProvider } from "@/context/TagsContext"
import { StatsProvider } from "@/context/StatsContext"
import { HeatmapStats } from "@/types/stats"
import { SelectionToolbar } from "@/components/ui/SelectionToolbar"
import { PageDataCacheProvider } from "@/context/PageDataCache"
import { UnlockedMemosProvider } from "@/context/UnlockedMemosContext"
import { ExportProvider } from "@/context/ExportContext"
import { ExportProgressPanel } from "@/components/layout/ExportProgressPanel"

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
                        <SelectionToolbar />
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
    </UserProvider>
  )
}
