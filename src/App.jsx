import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StationDetails from './pages/StationDetails';



function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/station-details" element={<StationDetails />} />
        

      </Routes>
    </BrowserRouter>
  );
}

export default App;
