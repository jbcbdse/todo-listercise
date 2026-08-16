export interface FlagProvider {
  isEnabled: (key: string) => boolean;
  subscribe: (listener: () => void) => () => void;
}
