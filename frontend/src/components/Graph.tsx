import { useEffect, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"

const OPTIONS = {
            layout: {
                improvedLayout: false,
                randomSeed: 42
            },
            physics: {
                stabilization: false,
                solver: "forceAtlas2Based",
                forceAtlas2Based: {
                  gravitationalConstant: -50,
                  centralGravity: 0.01,
                  springLength: 50,
                  springConstant: 0.08,
                  damping: 0.9,
                },
                minVelocity: 0.75,
            },
            nodes: {
              shape: 'dot',
              size: 20,
              font: {
                size: 16,
                color: '#000',
              },
            },
            edges: {
              color: '#ccc',
            },
          };
export interface GraphProps {
    nodes: NodeType[],
    edges: EdgeType[],
    onNodeClick: (id:string) => void
}

export interface NodeType {
  id: string,
  label: string
  x?: number,
  y?: number
}

export interface EdgeType {
  id: string
  from: string,
  to:string,
  label: string
}

const Graph = ({
    nodes,
    edges,
    onNodeClick
}: GraphProps) => {
    const containerRef = useRef<HTMLDivElement>(null)
    
    const prevStateRef = useRef<{
        positions: Record<string, { x: number, y: number }>,
        view: { x: number, y: number },
        scale: number
      }>({
        positions: {},
        view: { x: 0, y: 0 },
        scale: 1
      });


    useEffect(()=> {
        if(!containerRef.current) return

        console.log('refresh network...')

        // previous render data 
        const { positions, scale, view } = prevStateRef.current

        // Rehydrate nodes: freeze existing, let new ones move
        const nodeDS = new DataSet<NodeType>(
            nodes.map((node) => {
            const pos = positions[node.id];
            return pos
                ? { ...node, x: pos.x, y: pos.y } //, fixed: { x: true, y: true } }
                : node; 
            })
        );
    
        const edgeDS = new DataSet<EdgeType>(edges);

        // init network
        const network = new Network(
            containerRef.current, 
            { 
                nodes: nodeDS,
                edges: edgeDS
            },
            OPTIONS
            )

        network.on('click', (params) => {
            const nodeId = params.nodes[0];
            if (nodeId) onNodeClick(nodeId);
            });

        // Restore view
        network.moveTo({ position: view, scale, animation: false });


        return () => {
            // TODO fix this somehow for strict mode
            //  not sure if possible since this can't really be a pure operation unless
            //  we provide position data, which means store it in the backend somehow
            // save positions before destruction?
            prevStateRef.current.positions = network.getPositions();
            prevStateRef.current.view = network.getViewPosition();
            prevStateRef.current.scale = network.getScale();
            // destroy
            network.destroy();
        }
    },[nodes, edges, onNodeClick])


    return (
        <div
            ref={containerRef}
            className="w-full h-full"
        />
    )
}

export default Graph