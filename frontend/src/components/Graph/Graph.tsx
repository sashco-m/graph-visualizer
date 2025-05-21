import { useEffect, useImperativeHandle, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import { OPTIONS } from "./Graph.options"


export interface GraphProps {
  onNodeClick: (id:string) => void
  ref: React.RefObject<GraphHandle | null> 
}

export interface NodeType {
  id: string,
  label: string
  x?: number,
  y?: number,
  fixed?: boolean,
}

export interface EdgeType {
  id: string
  from: string,
  to:string,
  label: string
}

export interface GraphHandle {
  addData: (nodes: NodeType[], edges: EdgeType[], rootId?: string) => void
}

const Graph = ({
  onNodeClick,
  ref
}: GraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network>(null)
  const nodeDS = useRef<DataSet<NodeType, "id">>(new DataSet([]))
  const edgeDS = useRef<DataSet<EdgeType, "id">>(new DataSet([]))
  
    // give ref to the network 
    useImperativeHandle(ref, () => ({
      addData: (nodes: NodeType[], edges: EdgeType[], rootId?: string) => {
        if(!networkRef.current) return

        // find all the unique added nodes/edges
        const existingNodeIds = new Set(nodeDS.current.getIds())
        const existingEdgeIds = new Set(edgeDS.current.getIds())
        const nodesToAdd = nodes.filter(n => !existingNodeIds.has(n.id))
        const edgesToAdd = edges.filter(e => !existingEdgeIds.has(e.id))

        edgeDS.current.update(edgesToAdd);

        const rootPosition = rootId ? networkRef.current.getPosition(rootId) : { x:0, y:0 }
          
        nodeDS.current.add(nodesToAdd.map(n => ({
          ...n,
          x: rootPosition.x + (Math.random() * 200 - 100),
          y: rootPosition.y + (Math.random() * 200 - 100)
        })))

      }
    }));
  
  // mount/unmount useeffect
  useEffect(()=> {
    if(!containerRef.current) return

    networkRef.current = new Network(
      containerRef.current,
      {
        nodes: nodeDS.current,
        edges: edgeDS.current
      },
      OPTIONS
    )

    // destroy on unmount
    return () => 
      networkRef.current!.destroy()

  }, [])

  // add the click handler
  useEffect(() => {
    if(!networkRef.current) return

    const handleClick = (params: { nodes: string[]; }) => {
      const nodeId = params.nodes[0];
      if (nodeId) onNodeClick(nodeId);
    }

    networkRef.current.on('click', handleClick);

    return () => 
      networkRef.current?.off('click', handleClick)

  }, [onNodeClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  )
}

export default Graph