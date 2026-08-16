import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField } from "@/ui/TextField";

const meta = {
  component: TextField,
  args: { label: "Title" },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { defaultValue: "buy milk" },
};
