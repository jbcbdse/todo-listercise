import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FakeTodoApi } from "@/api/fake_todo";
import { TodoApiProvider } from "@/api/todo_context";
import { Page } from "@/app/Page";
import { FlagProviderHost } from "@/flag/context";
import { FakeFlagProvider } from "@/flag/fake";

const api = new FakeTodoApi();
api.seed([
  {
    id: "1",
    title: "buy milk",
    completed: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    title: "write tests",
    completed: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
]);

const meta = {
  component: Page,
  decorators: [
    (Story) => {
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      return (
        <QueryClientProvider client={client}>
          <TodoApiProvider value={api}>
            <FlagProviderHost value={new FakeFlagProvider()}>
              <Story />
            </FlagProviderHost>
          </TodoApiProvider>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
