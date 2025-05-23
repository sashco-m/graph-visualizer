import { useEffect, useRef, useState } from "react"
import type { NodeType } from "./Graph/Graph.dto"
import type { Position } from "vis-network"

interface NodeModalProps {
    node: NodeType | null
    isExpanded: boolean
    numConnections: number
    onUnexpand: (id: string) => void
    getDOMPosition: (id: string) => Position
  }
  
  const NodeModal = ({ node, isExpanded, numConnections, onUnexpand, getDOMPosition }: NodeModalProps) => {
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const animationFrame = useRef<number>(-1)

    useEffect(() => {
      if (!node) return
  
      const updatePosition = () => {
        const position = getDOMPosition(node.id)
        setPos(position)
  
        animationFrame.current = requestAnimationFrame(updatePosition)
      }
  
      updatePosition()
  
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
        <div className="font-semibold">{node.label}</div>
        <div className="text-gray-400 text-xs">ID: {node.id}</div>
        <div>Connections: {numConnections}</div>
  
        {isExpanded && (
          <button
            onClick={() => onUnexpand(node.id)}
            className="mt-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
          >
            Collapse
          </button>
        )}
      </div>
    )
  }


export default NodeModal