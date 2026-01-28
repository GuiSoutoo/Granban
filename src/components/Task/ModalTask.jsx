import { useEffect, useState } from 'react';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Modal.css';
import '../../style/Forms.css';
import ArrowSelectIcon from '../../assets/ArrowSelectIcon.svg';
import EditIcon from '../../assets/EditTaskIcon.svg';
import AddTaskIcon from '../../assets/NovaTarefaIcon.svg';
import { db } from '../../services/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

function chunkArray(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function getShortName(fullName = '') {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 2) return trimmed;
  return `${parts[0]} ${parts[1]}`;
}

export default function ModalTask({ task, onClose, onBack, projectId, projectName }) {
  const { adicionarTarefa, atualizarTarefa, loading } = useTarefa(projectId, projectName);
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    titulo: '',
    status: 'to-do',
    tag: '',
    prioridade: '',
    executor: '',
    dataEntrega: '',
    descricao: '',
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setTeamMembers([]);
      setLoadingMembers(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingMembers(true);
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (cancelled || !projectDoc.exists()) {
          if (!cancelled) {
            setTeamMembers([]);
            setLoadingMembers(false);
          }
          return;
        }

        const projectData = projectDoc.data();
        const members = Array.isArray(projectData?.members) ? projectData.members.filter(Boolean) : [];
        if (members.length === 0) {
          if (!cancelled) {
            setTeamMembers([]);
            setLoadingMembers(false);
          }
          return;
        }

        const usersCol = collection(db, 'users');
        const batches = chunkArray(members, 10);
        const emailToMember = new Map();

        const snaps = await Promise.all(
          batches.map((batch) => getDocs(query(usersCol, where('email', 'in', batch))))
        );

        snaps.forEach((snap) => {
          snap.forEach((userDoc) => {
            const data = userDoc.data();
            const email = data?.email;
            const username = typeof data?.username === 'string' ? data.username.trim() : '';
            const name = typeof data?.name === 'string' ? data.name.trim() : '';
            if (email && username) {
              emailToMember.set(email, {
                username,
                name: name || username,
              });
            }
          });
        });

        const memberList = members
          .map((email) => emailToMember.get(email))
          .filter(Boolean);

        if (!cancelled) {
          setTeamMembers(memberList);
          setLoadingMembers(false);
        }
      } catch (error) {
        console.error('Erro ao carregar membros do projeto:', error);
        if (!cancelled) {
          setTeamMembers([]);
          setLoadingMembers(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (isEditing && task) {
      setFormData({
        titulo: task.titulo || '',
        status: task.status || 'to-do',
        tag: task.tag || '',
        prioridade: task.prioridade || '',
        executor: task.executor || '',
        dataEntrega: task.dataEntrega || '',
        descricao: task.descricao || '',
      });
    }
  }, [task, isEditing]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-resize textarea
    if (e.target.tagName === 'TEXTAREA') {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isEditing) {
      await atualizarTarefa(task.id, formData);
    } else {
      await adicionarTarefa(formData);
    }

    onClose();
  }

  const createdLabel = task?.criadoEm || '-';
  const creatorLabel = task?.criador || 'Nome do Criador';
  const projectLabel = projectName || task?.projectName || '';
  const hasExecutorOption = Boolean(
    formData.executor && teamMembers.some((member) => member.username === formData.executor)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-details-wrap" onClick={(e) => e.stopPropagation()}>
        <form className="modal-details-card" onSubmit={handleSubmit}>

          {/* HEADER */}
          <div className="modal-details-header">
            <div className="modal-details-headerLeft">
              <div
                className="modal-details-appIcon"
                aria-hidden="true"
                style={{ width: isEditing ? 40 : 50, height: isEditing ? 40 : 50 }}
              >
                <img 
                  src={isEditing ? EditIcon : AddTaskIcon} 
                  alt={isEditing ? 'Editar' : 'Adicionar'} 
                  style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                />
              </div>

              <div className="modal-details-tagWrap">
                
                  {isEditing ? <div className="modal-details-tag">Editar tarefa</div> : <div className="modal-details-tag"><h4>Nova tarefa</h4></div>}

                {projectLabel ? (
                  <div className="modal-details-project">Projeto: {projectLabel}</div>
                ) : null}
                
                {isEditing && (
                  <div className="modal-details-created">
                    Criado em {createdLabel} por {creatorLabel}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TITLE */}
          <input
            className="modal-details-title task-input"
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Título da tarefa"
            required
          />

          {/* META */}
          <div className="modal-details-meta">
            <div className="tag-container">
              <span className="tag-label">Prioridade</span>
              <div className="select-wrapper">
                <select
                  className="tag-select"
                  name="prioridade"
                  value={formData.prioridade}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
                <img src={ArrowSelectIcon} alt="" className="select-arrow" />
              </div>
            </div>

            <div className="tag-container">
              <span className="tag-label">Prazo</span>
              <input
                className="tag-select"
                type="datetime-local"
                name="dataEntrega"
                value={formData.dataEntrega}
                onChange={handleChange}
              />
            </div>

            <div className="tag-container">
              <span className="tag-label">Status</span>
              <div className="select-wrapper">
                <select
                  className="tag-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="to-do">A fazer</option>
                  <option value="in-progress">Em progresso</option>
                  <option value="in-review">Revisão</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="concluded">Concluído</option>
                </select>
                <img src={ArrowSelectIcon} alt="" className="select-arrow" />
              </div>
            </div>

            <div className="tag-container">
              <span className="tag-label">Executor</span>
              <div className="select-wrapper">
                <select className="tag-select" value={formData.executor} onChange={handleChange} name="executor">
                  <option value="">Selecione</option>
                  {projectId ? (
                    loadingMembers ? (
                      <option disabled>Carregando...</option>
                    ) : teamMembers.length > 0 ? (
                      teamMembers.map((member) => (
                        <option key={member.username} value={member.username}>
                          {getShortName(member.name)}
                        </option>
                      ))
                    ) : (
                      <option disabled>Sem membros disponíveis</option>
                    )
                  ) : (
                    <>
                      <option value="Wilho">Wilho</option>
                      <option value="Raica">Raica</option>
                    </>
                  )}
                  {projectId && !loadingMembers && !hasExecutorOption && formData.executor ? (
                    <option value={formData.executor}>{formData.executor}</option>
                  ) : null}
                </select>
                <img src={ArrowSelectIcon} alt="" className="select-arrow" />
              </div>
            </div>

            <div className="tag-container">
              <span className="tag-label">Tag</span>
              <div className="select-wrapper">
                <select
                  className="tag-select"
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                >
                  <option value="">Selecione</option>
                  <option value="Bug">Bug</option>
                  <option value="Layout">Layout</option>
                  <option value="Alteração">Alteração</option>
                  <option value="Melhoria">Melhoria</option>
                  <option value="Essencial">Essencial</option>
                  <option value="Remoção">Remoção</option>
                  <option value="Funcionalidade">Funcionalidade</option>
                </select>
                <img src={ArrowSelectIcon} alt="" className="select-arrow" />
              </div>
            </div>
          </div>

          <div className="modal-details-divider" />

          {/* DESCRIPTION */}
          <textarea
            className="modal-details-description task-input"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Digite uma descrição da tarefa aqui, cole imagens para facilitar a instrução."
          />

          {/* FOOTER */}
          <div className="button-group">
            <button
              type="button"
              className="button-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button-confirm"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
