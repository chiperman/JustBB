'use client';

import { TimelineProvider } from "@/context/TimelineContext";
import { LoginModeProvider } from "@/context/LoginModeContext";
import { UserProvider } from "@/context/UserContext";
import { LoginTransitionWrapper } from "@/components/layout/LoginTransitionWrapper";
import { MobileLayoutWrapper } from "@/components/layout/MobileLayoutWrapper";

interface ClientLayoutProvidersProps {
    children: React.ReactNode;
}

export function ClientLayoutProviders({
    children,
}: ClientLayoutProvidersProps) {
    return (
        <UserProvider>
            <LoginModeProvider>
                <TimelineProvider>
                    <LoginTransitionWrapper>
                        <MobileLayoutWrapper>
                            {children}
                        </MobileLayoutWrapper>
                    </LoginTransitionWrapper>
                </TimelineProvider>
            </LoginModeProvider>
        </UserProvider>
    );
}
