import { useEffect, useState } from 'react'
import './App.css'
import ActorAutocomplete from './components/ActorAutocomplete'

function App() {
  const [rootActor, setRootActor] = useState("")

  useEffect(() => {
    console.log(rootActor)
  }, [rootActor])

  return (
    <div className='flex flex-col items-center'>
      <div className={`flex flex-col items-center duration-1200 ${
        !rootActor ? "-translate-y-0" : "-translate-y-100"
      }`}>
        <ActorAutocomplete onSelect={(actor) => setRootActor(actor.id)}/>
      </div>
    </div>
  )
}

export default App
