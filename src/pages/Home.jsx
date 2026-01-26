import { useState } from 'react';
import { Link } from "react-router-dom";
import { Navbar } from "../components/Layout/Navbar";
import NovoProjetoIcon from "../assets/NovoProjetoIcon.svg";
import GranbanIcon from "../assets/GranbanIcon.svg";
import ProjetosIcon from "../assets/ProjetosIcon.svg";
import "../style/Home.css";
import ModalNewTask from "../components/Task/ModalNewTask";
import ModalNewProject from '../components/Projects/ModalNewProject';

export default function Home() {
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    return (
        <>
            <Navbar />
            <main className="home-hero">
                <h1 className="home-title">
                    Bem vindo(a), <span>Nome</span>
                </h1>
                <h2 className="home-subtitle">O que deseja fazer?</h2>

                <div className="home-actions">
                    <button
                        type="button"
                        className="home-action-link"
                        onClick={() => setShowNewProjectModal(true)}
                    >
                        <img src={NovoProjetoIcon} alt="Novo projeto" />
                        <span>Novo projeto</span>
                    </button>

                    <ModalNewTask className="home-action-link home-action-link--newtask" />
                        
                    <Link to="/Granban" className="home-action-link">
                        <img src={GranbanIcon} alt="Granban" />
                        <span>Granban</span>
                    </Link>

                    <Link to="/Projetos" className="home-action-link">
                        <img src={ProjetosIcon} alt="Projetos" />
                        <span>Projetos</span>
                    </Link>
                </div>
            </main>

            {showNewProjectModal && (
                <ModalNewProject onClose={() => setShowNewProjectModal(false)} />
            )}
        </>
    );
}