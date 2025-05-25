import { type Dispatch, type SetStateAction } from "react"
import type { Actor } from "./ActorAutocomplete/ActorAutocomplete"
import Autocomplete from "./ActorAutocomplete/Autocomplete"
import type { NodeType } from "./Graph/Graph.dto"

interface InfoBarProps {
    nodeCount: number,
    expanded: string[],
    getNode: (id: string) => NodeType | null
    getNodes: () => NodeType[]
    focusNode: (id: string) => void
}

// TODO - this is fine for v1 but this should become a sidebar
const InfoBar = ({
    nodeCount,
    focusNode,
    getNodes
}: InfoBarProps) => {
    return (
        <div className='flex justify-center'>
            <div className="border bg-[#242424]/80 rounded w-full xl:w-1/2 h-full flex p-5 justify-evenly sm:flex-row flex-col gap-4 relative">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold">{nodeCount}</h1>
                    <h3 className="text-md">nodes</h3>
                </div>

                <div className="flex flex-col">
                    <Autocomplete<Actor>
                        onSelect={(actor) => {
                            focusNode(actor.id)
                        }}
                        onQueryChange={async (query: string, setResults: Dispatch<SetStateAction<Actor[]>>) => {
                        const allNodes = getNodes()
                        const matchingNodes = allNodes
                            .filter(n => n.label.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 10)
                        
                        const actors = matchingNodes.map(n => ({id: n.id, name: n.label })) 
                        setResults(actors)
                        }}
                        label="search the graph"
                        placeholder=""
                        displayItem={(actor) => actor.name}
                    />
                </div>
            </div>
        </div>
    )
}

export default InfoBar