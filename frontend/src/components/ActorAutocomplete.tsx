import { useEffect, useState, type FormEvent } from "react"

interface Actor {
    id: string,
    name: string,
    birthYear: string
}

const ActorAutocomplete = ({ 
   onSelect 
 }: { 
    onSelect: (actor:Actor) => void
}) => {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Actor[]>([])
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        const search = async () => {
            if(query === ""){
                setResults([])
                setShowDropdown(false)
                return
            }

            const results = await fetch(
                `/api/explore/search?query=${encodeURIComponent(query)}`
            ).then(res => res.json())

            setResults(results.map(r => r.result))
            setShowDropdown(true)
        }

        search()
    }, [query])

    const formSubmit = (e:FormEvent) => {
        e.preventDefault()
        // TODO: auto submit the first one in the list?
    }

    const handleSubmit = (actor:Actor) => {
        onSelect(actor) 
        setShowDropdown(false)
    }

    return (
        <form onSubmit={formSubmit} className="relative flex flex-col min-w-100">
            <label htmlFor="actor" className="text-left">choose an actor</label>
            <input 
                id="actor" name="actor" 
                placeholder="Keanu" 
                className="border rounded w-full"
                required
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                autoComplete="off"
            />
            { (showDropdown && results.length > 0) && 
            <ul className="absolute z-10 mt-15 border rounded shadow-lg max-h-60 overflow-auto w-full">
                {results.map((actor) => (
                    <li
                        key={actor.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-400"
                        onClick={() => handleSubmit(actor)}
                    >
                    {actor.name} {actor.birthYear ? `(${actor.birthYear})` : ''}
                    </li>
                ))}
                </ul>
            }
        </form>
    )
}

export default ActorAutocomplete