import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Home from './pages/Home';
import Granban from './pages/Granban';
import Projetos from './pages/Projetos';
import RequireAuth from './routes/RequireAuth';

export function AppRoutes(){
    return(
      <Routes>
        <Route path='/login' element={<Login/>}/>
        <Route path='/cadastro' element={<Cadastro/>}/>
        <Route path='/' element={<RequireAuth><Home/></RequireAuth>}/>
        <Route path='/Granban' element={<RequireAuth><Granban/></RequireAuth>}/>
        <Route path='/Projetos' element={<RequireAuth><Projetos/></RequireAuth>}/>
      </Routes>
    )
}