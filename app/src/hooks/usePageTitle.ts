import { useEffect } from 'react';

export function usePageTitle(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · SIGID`;
  }, [titulo]);
}
