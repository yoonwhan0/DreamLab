import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AccessTier } from "@/hooks/useAccessPolicy";
import { isDemoMode } from "@/demo/demoData";

interface DemoContextValue {
  enabled: boolean;
  demoTier: AccessTier | null;
  setDemoTier: (tier: AccessTier | null) => void;
}

const DemoContext = createContext<DemoContextValue>({
  enabled: false,
  demoTier: null,
  setDemoTier: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoTier, setDemoTier] = useState<AccessTier | null>(null);

  const value = useMemo(
    () => ({
      enabled: isDemoMode,
      demoTier,
      setDemoTier,
    }),
    [demoTier],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  return useContext(DemoContext);
}
