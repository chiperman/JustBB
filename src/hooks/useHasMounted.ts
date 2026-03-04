import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => { };

/**
 * 一个高性能、无警告的 Hook，用于检测组件是否已在客户端挂载。
 * 使用 React 18 的 useSyncExternalStore 模式，替代 useState + useEffect，
 * 天然免疫 react-hooks/set-state-in-effect 警告。
 */
export function useHasMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );
}
