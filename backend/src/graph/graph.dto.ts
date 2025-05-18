export interface AgNode<T = Record<string, any>> {
  id: number;
  label: string;
  properties: T;
}
