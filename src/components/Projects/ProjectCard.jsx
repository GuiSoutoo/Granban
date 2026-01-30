import GranbanLogoIcon from '../../assets/GranbanLogoIcon.svg';
import NovaTarefaIcon from '../../assets/NovaTarefaIcon.svg';
import InfoIcon from '../../assets/InfoIcon.svg';
import ArchivedIcon from '../../assets/ArchivedIcon.svg';
import { useNavigate } from 'react-router-dom';
import '../../style/Projetos.css';

const STATUS_ORDER = [
  { key: 'to-do', label: 'A fazer' },
  { key: 'in-progress', label: 'Em progresso' },
  { key: 'in-review', label: 'Revisão' },
  { key: 'rejected', label: 'Rejeitado' },
  { key: 'concluded', label: 'Concluído' },
  { key: 'archived', label: 'Arquivado', isArchived: true },
];

export default function ProjectCard({ project, counts, onInfo }) {
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
          {STATUS_ORDER.map(({ key, label, isArchived }) => (
            <div key={key} className="project-card__statusItem" title={label}>
              {isArchived ? (
                <img className="project-card__archivedIcon" src={ArchivedIcon} alt="" aria-hidden="true" />
              ) : (
                <span className={`project-card__dot dot--${key}`} aria-hidden="true" />
              )}
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
                if (typeof onInfo === 'function') onInfo(project);
              }}
            >
              <img className="project-card__iconImg" src={InfoIcon} alt="" />
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
