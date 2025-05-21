import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import ActorAutocomplete from './components/ActorAutocomplete'
import Graph, { type GraphHandle } from './components/Graph'

function App() {
  const [rootActor, setRootActor] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])

  // graph
  const graphRef = useRef<GraphHandle>(null)

  const expandNode = useCallback(async (id: string) => {
    if(expanded.includes(id)) return


    const graphData = await fetch(
        `/api/explore/expand-node/${encodeURIComponent(id)}`
    ).then(res => res.json())

    const {newNodes, edges} = graphData

    graphRef.current?.addData(newNodes, edges)
    setExpanded((prev) => [id, ...prev])

  }, [expanded])

  useEffect(() => {
    console.log(rootActor)
    if(!rootActor) return

    const initGraph = async () => {
      const graphData = await fetch(
          `/api/explore/expand-node/${encodeURIComponent(rootActor)}`
      ).then(res => res.json())

      graphRef.current?.addData(
        [graphData.rootNode, ...graphData.newNodes], 
        graphData.edges,
      )

      setExpanded([rootActor])
    }

    initGraph()
  }, [rootActor])

  return (
    <div className='relative w-screen h-screen overflow-hidden'>
      <div className='absolute inset-0 z-0'>
        <Graph ref={graphRef} onNodeClick={expandNode}/>
      </div>

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
