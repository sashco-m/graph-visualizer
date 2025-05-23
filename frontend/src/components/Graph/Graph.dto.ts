import type { Position } from "vis-network"

export interface GraphProps {
  onNodeClick: (id:string) => void
  onNodeHover: (id:string) => void
  onNodeBlur: (id:string) => void
  ref: React.RefObject<GraphHandle | null> 
}

export interface NodeType {
  id: string,
  label: string
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
}

export interface EdgeType {
  id: string
  from: string,
  to:string,
  label: string
}

export interface GraphHandle {
  addData: (nodes: NodeType[], edges: EdgeType[], rootId?: string) => void
  clear: () => void
  getNodeCount: () => number
  getNode: (id: string) => NodeType | null
  getNodes: () => NodeType[]
  focusNode: (id: string) => void
  getDOMPosition: (id: string) => Position
  removeNode: (id:string) => void
  getNumConnections: (id:string) => number
}
