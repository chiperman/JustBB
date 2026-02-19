'use client';

import { TimelineProvider } from "@/context/TimelineContext";
import { LoginModeProvider } from "@/context/LoginModeContext";
import { UserProvider, UserInfo } from "@/context/UserContext";
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";
import { TagsProvider } from "@/context/TagsContext";
import { StatsProvider } from "@/context/StatsContext";

interface ClientLayoutProvidersProps {
    children: React.ReactNode;
    initialTags?: { tag_name: string; count: number }[];
    initialStats?: any;
}

export function ClientLayoutProviders({
    children,
    initialTags = [],
    initialStats,
    initialUser
}: ClientLayoutProvidersProps & { initialUser?: UserInfo | null }) {
    return (
        <UserProvider initialUser={initialUser}>
            <StatsProvider initialData={initialStats}>
                <LoginModeProvider>
                    <TagsProvider initialData={initialTags}>
                        <TimelineProvider>
                            <LoginTransitionWrapper>
                                <MobileLayoutWrapper>
                                    {children}
                                </MobileLayoutWrapper>
                            </LoginTransitionWrapper>
                        </TimelineProvider>
                    </TagsProvider>
                </LoginModeProvider>
            </StatsProvider>
        </UserProvider>
    );
}
