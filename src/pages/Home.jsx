import { Link } from "react-router-dom";
import { Navbar } from "../components/Layout/Navbar";
import NovoProjetoIcon from "../assets/NovoProjetoIcon.svg";
import NovaTarefaIcon from "../assets/NovaTarefaIcon.svg";
import GranbanIcon from "../assets/GranbanIcon.svg";
import ProjetosIcon from "../assets/ProjetosIcon.svg";
import "../style/Home.css";

export default function Home() {
    return (
        <>
            <Navbar />
            <main className="home-hero">
                <h1 className="home-title">
                    Bem vindo(a), <span>Nome</span>
                </h1>
                <h2 className="home-subtitle">O que deseja fazer?</h2>

                <div className="home-actions">
                    <Link to="#" className="home-action-link">
                        <img src={NovoProjetoIcon} alt="Novo projeto" />
                        <span>Novo projeto</span>
                    </Link>

                    <Link to="#" className="home-action-link">
                        <img src={NovaTarefaIcon} alt="Nova tarefa" />
                        <span>Nova tarefa</span>
                    </Link>

                    <Link to="/Granban" className="home-action-link">
                        <img src={GranbanIcon} alt="Granban" />
                        <span>Granban</span>
                    </Link>

                    <Link to="#" className="home-action-link">
                        <img src={ProjetosIcon} alt="Projetos" />
                        <span>Projetos</span>
                    </Link>
                </div>
            </main>
        </>
    );
}