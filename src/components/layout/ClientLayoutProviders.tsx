'use client';

import { UIProvider } from "@/context/UIContext";
import { UserProvider, UserInfo } from "@/context/UserContext";
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";
import { TagsProvider } from "@/context/TagsContext";
import { StatsProvider } from "@/context/StatsContext";
import { HeatmapStats } from "@/types/stats";
import { SelectionToolbar } from "@/components/ui/SelectionToolbar";
import { ViewProvider } from "@/context/ViewContext";
import { PageDataCacheProvider } from "@/context/PageDataCache";

interface ClientLayoutProvidersProps {
    children: React.ReactNode;
    initialTags?: { tag_name: string; count: number }[];
    initialStats?: HeatmapStats | null;
    initialPath?: string;
}

export function ClientLayoutProviders({
    children,
    initialTags = [],
    initialStats,
    initialUser,
    initialPath = '/'
}: ClientLayoutProvidersProps & { initialUser?: UserInfo | null }) {
    return (
        <UserProvider initialUser={initialUser}>
            <PageDataCacheProvider>
                <ViewProvider initialPath={initialPath}>
                    <StatsProvider initialData={initialStats}>
                        <UIProvider>
                            <TagsProvider initialData={initialTags}>
                                <LoginTransitionWrapper>
                                    <MobileLayoutWrapper>
                                        {children}
                                        <SelectionToolbar />
                                    </MobileLayoutWrapper>
                                </LoginTransitionWrapper>
                            </TagsProvider>
                        </UIProvider>
                    </StatsProvider>
                </ViewProvider>
            </PageDataCacheProvider>
        </UserProvider>
    );
}
