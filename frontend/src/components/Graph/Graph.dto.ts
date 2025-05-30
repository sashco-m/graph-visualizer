import type { Position } from "vis-network"

export interface GraphProps {
  onNodeClick: (id:string) => void
  onNodeHover: (id:string) => void
  onNodeBlur: (id:string) => void
  onEdgeHover: (id:string, { x, y}: {x:number, y:number}) => void
  onEdgeBlur: (id:string) => void
  ref: React.RefObject<GraphHandle | null> 
}

export interface NodeType {
  id: string,
  label: string
  movies: string[],
  birthYear: string,
  size?: number,
  font?: {
    size?: number
  },
  x?: number,
  y?: number,
  fixed?: boolean,
  color?: {
    background?: string
  }
  mass?: number
}

export interface EdgeType {
  id: string
  from: string,
  to:string,
  year: number,
  label?: string
  movieId?: string
  hidden?: boolean
  length?: number
  springConstant?: number
}

export interface GraphHandle {
  addData: (nodes: NodeType[], edges: EdgeType[], rootId?: string) => void
  clear: () => void
  getNodeCount: () => number
  getNode: (id: string) => NodeType | null
  getEdge: (id: string) => EdgeType | null
  getNodes: () => NodeType[]
  focusNode: (id: string) => void
  getDOMPosition: (id: string) => Position
  getNumConnections: (id:string) => number
}
