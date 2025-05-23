import { useCallback, useRef, useState } from 'react'
import './App.css'
import Graph from './components/Graph/Graph'
import InfoBar from './components/InfoBar'
import type { NodeType, GraphHandle } from './components/Graph/Graph.dto'
import type { Actor } from './components/ActorAutocomplete/ActorAutocomplete'
import ActorAutocomplete from './components/ActorAutocomplete/ActorAutocomplete'
import NodeModal from './components/NodeModal'

function App() {
  const [rootActor, setRootActor] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])
  const [nodeCount, setNodeCount] = useState(0)
  const [hoveredNode, setHoveredNode] = useState("")

  // graph
  const graphRef = useRef<GraphHandle>(null)

  const expandNode = useCallback(async (id: string) => {
    if(expanded.includes(id)) return

    const graphData = await fetch(
        `/api/explore/expand-node/${encodeURIComponent(id)}`
    ).then(res => res.json())

    const {newNodes, edges} = graphData

    graphRef.current?.addData(newNodes, edges, id)
    setExpanded((prev) => [id, ...prev])
    setNodeCount(graphRef.current?.getNodeCount() ?? 0)

  }, [expanded])

  const onSelectRoot = useCallback(async (root: Actor) => {
    setRootActor(root.id)

    graphRef.current?.clear()

    const graphData = await fetch(
          `/api/explore/expand-node/${encodeURIComponent(root.id)}`
      ).then(res => res.json())

    graphRef.current?.addData(
      [graphData.rootNode, ...graphData.newNodes], 
      graphData.edges,
    )

    setExpanded([root.id])
    setNodeCount(graphRef.current?.getNodeCount() ?? 0)
  }, [])

  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      <div className='absolute inset-0 z-0'>
        <Graph 
          ref={graphRef} 
          onNodeClick={expandNode} 
          onNodeBlur={() => setHoveredNode("")}
          onNodeHover={(id: string) => setHoveredNode(id)}
          />
        <NodeModal
          node={graphRef.current?.getNode(hoveredNode) ?? null}
          getDOMPosition={graphRef.current?.getDOMPosition ?? (()=>({ x: 0, y: 0}))}
          isExpanded={expanded.includes(hoveredNode)}
          onUnexpand={(id) => {
            graphRef.current?.removeNode(id)
            setExpanded(expanded.filter(e => e !== id))}
          }
          numConnections={graphRef.current?.getNumConnections(hoveredNode) ?? 0}
        />
      </div>

      <div 
        className={`absolute w-full flex flex-col items-center transition-transform duration-1200 z-10 ${
          !rootActor ? 'translate-y-100' : 'translate-y-10'
        }`}
      >
        <ActorAutocomplete onSelect={onSelectRoot}/>
      </div>
      
        <div className={`absolute h-1/4 w-full bottom-0 p-10 transition transform duration-2000 ${!rootActor ? 'translate-y-100 invisible' : 'visible'}`}>
          <InfoBar 
            nodeCount={nodeCount} 
            expanded={expanded} 
            getNode={graphRef.current?.getNode ?? (() => null)}
            getNodes={graphRef.current?.getNodes ?? (()=>[])}
            focusNode={graphRef.current?.focusNode ?? (()=>null)}
          />
        </div>
    </div>
  )
}

export default App
