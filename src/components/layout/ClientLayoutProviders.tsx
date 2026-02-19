'use client';

import { TimelineProvider } from "@/context/TimelineContext";
import { LoginModeProvider } from "@/context/LoginModeContext";
import { UserProvider, UserInfo } from "@/context/UserContext";
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";
import { TagsProvider } from "@/context/TagsContext";
import { StatsProvider } from "@/context/StatsContext";
import { SelectionProvider } from "@/context/SelectionContext";
import { SelectionToolbar } from "@/components/ui/SelectionToolbar";

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
                        <SelectionProvider>
                            <TimelineProvider>
                                <LoginTransitionWrapper>
                                    <MobileLayoutWrapper>
                                        {children}
                                        <SelectionToolbar />
                                    </MobileLayoutWrapper>
                                </LoginTransitionWrapper>
                            </TimelineProvider>
                        </SelectionProvider>
                    </TagsProvider>
                </LoginModeProvider>
            </StatsProvider>
        </UserProvider>
    );
}
