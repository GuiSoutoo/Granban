import { Heading } from "../components/Layout/Heading";
import { Navbar } from "../components/Layout/Navbar";
import '../style/Granban.css';

export default function Projetos(){
    return(
        <>
            <Navbar page="Projetos" />
            <div className="granban-container dark">
                <Heading page="Projetos" />
            </div>
        </>
    )
}