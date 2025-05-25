import { useContext } from "react"
import { SettingsContext, tips, type Settings, options } from "../context/SettingsContext"

interface SidebarProps {
    isOpen: boolean
}

const Sidebar = ({isOpen}: SidebarProps) => {
    const { settings, setSetting } = useContext(SettingsContext)

    function parseOptionValue(value: string): string | boolean {
        if (value === "true") return true
        if (value === "false") return false
        return value
    }
      

    return <div className={`
        absolute w-full h-auto md:h-full md:w-1/4
        border-b md:border-b-0 md:border-r 
        transition transform p-5 z-20 bg-[#242424]/80
      ${isOpen? 
        'translate-y-0 md:translate-x-0' : 
        '-translate-y-full md:translate-y-0 md:-translate-x-full invisible'}
      `}>
        <div className="text-left flex flex-col gap-4">
            <ul className="flex flex-col gap-4 mt-8">
            { Object.entries(settings).map(([key, value]) => 
                <li key={key}>
                    <div>
                        <h3 className="font-bold">{key}</h3>
                        <h4 className="text-sm italic">{tips[key as Settings]}</h4>
                    </div>
                    <select 
                        className="border rounded mt-2" 
                        value={value}
                        onChange={(e) => setSetting(key as Settings, parseOptionValue(e.target.value))}
                    >
                        {options[key as Settings].map(o => 
                            <option key={`${key}-${o}`} value={String(o)}>
                                {`${o}`}
                            </option>)}
                    </select>
                </li>)
            }
            </ul>
            <div>
                <h3 className="font-bold">Tips</h3>
                <p>Clustering + barnesHut or no clustering + forceAtlas2Based both look good</p>
            </div>
            <div className="self-end">
                made by <a href="https://mistelbacher.ca">sashco mistelbacher</a>
            </div>
        </div>
      </div>
}

export default Sidebar