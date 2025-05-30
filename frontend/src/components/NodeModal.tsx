import { useEffect, useRef, useState } from "react"
import type { NodeType } from "./Graph/Graph.dto"
import type { Position } from "vis-network"

interface NodeModalProps {
    node: NodeType | null
    isExpanded: boolean
    numConnections: number
    getDOMPosition: (id: string) => Position
  }
  
  const NodeModal = ({ node, isExpanded, numConnections, getDOMPosition }: NodeModalProps) => {
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const animationFrame = useRef<number>(-1)
    const [loading, setLoading] = useState(true)
    const [expandedAdds, setExpandedAdds] = useState(0)

    useEffect(() => {
      if (!node) return
  
      const updatePosition = () => {
        const position = getDOMPosition(node.id)
        setPos(position)
  
        animationFrame.current = requestAnimationFrame(updatePosition)
      }
  
      updatePosition()

      const getExpandedConnections = async () => {
        setLoading(true)
        const nodeData = await fetch(
            `/api/explore/node-connections/${encodeURIComponent(node.id)}`
        ).then(res => res.json())
        setExpandedAdds(nodeData.result)
        setLoading(false)
      }

      // show num of connections expected to add
      if(!isExpanded){
        getExpandedConnections()
      }
  
      return () => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
      }
    }, [node])
  
    if (!node) return null
  
    return (
      <div
        className="absolute bg-[#333] text-white text-sm rounded-lg shadow-md px-4 py-3 z-50"
        style={{ left: pos.x + 10, top: pos.y + 10 }}
      >
        <div className="font-semibold">{node.label} - {node.birthYear}</div>
        <div className="text-gray-400 text-xs">ID: {node.id}</div>
        <div>Connections: {numConnections}</div>
  
        {isExpanded && (
          <div
            className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Expanded
          </div>
        )}
        { !isExpanded && loading && (
          <div className="flex justify-center">
            <svg className="text-gray-300 animate-spin" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
              width="24" height="24">
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
              </path>
            </svg>
          </div>
        )}
        {!isExpanded && !loading && (
          <div
            className="mt-2 bg-green-600 text-white px-2 py-1 rounded text-sm"
          >
            Expanding adds: <b>{expandedAdds}</b>
          </div>
        )}
      </div>
    )
  }


export default NodeModal