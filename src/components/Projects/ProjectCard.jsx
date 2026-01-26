import GranbanLogoIcon from '../../assets/GranbanLogoIcon.svg';
import NovaTarefaIcon from '../../assets/NovaTarefaIcon.svg';
import { useNavigate } from 'react-router-dom';
import '../../style/Projetos.css';

const STATUS_ORDER = [
  { key: 'to-do', label: 'A fazer' },
  { key: 'in-progress', label: 'Em progresso' },
  { key: 'in-review', label: 'Revisão' },
  { key: 'rejected', label: 'Rejeitado' },
  { key: 'concluded', label: 'Concluído' },
];

export default function ProjectCard({ project, counts }) {
  const navigate = useNavigate();
  const coverUrl = project?.coverUrl || project?.cover || project?.imageUrl || '';
  const projectId = project?.id;
  const projectName = project?.name || '';
  const projectSlug = project?.slug || '';

  const goToProjectBoard = (opts = {}) => {
    if (!projectId) return;
    navigate(`/Granban/${projectSlug || projectId}`, {
      state: {
        projectId,
        projectName,
        openNewTask: !!opts.openNewTask,
      },
    });
  };

  return (
    <div className="project-card" role="article" onClick={() => goToProjectBoard()}>
      <div className="project-card__cover">
        {coverUrl ? (
          <img className="project-card__coverImg" src={coverUrl} alt="" />
        ) : (
          <div className="project-card__coverPlaceholder" aria-hidden="true">
            <img src={GranbanLogoIcon} alt="" />
          </div>
        )}
      </div>

      <div className="project-card__body">
        <div className="project-card__statusRow" aria-label="Resumo de tarefas por status">
          {STATUS_ORDER.map(({ key, label }) => (
            <div key={key} className="project-card__statusItem" title={label}>
              <span className={`project-card__dot dot--${key}`} aria-hidden="true" />
              <span className="project-card__count">{counts?.[key] ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="project-card__footer">
          <h3 className="project-card__title">{project?.name || 'Sem título'}</h3>

          <div className="project-card__actions">
            <button
              type="button"
              className="project-card__iconBtn project-card__iconBtn--info"
              aria-label="Informações"
              title="Informações"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" fill="currentColor"/>
                <path d="M12 11v6" stroke="#1D0D32" strokeWidth="2.4" strokeLinecap="round"/>
                <path d="M12 7.25h.01" stroke="#1D0D32" strokeWidth="3.4" strokeLinecap="round"/>
              </svg>
            </button>

            <button
              type="button"
              className="project-card__iconBtn"
              aria-label="Adicionar task"
              title="Adicionar task"
              onClick={(e) => {
                e.stopPropagation();
                goToProjectBoard({ openNewTask: true });
              }}
            >
              <img className="project-card__iconImg" src={NovaTarefaIcon} alt="" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
