import { createContext, useState, type ReactNode, useEffect } from "react"

export type Settings = "hideBottomBar" | "physicsEngine"

// options
export const options: Record<Settings, any[]> = {
    "hideBottomBar": [true, false],
    "physicsEngine": ["barnesHut", "forceAtlas2Based"],
}

    // tooltips
export const tips: Record<Settings, string> = {
    "hideBottomBar": "Hides the node count/search bar",
    "physicsEngine": "barnesHut is more stable while forceAtlas2Based flows nicer.",
}

const defaults:Record<Settings, any> = {
        "hideBottomBar": false,
        "physicsEngine": "barnesHut",
    }

interface SettingsContext {
    settings: Record<Settings, any>,
    setSetting: (key: Settings, val: any) => void
}

export const SettingsContext = createContext<SettingsContext>({
    settings: defaults,
    setSetting: () => {}
})

const SettingsProvider = ({ children }: { children: ReactNode}) => {
    const [settings, setSettings] = useState<Record<Settings, any>>(defaults)

    // run on mount, update settings with the values from localstorage
    useEffect(()=> {
        const storedSettings = localStorage.getItem('settings')

        if(!storedSettings){
            localStorage.setItem('settings', JSON.stringify(defaults))
            return
        }

        const parsedSettings: Record<Settings, any> = JSON.parse(storedSettings)
        setSettings(parsedSettings)
    }, [])

    const setSetting = (setting:Settings, value:any) => {
        const updated = { ...settings, [setting]: value }
        localStorage.setItem('settings', JSON.stringify(updated))
        setSettings(updated)
    }

    return <SettingsContext.Provider value={{
        settings,
        setSetting
    }}>{children}</SettingsContext.Provider>

}

export default SettingsProvider