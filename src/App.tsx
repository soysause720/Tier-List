import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ListWrapper from './component/ListWrapper'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListWrapper />} />
        <Route path="/share/:id" element={<ListWrapper />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
