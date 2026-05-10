import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import DocView from './pages/DocView'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/doc/*" element={<DocView />} />
        </Route>
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: 'text-sm shadow-lg border border-border bg-background/95 backdrop-blur-md',
        }}
      />
    </>
  )
}
