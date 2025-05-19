import { useEffect, useState } from 'react'
import './App.css'
import ActorAutocomplete from './components/ActorAutocomplete'
import Graph, { type EdgeType, type NodeType } from './components/Graph'

function App() {
  const [rootActor, setRootActor] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])
  const [nodes, setNodes] = useState<NodeType[]>([])
  const [edges, setEdges] = useState<EdgeType[]>([])

  useEffect(() => {
    console.log(rootActor)
    if(!rootActor) return

    const initGraph = async () => {
      const graphData = await fetch(
          `/api/explore/expand-node/${encodeURIComponent(rootActor)}`
      ).then(res => res.json())

      setNodes([graphData.rootNode, ...graphData.newNodes])
      setEdges(graphData.edges)
      setExpanded([rootActor])
    }

    initGraph()
  }, [rootActor])

  const expandNode = async (id: string) => {
    if(expanded.includes(id)) return

    const graphData = await fetch(
        `/api/explore/expand-node/${encodeURIComponent(id)}`
    ).then(res => res.json())

    const {newNodes, edges} = graphData

    setNodes((prev) => [...prev, ...newNodes.filter(n => !prev.some(p => p.id === n.id))])
    setEdges((prev) => [...prev, ...edges.filter(e => !prev.some(p => p.from === e.from && p.to === e.to))])
    setExpanded((prev) => [id, ...prev])
  }

  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      { nodes.length > 0 && 
      <div className='absolute inset-0 z-0'>
        <Graph nodes={nodes} edges={edges} onNodeClick={(id) => expandNode(id)}/>
      </div>
      }

      <div 
        className={`absolute w-full flex flex-col items-center transition-transform duration-1200 z-10 ${
          !rootActor ? 'translate-y-100' : 'translate-y-10'
        }`}
      >
        <ActorAutocomplete onSelect={(actor) => setRootActor(actor.id)}/>
      </div>
    </div>
  )
}

export default App
