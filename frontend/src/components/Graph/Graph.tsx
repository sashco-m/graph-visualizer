import { useEffect, useImperativeHandle, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import { OPTIONS } from "./Graph.options"
import type { EdgeType, GraphProps, NodeType } from "./Graph.dto"

const Graph = ({
  onNodeClick,
  onNodeBlur,
  onNodeHover,
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

        // add nodes around the root if it exists
        const rootPosition = rootId ? networkRef.current.getPosition(rootId) : { x:0, y:0 }
          
        nodeDS.current.add(nodesToAdd.map(n => ({
          ...n,
          x: rootPosition.x + (Math.random() * 200 - 100),
          y: rootPosition.y + (Math.random() * 200 - 100)
        })))

        // update sizes of all nodes 
        const degreeMap = edgesToAdd.reduce((acc, cur) => {
          acc[cur.from] = (acc[cur.from] || 0) + 1
          acc[cur.to] = (acc[cur.to] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        const nodesToUpdate = Object.entries(degreeMap).reduce((acc, cur) => {
          const curNode = nodeDS.current.get(cur[0]) 
          acc.push({ 
            id: cur[0],
            size: (curNode?.size ?? 16) + Math.log(cur[1]) * 10,
            font: {
              size: (curNode?.font?.size ?? 14) + Math.log(cur[1]) * 10,
            }
          })
          return acc
        }, [] as Partial<NodeType>[])

        nodeDS.current.update(nodesToUpdate)
      },
      clear: () => {
        nodeDS.current.clear()
        edgeDS.current.clear()
      },
      getNodeCount: () => nodeDS.current.length,
      getNode: (id: string) => nodeDS.current.get(id),
      getNodes: () => nodeDS.current.get(),
      focusNode: (id: string) => {
        networkRef.current?.focus(id, { animation: true, scale: 1.25 })
        nodeDS.current.update({ id, color: { background: "#66ccff" }})
      },
      getDOMPosition: (id: string) =>  {
        const canvasPos = networkRef.current?.getPosition(id) ?? { x:0 ,y:0 }
        return networkRef.current?.canvasToDOM(canvasPos) ?? { x: 0, y: 0}
      },
      removeNode: (id:string) => {
        // find all neighborus
        const neighbours = edgeDS.current.get().reduce((acc, e) => {
          if(e.to != id && e.from != id) return acc
          const neighbour = e.to == id ? e.from : e.to
          acc.add(neighbour)
          return acc
        }, new Set<string>())

        console.log(neighbours)

        // need to see if their ONLY connections is id
        const nodesToRemove: string[] = []
        for(const n of neighbours.values()){
          console.log(n)
          const allNeighbours = edgeDS.current.get().reduce((acc, e) =>{
            if(e.to != n && e.from != n) return acc
            const neighbour = e.to == n ? e.from : e.to
            acc.push(neighbour)
            return acc
          }, [] as string[]) 
          if(allNeighbours.some((n) => n != id)) continue 

          nodesToRemove.push(n)
        }
        console.log(nodesToRemove)

        nodeDS.current.remove(nodesToRemove)
      },
      getNumConnections: (id:string) => {
        return edgeDS.current.get().reduce((acc, e) => {
          if(e.to != id && e.from != id) return acc
          acc += 1
          return acc
        }, 0)
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

  useEffect(() => {
    if(!networkRef.current) return

    const handleHover = (params: { node: string; }) => {
      const nodeId = params.node;
      if (nodeId) onNodeHover(nodeId);
    }

    networkRef.current.on('hoverNode', handleHover);

    return () => 
      networkRef.current?.off('hoverNode', handleHover)

  }, [onNodeHover])

  useEffect(() => {
    if(!networkRef.current) return

    const handleBlur= (params: { node: string }) => {
      const nodeId = params.node;
      if (nodeId) onNodeBlur(nodeId);
      // in case the node was focused
      nodeDS.current.update({ id: nodeId, color: { background: "#ffffff" }})
    }

    networkRef.current.on('blurNode', handleBlur);

    return () => 
      networkRef.current?.off('blurNode', handleBlur)

  }, [onNodeBlur])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  )
}

export default Graph