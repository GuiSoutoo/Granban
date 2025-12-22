import NewTaskIco from '../../assets/NovaTarefaIcon.svg';
import GranbanIco from '../../assets/GranbanIcon.svg';
import ProjectsIco from '../../assets/ProjetosIcon.svg';
import NewProjectIco from '../../assets/NovoProjetoIcon.svg';
import '../../style/Heading.css';

export function Heading(page) {
    let pageIcon;
    let funcIcon;
    switch(page.page){
        case 'Projetos':
            pageIcon = ProjectsIco;
            funcIcon = NewProjectIco;
            break;
        case 'Kanban pessoal':
            pageIcon = GranbanIco;
            funcIcon = NewTaskIco;
            break;
    }
    
    return (
            <div className="heading">
                <div className="currentPage">
                    <button className="buttonGr"><img src={pageIcon} /></button>
                    <h1 className="h1">{page.page}</h1>
                </div>
                <button className="funcIcon buttonGr"><img src={funcIcon} /></button>
            </div>
    );
}