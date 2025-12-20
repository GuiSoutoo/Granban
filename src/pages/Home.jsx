import { Link } from "react-router-dom"
import { Navbar } from "../components/Layout/Navbar"

export default function Home(){
    return(
        <>
            <Navbar />
            <div style={{textAlign: 'center', marginTop: '50px'}}>
                <h1>Bem-vindo ao Granban!</h1>
                <span>Gerencie suas tarefas de forma fácil.</span> <br/><br/>
                <Link to="/Granban">Acessar Tarefas</Link>
            </div>
        </>
    )
}