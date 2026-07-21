import React, { createContext, useContext, ReactNode } from 'react';
import { AppDependencies } from './Container';

const DependencyContext = createContext<AppDependencies | null>(null);

export function DependencyProvider({
  dependencies,
  children,
}: {
  dependencies: AppDependencies;
  children: ReactNode;
}) {
  return <DependencyContext.Provider value={dependencies}>{children}</DependencyContext.Provider>;
}

export function useDependencies(): AppDependencies {
  const ctx = useContext(DependencyContext);
  if (!ctx) {
    throw new Error('useDependencies must be used within a DependencyProvider');
  }
  return ctx;
}
