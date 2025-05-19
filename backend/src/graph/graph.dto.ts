export interface AgNode<T = Record<string, any>> {
  id: number;
  label: string;
  properties: T;
}

export interface Actor {
    id: string,
    name: string,
    birthYear: string
}

export interface Movie {
    id: string,
    year: number,
    title: string
}