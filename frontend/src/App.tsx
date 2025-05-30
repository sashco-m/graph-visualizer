import { useCallback, useContext, useRef, useState } from 'react'
import './App.css'
import Graph from './components/Graph/Graph'
import InfoBar from './components/InfoBar'
import type { GraphHandle } from './components/Graph/Graph.dto'
import type { Actor } from './components/ActorAutocomplete/ActorAutocomplete'
import ActorAutocomplete from './components/ActorAutocomplete/ActorAutocomplete'
import NodeModal from './components/NodeModal'
import Sidebar from './components/Sidebar'
import { SettingsContext } from './context/SettingsContext'
import EdgeModal from './components/EdgeModal'

function App() {
  const [rootActor, setRootActor] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])
  const [nodeCount, setNodeCount] = useState(0)
  const [hoveredNode, setHoveredNode] = useState("")
  const [hoveredEdge, setHoveredEdge] = useState("")
  const [pointerPos, setPointerPos] = useState({ x:0, y:0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const { settings }= useContext(SettingsContext)

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
      graphData.edges
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
          onNodeHover={setHoveredNode}
          onEdgeHover={(id, pointer) => {
            setHoveredEdge(id)
            setPointerPos(pointer)
          }}
          onEdgeBlur={() => setHoveredEdge("")}
          />
        <NodeModal
          node={graphRef.current?.getNode(hoveredNode) ?? null}
          getDOMPosition={graphRef.current?.getDOMPosition ?? (()=>({ x: 0, y: 0}))}
          isExpanded={expanded.includes(hoveredNode)}
          numConnections={graphRef.current?.getNumConnections(hoveredNode) ?? 0}
        />
        <EdgeModal 
          edge={graphRef.current?.getEdge(hoveredEdge) ?? null}
          pointerPosition={pointerPos}
        />
      </div>

      <div className='absolute z-100'>
        <img className="w-12 h-12" src="public/burger_white.svg" onClick={()=>setMenuOpen(v => !v)}/>
      </div>

      <div 
        className={`absolute w-full flex flex-col items-center transition-transform duration-1200 z-10 ${
          !rootActor ? 'translate-y-100' : 'translate-y-10'
        }`}
      >
        <ActorAutocomplete onSelect={onSelectRoot}/>
        { !rootActor && 
          <div className="text-gray-400 text-sm italic p-2">hint: click a node to expand the graph</div>
        }
      </div>
      
      {
        !settings.hideBottomBar && <div className={`absolute w-full bottom-10 transition transform duration-2000 ${!rootActor ? 'translate-y-100 invisible' : 'visible'}`}>
          <InfoBar 
            nodeCount={nodeCount} 
            expanded={expanded} 
            getNode={graphRef.current?.getNode ?? (() => null)}
            getNodes={graphRef.current?.getNodes ?? (()=>[])}
            focusNode={graphRef.current?.focusNode ?? (()=>null)}
          />
        </div>
      }

      

      <Sidebar isOpen={menuOpen} />
    </div>
  )
}

export default App
