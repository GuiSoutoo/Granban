import { useState } from 'react';
import { Heading } from "../components/Layout/Heading";
import { Navbar } from "../components/Layout/Navbar";
import ModalNewProject from '../components/Projects/ModalNewProject';
import '../style/Granban.css';

export default function Projetos(){
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    return(
        <>
            <Navbar page="Projetos" />
            <div className="granban-container dark">
                <Heading page="Projetos" onFuncClick={() => setShowNewProjectModal(true)} />
            </div>

            {showNewProjectModal && (
                <ModalNewProject onClose={() => setShowNewProjectModal(false)} />
            )}
        </>
    )
}