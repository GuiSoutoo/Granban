import NewTaskIco from '../../assets/NovaTarefaIcon.svg';
import GranbanIco from '../../assets/GranbanIcon.svg';
import ProjectsIco from '../../assets/ProjetosIcon.svg';
import NewProjectIco from '../../assets/NovoProjetoIcon.svg';
import '../../style/Heading.css';
import ModalNewTask from '../Task/ModalNewTask.jsx';

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
                    <button
                        type="button"
                        className={`funcIcon${page.page === 'Kanban pessoal' ? ' funcIcon--granban' : ''}`}
                        onClick={page.onFuncClick}
                        aria-label={page.page === 'Kanban pessoal' ? 'Adicionar tarefa' : 'Ação'}
                        title={page.page === 'Kanban pessoal' ? 'Adicionar tarefa' : 'Ação'}
                    >
                        <img src={funcIcon} />
                    </button>
            </div>
    );
}