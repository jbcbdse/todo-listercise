import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@/ui/Checkbox";

const meta = {
  component: Checkbox,
  args: { label: "Done" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};
