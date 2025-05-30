import { useEffect, useRef, useState } from "react"
import type { EdgeType } from "./Graph/Graph.dto"

interface EdgeModalProps {
    edge: EdgeType| null
    pointerPosition: {
        x: number,
        y: number
    }
  }
  
  const EdgeModal = ({ edge, pointerPosition }: EdgeModalProps) => {
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
    const animationFrame = useRef<number>(-1)

    useEffect(() => {
      if (!edge) return
  
      const updatePosition = () => {
        setPos(pointerPosition)
  
        animationFrame.current = requestAnimationFrame(updatePosition)
      }
  
      updatePosition()

      return () => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current)
      }
    }, [edge, pointerPosition])
  
    if (!edge) return null
  
    return (
      <div
        className="absolute bg-[#333] text-white text-sm rounded-lg shadow-md px-4 py-3 z-50 text-left"
        style={{ left: pos.x + 10, top: pos.y + 10 }}
      >
        <div className="font-semibold">in common:</div>
        <ul className="max-h-64 overflow-y-auto pr-2 space-y-2">
          {edge.inCommon?.map(ic => 
            <li key={ic.movieId}>
              <div>{ic.title} - {ic.year}</div>
              <div className="text-gray-400 text-xs">ID: {ic.movieId}</div>
            </li>
            )}
        </ul>
      </div>
    )
  }


export default EdgeModal 