import { useContext, useEffect, useImperativeHandle, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"
import { OPTIONS, physics_barnesHut, physics_forceAtlas2Based } from "./Graph.options"
import type { EdgeType, GraphProps, NodeType } from "./Graph.dto"
import { SettingsContext, type Settings } from "../../context/SettingsContext"

// TODO at higher zoom levels with clustering enabled, try and show an overall movie over all the edges
const Graph = ({
  onNodeClick,
  onNodeBlur,
  onNodeHover,
  ref
}: GraphProps) => {
  const { settings } = useContext(SettingsContext)

  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network>(null)
  const nodeDS = useRef<DataSet<NodeType, "id">>(new DataSet([]))
  const edgeDS = useRef<DataSet<EdgeType, "id">>(new DataSet([]))
  const movieToActors = useRef(new Map<string, Set<string>>())
  
    // give ref to the network 
    useImperativeHandle(ref, () => ({
      addData: (nodes: NodeType[], edges: EdgeType[], rootId?: string) => {
        if(!networkRef.current) return

        // find all the unique added nodes/edges
        const existingNodeIds = new Set(nodeDS.current.getIds())
        const existingEdgeIds = new Set(edgeDS.current.getIds())
        const nodesToAdd = nodes.filter(n => !existingNodeIds.has(n.id))
        const edgesToAdd = edges.filter(e => !existingEdgeIds.has(e.id))

        // Add invisible edges to increase attraction between nodes
        //  in the same movies
        // make this a toggle-able option since it hurts performance
        // TODO is this method better or vis js native clustering?
        const psudoEdges = nodesToAdd.reduce((acc, node) => {
          for(const movieId of node.movies){
            const relatedIds = movieToActors.current.get(movieId) ?? new Set()

            for(const otherId of relatedIds){
              // Skip if already directly connected
              const hasRealEdge = edgesToAdd.some(e =>
                (e.from === node.id && e.to === otherId) ||
                (e.from === otherId && e.to === node.id)
              );
              if (hasRealEdge) continue;

              const pseudoEdgeId = `pseudo-${[node.id, otherId].sort().join('-')}-${movieId}`;
              if (!edgeDS.current.get(pseudoEdgeId)) {
                acc.push({
                  id: pseudoEdgeId,
                  from: node.id,
                  to: otherId,
                  hidden: true,
                  length: 40,
                  springConstant: 0.015,
                });
              }
            }

            // Add this node to the movie mapping
            if (!movieToActors.current.has(movieId)) {
              movieToActors.current.set(movieId, new Set());
            }
            movieToActors.current.get(movieId)!.add(node.id)
          }
          return acc
        }, [] as EdgeType[])
        
        // TODO in edgesToAdd, see if there are multiple edges between the same 2 nodes
        //  make these edges dynamic or else they will overlap 
        edgesToAdd.push(...psudoEdges)
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
          const size = (curNode?.size ?? 16) + Math.log(cur[1]) * 10
          acc.push({ 
            id: cur[0],
            size,
            font: {
              size: (curNode?.font?.size ?? 14) + Math.log(cur[1]) * 10,
            },
            mass: Math.log(size)
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
      getNumConnections: (id:string) => {
        return edgeDS.current.get().reduce((acc, e) => {
          if(e.to != id && e.from != id) return acc
          if(e.hidden) return acc
          acc += 1
          return acc
        }, 0)
        // TODO add back better node remove function
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

  // update graph options with settings
  useEffect(() => {
    if (!networkRef.current) return

    function getGraphOptions(settings: Record<Settings, any>) {
      console.log(settings.physicsEngine)
      return {
        ...OPTIONS, // base config
        physics: settings.physicsEngine === "forceAtlas2Based"
          ? physics_forceAtlas2Based
          : physics_barnesHut,
        // more settings? add them here
      }
    }

    const updatedOptions = getGraphOptions(settings)
    networkRef.current.setOptions(updatedOptions)
     
  }, [settings])

  // add the click handler
  useEffect(() => {
    if(!networkRef.current) return

    const handleClick = (params: { nodes: string[]; }) => {
      const nodeId = params.nodes[0];
      if(!nodeId) return
      if (networkRef.current?.isCluster(nodeId)) {
        networkRef.current?.openCluster(nodeId)
        return
      }
      onNodeClick(nodeId);
    }

    networkRef.current.on('click', handleClick);

    return () => 
      networkRef.current?.off('click', handleClick)

  }, [onNodeClick])

  useEffect(() => {
    if(!networkRef.current) return

    const handleHover = (params: { node: string; }) => {
      const nodeId = params.node;
      if(!nodeId) return
      if (networkRef.current?.isCluster(nodeId)) return

      onNodeHover(nodeId);
    }

    networkRef.current.on('hoverNode', handleHover);

    return () => 
      networkRef.current?.off('hoverNode', handleHover)

  }, [onNodeHover])

  useEffect(() => {
    if(!networkRef.current) return

    const handleBlur= (params: { node: string }) => {
      const nodeId = params.node;
      if(!nodeId) return
      if (networkRef.current?.isCluster(nodeId)) return

      onNodeBlur(nodeId)
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