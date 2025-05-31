import { type Dispatch, type SetStateAction } from "react"
import Autocomplete from "./Autocomplete"

export interface Actor {
    id: string,
    name: string,
    birthYear?: string
}

const ActorAutocomplete = ({ 
   onSelect 
 }: { 
    onSelect: (actor:Actor) => void
}) => {
   return (
        <Autocomplete<Actor>
            onSelect={onSelect}
            onQueryChange={async (query: string, setResults: Dispatch<SetStateAction<Actor[]>>) => {
                const results: { result: any }[] = await fetch(
                    `/api/explore/search?query=${encodeURIComponent(query)}`
                ).then(res => res.json())

                setResults(results.map(r => r.result))
            }}
            label="choose an actor"
            placeholder="keanu reeves"
            displayItem={(actor) => `${actor.name} ${actor.birthYear ? actor.birthYear : ''}`}
        />
   ) 
}

export default ActorAutocomplete