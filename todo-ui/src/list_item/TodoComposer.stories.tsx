import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { TodoComposer } from "@/list_item/TodoComposer";

const meta = {
  component: TodoComposer,
  args: { onSubmit: fn() },
} satisfies Meta<typeof TodoComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
