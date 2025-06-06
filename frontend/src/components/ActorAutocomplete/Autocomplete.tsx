import { useEffect, useState, type FormEvent, type Dispatch, type SetStateAction } from "react"

export interface AutocompleteProps<T> {
    dropdownDirection?: 'UP' | 'DOWN'
    onSelect: (item: T) => void
    onQueryChange: (query: string, setResults: Dispatch<SetStateAction<T[]>>) => void
    label: string
    placeholder: string
    displayItem: (item: T) => string
}

function Autocomplete<T extends { id: string }>({ 
   onSelect,
   onQueryChange,
   label,
   placeholder,
   displayItem,
   // could be calculated using getBoundingClientRect
   dropdownDirection = 'DOWN'
 }: AutocompleteProps<T>) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<T[]>([])
    const [showDropdown, setShowDropdown] = useState(false)

    useEffect(() => {
        if(query === ""){
            setResults([])
            setShowDropdown(false)
            return
        }
        onQueryChange(query, setResults)

        setShowDropdown(true)
    }, [query])

    const formSubmit = (e:FormEvent) => {
        e.preventDefault()
        onSelect(results[0])
        setShowDropdown(false)
    }

    const handleSubmit = (item: T) => {
        onSelect(item) 
        setShowDropdown(false)
    }

    return (
        <form onSubmit={formSubmit} className="relative flex flex-col min-w-100">
            <label htmlFor="actor" className="text-left">{label}</label>
            <input 
                id="actor" name="actor" 
                placeholder={placeholder}
                className="border rounded w-full bg-[#242424]/80"
                required
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setShowDropdown(false)}
                autoComplete="off"
            />
            { (showDropdown && results.length > 0) && 
            <ul className={`absolute z-10 border rounded shadow-lg max-h-60 overflow-auto w-full ${
                dropdownDirection === 'DOWN' ? "top-full mt-2" : "bottom-full"
            }`}>
                {results.map((item) => (
                    <li
                        key={item.id}
                        className="px-4 py-2 cursor-pointer hover:bg-[#4E4E4E]/80 bg-[#242424]/80"
                        onMouseDown={(e) => {
                            e.preventDefault()
                            handleSubmit(item)
                        }}
                    >
                        {displayItem(item)}
                    </li>
                ))}
                </ul>
            }
        </form>
    )
}

export default Autocomplete