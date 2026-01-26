import NewTaskIco from '../../assets/NovaTarefaIcon.svg';
import GranbanIco from '../../assets/GranbanIcon.svg';
import ProjectsIco from '../../assets/ProjetosIcon.svg';
import NewProjectIco from '../../assets/NovoProjetoIcon.svg';
import FilterIcon from '../../assets/FilterIcon.svg';
import SearchIcon from '../../assets/SearchIcon.svg';
import OrderByIcon from '../../assets/OrderByIcon.svg';
import '../../style/Heading.css';

export function Heading({
    page,
    onFuncClick,
    onFilterClick,
    onOrderClick,
    onSearchChange,
    searchValue = '',
}) {
    const isGranban = page === 'Kanban pessoal';

    const pageIcon = page === 'Projetos' ? ProjectsIco : GranbanIco;
    const funcIcon = page === 'Projetos' ? NewProjectIco : NewTaskIco;

    return (
        <div className="heading-bar">
            <div className="heading-title">
                <button className="heading-title__icon" aria-hidden="true">
                    <img src={pageIcon} alt="" />
                </button>
                <h1>{page}</h1>
            </div>

            <div className="heading-actions">
                <button
                    type="button"
                    className="heading-btn"
                    onClick={onFilterClick}
                    aria-label="Filtrar"
                    title="Filtrar"
                >
                    <img src={FilterIcon} alt="Filtrar" />
                </button>

                <div className="heading-search">
                    <img src={SearchIcon} alt="Buscar" className="heading-search__icon" />
                    <input
                        type="search"
                        className="heading-search__input"
                        placeholder="Procurar"
                        value={searchValue}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        aria-label="Procurar"
                    />
                </div>

                <button
                    type="button"
                    className="heading-btn"
                    onClick={onOrderClick}
                    aria-label="Ordenar"
                    title="Ordenar"
                >
                    <img src={OrderByIcon} alt="Ordenar" />
                </button>

                <button
                    type="button"
                    className={`heading-btn heading-btn--primary${isGranban ? ' heading-btn--granban' : ''}`}
                    onClick={onFuncClick}
                    aria-label={isGranban ? 'Adicionar tarefa' : 'Ação'}
                    title={isGranban ? 'Adicionar tarefa' : 'Ação'}
                >
                    <img src={funcIcon} alt="Ação" />
                </button>
            </div>
        </div>
    );
}