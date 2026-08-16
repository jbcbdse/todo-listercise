import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { FetchTodoApi } from "@/api/fetch_todo";
import { TodoApiProvider } from "@/api/todo_context";
import { FlagProviderHost } from "@/flag/context";
import { HttpFlagProvider } from "@/flag/http";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );
  const [todoApi] = useState(() => new FetchTodoApi());
  const [flags] = useState(() => new HttpFlagProvider());

  useEffect(() => {
    flags.start();
    return () => {
      flags.stop();
    };
  }, [flags]);

  return (
    <QueryClientProvider client={queryClient}>
      <TodoApiProvider value={todoApi}>
        <FlagProviderHost value={flags}>{children}</FlagProviderHost>
      </TodoApiProvider>
    </QueryClientProvider>
  );
}
