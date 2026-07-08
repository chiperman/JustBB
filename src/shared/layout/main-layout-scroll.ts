interface ResolveMainLayoutScrollStateInput {
  currentCollapsed: boolean
  scrollTop: number
  scrollableHeight: number
  isMobile: boolean
}

interface MainLayoutScrollState {
  editorForceCollapsed: boolean
  showScrollTop: boolean
}

export function resolveMainLayoutScrollState({
  currentCollapsed,
  scrollTop,
  scrollableHeight,
  isMobile,
}: ResolveMainLayoutScrollStateInput): MainLayoutScrollState {
  if (isMobile) {
    return {
      editorForceCollapsed: false,
      showScrollTop: scrollTop > 300,
    }
  }

  if (scrollableHeight < 300) {
    return {
      editorForceCollapsed: currentCollapsed && scrollTop >= 50,
      showScrollTop: false,
    }
  }

  if (scrollTop > 100) {
    return {
      editorForceCollapsed: true,
      showScrollTop: scrollTop > 300,
    }
  }

  if (scrollTop < 50) {
    return {
      editorForceCollapsed: false,
      showScrollTop: scrollTop > 300,
    }
  }

  return {
    editorForceCollapsed: currentCollapsed,
    showScrollTop: scrollTop > 300,
  }
}
