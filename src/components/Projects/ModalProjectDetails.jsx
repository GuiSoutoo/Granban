import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import GranbanLogoIcon from '../../assets/GranbanLogoIcon.svg';
import EditProjetoIcon from '../../assets/DetalhesProjeto/EditProjeto.png';
import ArquivarProjetoIcon from '../../assets/DetalhesProjeto/ArquivarProjeto.png';
import TasksProjetosIcon from '../../assets/DetalhesProjeto/TasksProjetos.png';
import MembrosProjetosIcon from '../../assets/DetalhesProjeto/MembrosProjetos.png';
import { db } from '../../services/firebase';
import '../../style/Modal.css';
import '../../style/Projetos.css';

const STATUS_ORDER = [
  { key: 'to-do', label: 'A fazer' },
  { key: 'in-progress', label: 'Em progresso' },
  { key: 'in-review', label: 'Em revisão' },
  { key: 'rejected', label: 'Rejeitado' },
  { key: 'concluded', label: 'Concluído' },
];

function formatTimestamp(ts) {
  try {
    if (!ts) return '';
    const date = typeof ts?.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (Number.isNaN(date?.getTime?.())) return '';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

function chunkArray(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export default function ModalProjectDetails({ project, counts, onClose, onEdit }) {
  const coverUrl = project?.coverUrl || project?.cover || project?.imageUrl || '';
  const members = useMemo(() => {
    return Array.isArray(project?.members) ? project.members.filter(Boolean) : [];
  }, [project?.members]);
  const membersKey = useMemo(() => members.join('|'), [members]);

  const createdAtText = useMemo(() => {
    const ts = project?.createdAt || project?.updatedAt || null;
    return formatTimestamp(ts);
  }, [project?.createdAt, project?.updatedAt]);

  const totalTasks = useMemo(() => {
    if (!counts) return 0;
    return STATUS_ORDER.reduce((acc, s) => acc + (Number(counts?.[s.key]) || 0), 0);
  }, [counts]);

  const [memberDisplayList, setMemberDisplayList] = useState(() => members.map((email) => ({ key: email, label: 'Carregando...' })));

  useEffect(() => {
    let cancelled = false;

    async function loadMemberNames() {
      const emails = Array.isArray(members) ? members : [];
      setMemberDisplayList(emails.map((email) => ({ key: email, label: 'Carregando...' })));

      if (emails.length === 0) return;

      try {
        const byEmail = new Map();
        const usersCol = collection(db, 'users');

        // Firestore "in" aceita no máximo 10 valores.
        const batches = chunkArray(emails, 10);
        const snaps = await Promise.all(
          batches.map((batch) => getDocs(query(usersCol, where('email', 'in', batch))))
        );

        snaps.forEach((snap) => {
          snap.forEach((d) => {
            const data = d.data();
            const email = data?.email;
            const fullName = typeof data?.name === 'string' ? data.name.trim() : '';
            if (!email) return;
            if (fullName) byEmail.set(email, fullName);
          });
        });

        const list = emails.map((email) => ({
          key: email,
          label: byEmail.get(email) || 'Sem nome',
        }));

        if (!cancelled) setMemberDisplayList(list);
      } catch {
        if (!cancelled) {
          setMemberDisplayList(emails.map((email) => ({ key: email, label: 'Sem nome' })));
        }
      }
    }

    loadMemberNames();
    return () => {
      cancelled = true;
    };
  }, [membersKey]);

  return (
    <div className="modal-overlay">
      <div className="modal-details-wrap modal-projectDetails-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-details-card modal-projectDetails-card">
          <button type="button" className="modal-details-closeBtn modal-projectDetails-closeBtn" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </button>

          <div className="modal-projectDetails-cover">
            {coverUrl ? (
              <img className="modal-projectDetails-coverImg" src={coverUrl} alt="" />
            ) : (
              <div className="modal-projectDetails-coverPlaceholder" aria-hidden="true">
                <img src={GranbanLogoIcon} alt="" />
              </div>
            )}
          </div>

          <div className="modal-projectDetails-content">
            <div className="modal-projectDetails-topRow">
              <div className="modal-projectDetails-titleRow">
                <h2 className="modal-projectDetails-title">{project?.name || 'Sem título'}</h2>

                <button
                  type="button"
                  className="modal-projectDetails-iconBtn modal-projectDetails-iconBtn--edit"
                  title="Editar projeto"
                  aria-label="Editar projeto"
                  onClick={() => {
                    if (typeof onEdit === 'function') onEdit(project);
                  }}
                >
                  <img src={EditProjetoIcon} alt="" aria-hidden="true" />
                </button>

                <button type="button" className="modal-projectDetails-iconBtn" disabled title="Arquivar projeto (em breve)" aria-label="Arquivar projeto">
                  <img src={ArquivarProjetoIcon} alt="" aria-hidden="true" />
                </button>
              </div>

              <div className="modal-projectDetails-actions">
                <div className="modal-projectDetails-metric" title="Tasks no projeto">
                  <img className="modal-projectDetails-metricIcon" src={TasksProjetosIcon} alt="" aria-hidden="true" />
                  <span className="modal-projectDetails-metricValue">{totalTasks}</span>
                </div>

                <div className="modal-projectDetails-metric" title="Membros no projeto">
                  <img className="modal-projectDetails-metricIcon" src={MembrosProjetosIcon} alt="" aria-hidden="true" />
                  <span className="modal-projectDetails-metricValue">{members.length}</span>
                </div>
              </div>
            </div>

            <div className="modal-projectDetails-created">
              <span className="modal-projectDetails-createdLabel">Criado em</span>
              <span className="modal-projectDetails-createdValue">{createdAtText || '—'}</span>
            </div>

            <div className="modal-projectDetails-section">
              <div className="modal-projectDetails-sectionTitle">Equipe</div>
              {memberDisplayList.length ? (
                <div className="modal-projectDetails-chips">
                  {memberDisplayList.map((m) => (
                    <span key={m.key} className="modal-projectDetails-chip">{m.label}</span>
                  ))}
                </div>
              ) : (
                <div className="modal-projectDetails-empty">Sem membros.</div>
              )}
            </div>

            <div className="modal-projectDetails-section">
              <div className="modal-projectDetails-sectionTitle">Status</div>
              <div className="modal-projectDetails-statusList">
                {STATUS_ORDER.map(({ key, label }) => (
                  <div key={key} className="modal-projectDetails-statusItem">
                    <span className={`project-card__dot dot--${key}`} aria-hidden="true" />
                    <span className="modal-projectDetails-statusLabel">{label}</span>
                    <span className="modal-projectDetails-statusCount">{counts?.[key] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-details-divider modal-projectDetails-divider" />

            <div className="modal-projectDetails-section">
              <div className="modal-projectDetails-sectionTitle">Descrição</div>
              <div className="modal-details-description">{project?.description ? project.description : 'Sem descrição.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
