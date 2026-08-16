import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/ui/Button";

const meta = {
  component: Button,
  args: { children: "Save" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
