import { Page } from "@/app/Page";
import { AppProviders } from "@/app/providers";

export function App() {
  return (
    <AppProviders>
      <Page />
    </AppProviders>
  );
}
