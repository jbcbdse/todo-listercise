import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { FlagProviderHost } from "@/flag/context";
import { FakeFlagProvider } from "@/flag/fake";
import { FlagKey } from "@/flag/keys";
import { TodoItem } from "@/list_item/TodoItem";

const meta = {
  component: TodoItem,
  decorators: [
    (Story) => (
      <FlagProviderHost value={new FakeFlagProvider()}>
        <Story />
      </FlagProviderHost>
    ),
  ],
  args: {
    item: {
      id: "1",
      title: "buy milk",
      completed: false,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    onCompletedChange: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof TodoItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Completed: Story = {
  args: {
    item: {
      id: "1",
      title: "buy milk",
      completed: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  },
};

export const SparklesOnComplete: Story = {
  decorators: [
    (Story) => (
      <FlagProviderHost
        value={new FakeFlagProvider({ [FlagKey.CompletedSparkles]: true })}
      >
        <Story />
      </FlagProviderHost>
    ),
  ],
};
