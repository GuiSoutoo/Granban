import { useEffect, useMemo, useRef, useState } from 'react';
import { Column } from '../components/Board/Column';
import { useTarefa } from '../hooks/UseTarefas';
import { COLUNAS } from '../constants/boardConfig';
import '../style/Granban.css';
import { Heading } from '../components/Layout/Heading';
import { Navbar } from '../components/Layout/Navbar';
import ModalTask from '../components/Task/ModalTask';
import ModalTaskDetails from '../components/Task/ModalTaskDetails';
import ModalTaskReview from '../components/Task/ModalTaskReview';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCurrentUser, getUserProfile, onAuthChange } from '../services/auth';
import AddMemberIcon from '../assets/DetalhesProjeto/AdicionarMembro.png';
import ModalManageTeam from '../components/Projects/ModalManageTeam';
import ModalInviteMember from '../components/Projects/ModalInviteMember';

export default function Granban() {
  const { projectKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialProjectId = location?.state?.projectId || '';
  const initialProjectName = location?.state?.projectName || '';
  const openTaskKey = location?.state?.openTaskKey || '';
  const openTaskId = location?.state?.openTaskId || '';
  const openTaskProjectId = location?.state?.openTaskProjectId || '';
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectName, setProjectName] = useState(initialProjectName);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [modalProjectId, setModalProjectId] = useState(initialProjectId);
  const [modalProjectName, setModalProjectName] = useState(initialProjectName);
  const [projectCoverUrl, setProjectCoverUrl] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [projectCreatedBy, setProjectCreatedBy] = useState('');
  const [projectOwnerEmail, setProjectOwnerEmail] = useState('');
  const [projectOptionsOpen, setProjectOptionsOpen] = useState(false);
  const [projectOptionsPos, setProjectOptionsPos] = useState({ top: 0, left: 0 });
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [manageTeamOpen, setManageTeamOpen] = useState(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const projectOptionsMenuRef = useRef(null);
  const projectOptionsButtonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const applyUser = async (user) => {
      if (cancelled) return;
      if (!user) {
        setCurrentUserProfile(null);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (cancelled) return;

        const username = typeof profile?.username === 'string' ? profile.username.trim() : '';
        const name = typeof profile?.name === 'string' ? profile.name.trim() : (user.displayName || user.email || '');

        setCurrentUserProfile({
          uid: user.uid,
          email: user.email || '',
          username,
          name,
        });
      } catch (error) {
        if (cancelled) return;
        setCurrentUserProfile({
          uid: user.uid,
          email: user.email || '',
          username: '',
          name: user.displayName || user.email || '',
        });
      }
    };

    applyUser(getCurrentUser());
    const unsubscribe = onAuthChange((user) => {
      applyUser(user);
    });

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Ao sair do kanban de projeto e voltar para o pessoal, limpa o nome.
    if (!projectKey) {
      if (projectId) setProjectId('');
      if (projectName) setProjectName('');
      return;
    }

    // Se entrou via navegação com state, usa como nome inicial.
    if (initialProjectName && initialProjectName !== projectName) {
      setProjectName(initialProjectName);
    }
  }, [projectKey, projectId, initialProjectName, projectName]);

  // Resolve /Granban/:projectKey (slug ou id) -> projectId real
  useEffect(() => {
    if (!projectKey) return;

    // Se já temos o id via state, não precisa resolver.
    if (initialProjectId) {
      if (initialProjectId !== projectId) setProjectId(initialProjectId);
      return;
    }

    let cancelled = false;

    (async () => {
      // 1) tenta como docId
      const byId = await getDoc(doc(db, 'projects', projectKey));
      if (!cancelled && byId.exists()) {
        setProjectId(projectKey);
        const name = byId.data()?.name;
        if (name) setProjectName(name);
        return;
      }

      // 2) tenta por slug
      const q = query(collection(db, 'projects'), where('slug', '==', projectKey), limit(1));
      const snap = await getDocs(q);
      const first = snap.docs[0];
      if (!cancelled && first) {
        setProjectId(first.id);
        const name = first.data()?.name;
        if (name) setProjectName(name);
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projectKey, initialProjectId, projectId]);

  const {
    loading,
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  } = useTarefa(projectId, projectName, currentUserProfile);

  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [returnToDetailsTask, setReturnToDetailsTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [compactCards, setCompactCards] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!openTaskKey && !openTaskId) return;
    if (detailsTask) return;

    const allTasks = COLUNAS.flatMap((col) => getTarefasPorColuna?.(col.id) || []);
    const found = allTasks.find((task) => {
      if (openTaskKey) return task.uniqueKey === openTaskKey;
      if (openTaskProjectId) return task.id === openTaskId && task.projectId === openTaskProjectId;
      return task.id === openTaskId;
    });

    if (found) {
      setDetailsTask(found);
      const nextState = projectId ? { projectId, projectName } : {};
      navigate(location.pathname, { replace: true, state: nextState });
    }
  }, [
    loading,
    openTaskKey,
    openTaskId,
    openTaskProjectId,
    detailsTask,
    getTarefasPorColuna,
    projectId,
    projectName,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (showEditModal) return;
    setModalProjectId(projectId);
    setModalProjectName(projectName);
  }, [projectId, projectName, showEditModal]);

  // Mantém o nome do projeto atualizado (caso não venha por state)
  // e também permite refletir renomes no header.
  useEffect(() => {
    if (!projectId) return;

    const unsub = onSnapshot(
      doc(db, 'projects', projectId),
      (snap) => {
        const data = snap.data() || {};
        const name = data?.name;
        if (name) setProjectName(name);

        const coverUrl = data?.coverUrl || data?.cover || data?.imageUrl || '';
        setProjectCoverUrl(String(coverUrl || ''));

        const createdBy = typeof data?.createdBy === 'string' ? data.createdBy.trim() : '';
        setProjectCreatedBy(createdBy);

        const ownerEmail = typeof data?.ownerEmail === 'string' ? data.ownerEmail.trim() : '';
        setProjectOwnerEmail(ownerEmail);

        const members = Array.isArray(data?.members) ? data.members.filter(Boolean) : [];
        setProjectMembers(members);
      },
      () => {}
    );

    return () => {
      try { unsub(); } catch {}
    };
  }, [projectId]);

  const projectMembersKey = useMemo(() => (Array.isArray(projectMembers) ? projectMembers.join('|') : ''), [projectMembers]);

  const ownerEmail = useMemo(() => {
    const owner = String(projectOwnerEmail || '').trim();
    if (owner.includes('@')) return owner;

    const createdBy = String(projectCreatedBy || '').trim();
    if (createdBy.includes('@')) return createdBy;

     // Em projetos antigos, createdBy pode ser UID. Se o criador estiver logado,
     // assumimos o e-mail dele como owner (e fazemos backfill mais abaixo).
    const currentUid = String(currentUserProfile?.uid || '').trim();
    const currentEmail = String(currentUserProfile?.email || '').trim();
    if (currentUid && createdBy && createdBy === currentUid && currentEmail.includes('@')) {
      return currentEmail;
    }

    // Em projetos antigos, createdBy pode ser o displayName (nome/username).
    // Se bater com o usuário logado, consideramos ele como owner.
    const createdByLower = createdBy.toLowerCase();
    const currentUsernameLower = String(currentUserProfile?.username || '').trim().toLowerCase();
    const currentNameLower = String(currentUserProfile?.name || '').trim().toLowerCase();
    if (
      currentEmail.includes('@') &&
      createdByLower &&
      (createdByLower === currentUsernameLower || createdByLower === currentNameLower)
    ) {
      return currentEmail;
    }

    return Array.isArray(projectMembers) && projectMembers.length ? projectMembers[0] : '';
  }, [projectOwnerEmail, projectCreatedBy, projectMembersKey, currentUserProfile?.uid, currentUserProfile?.email]);

  const canInviteMembers = useMemo(() => {
    const currentEmail = String(currentUserProfile?.email || '').trim().toLowerCase();
    const owner = String(ownerEmail || '').trim().toLowerCase();
    return Boolean(projectId && currentEmail && owner && currentEmail === owner);
  }, [projectId, currentUserProfile?.email, ownerEmail]);

  // Backfill: se o projeto não tem ownerEmail e o criador (UID) abriu o projeto,
  // salvamos ownerEmail (e garantimos que ele está em members).
  useEffect(() => {
    if (!projectId) return;

    const existingOwner = String(projectOwnerEmail || '').trim();
    if (existingOwner) return;

    const createdBy = String(projectCreatedBy || '').trim();
    if (!createdBy) return;

    const currentUid = String(currentUserProfile?.uid || '').trim();
    const currentEmailRaw = String(currentUserProfile?.email || '').trim();
    if (!currentEmailRaw.includes('@')) return;

    // Se o projeto antigo tem createdBy como email, faz backfill de ownerEmail
    // quando o criador (email) estiver logado.
    if (createdBy.includes('@')) {
      const createdByLowerEmail = createdBy.toLowerCase();
      const currentLowerEmail = currentEmailRaw.toLowerCase();
      if (createdByLowerEmail !== currentLowerEmail) return;

      const members = Array.isArray(projectMembers) ? projectMembers : [];
      const hasMember = members.some((m) => String(m || '').trim().toLowerCase() === currentLowerEmail);
      const payload = hasMember
        ? { ownerEmail: currentEmailRaw }
        : { ownerEmail: currentEmailRaw, members: arrayUnion(currentEmailRaw) };

      updateDoc(doc(db, 'projects', projectId), payload).catch(() => {});
      return;
    }

    const createdByLower = createdBy.toLowerCase();
    const currentUsernameLower = String(currentUserProfile?.username || '').trim().toLowerCase();
    const currentNameLower = String(currentUserProfile?.name || '').trim().toLowerCase();

    const matchesByUid = Boolean(currentUid && createdBy === currentUid);
    const matchesByDisplayName = Boolean(
      createdByLower && (createdByLower === currentUsernameLower || createdByLower === currentNameLower)
    );

    if (!matchesByUid && !matchesByDisplayName) return;

    const currentEmail = currentEmailRaw.toLowerCase();
    const members = Array.isArray(projectMembers) ? projectMembers : [];
    const hasMember = members.some((m) => String(m || '').trim().toLowerCase() === currentEmail);

    const payload = hasMember
      ? { ownerEmail: currentEmailRaw }
      : { ownerEmail: currentEmailRaw, members: arrayUnion(currentEmailRaw) };

    updateDoc(doc(db, 'projects', projectId), payload).catch(() => {});
  }, [projectId, projectOwnerEmail, projectCreatedBy, currentUserProfile?.uid, currentUserProfile?.email, currentUserProfile?.username, currentUserProfile?.name, projectMembersKey]);

  useEffect(() => {
    let cancelled = false;

    function chunkArray(list, size) {
      const out = [];
      for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
      return out;
    }

    async function loadMembers() {
      if (!projectId || !projectMembers?.length) {
        setMemberProfiles([]);
        return;
      }

      const emails = projectMembers;

      try {
        const usersCol = collection(db, 'users');
        const batches = chunkArray(emails, 10);
        const snaps = await Promise.all(
          batches.map((batch) => getDocs(query(usersCol, where('email', 'in', batch))))
        );

        const byEmail = new Map();
        snaps.forEach((snap) => {
          snap.forEach((d) => {
            const data = d.data();
            const email = data?.email;
            if (!email) return;
            byEmail.set(email, {
              name: typeof data?.name === 'string' ? data.name.trim() : '',
              photoURL: typeof data?.photoURL === 'string' ? data.photoURL : '',
            });
          });
        });

        const list = emails
          .map((email) => {
            const info = byEmail.get(email);
            return {
              key: email,
              name: info?.name || '',
              photoURL: info?.photoURL || '',
            };
          })
          .filter((m) => m.name);

        if (!cancelled) setMemberProfiles(list);
      } catch {
        if (!cancelled) setMemberProfiles([]);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [projectId, projectMembersKey]);

  const handleEdit = (task) => {
    const targetProjectId = task?.projectId || projectId || '';
    const targetProjectName = task?.projectName || projectName || '';
    setModalProjectId(targetProjectId);
    setModalProjectName(targetProjectName);
    setEditingTask(task);
    setShowEditModal(true);
  };
  const handleOpenDetails = (task) => { setDetailsTask(task); };
  const handleOpenReview = (task) => { setReviewTask(task); };
  const handleAddTask = () => {
    setDetailsTask(null);
    setReviewTask(null);
    setReturnToDetailsTask(null);
    setEditingTask(null);
    setModalProjectId(projectId);
    setModalProjectName(projectName);
    setShowEditModal(true);
  };

  // Se vier da tela de projetos com openNewTask, já abre o modal.
  useEffect(() => {
    if (!location?.state?.openNewTask) return;
    setShowEditModal(true);

    // limpa o state para não reabrir ao navegar/voltar
    navigate(location.pathname, { replace: true, state: { projectId, projectName } });
  }, [location?.state?.openNewTask, location.pathname, navigate, projectId, projectName]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setReturnToDetailsTask(null);
    setEditingTask(null);
    setModalProjectId(projectId);
    setModalProjectName(projectName);
  };

  const handleBackToDetails = () => {
    if (!returnToDetailsTask) return;
    setShowEditModal(false);
    setDetailsTask(returnToDetailsTask);
    setReturnToDetailsTask(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const canAddTask = Boolean(projectId);

  const openProjectOptions = (event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    if (!rect) {
      setProjectOptionsPos({ top: 78, left: Math.max(16, window.innerWidth - 260) });
      setProjectOptionsOpen(true);
      return;
    }

    const menuWidth = 260;
    const gap = 10;
    const left = Math.min(
      Math.max(12, rect.right - menuWidth),
      Math.max(12, window.innerWidth - menuWidth - 12)
    );
    const top = rect.bottom + gap;
    setProjectOptionsPos({ top, left });
    setProjectOptionsOpen(true);
  };

  const handleToggleProjectOptions = (event) => {
    event?.stopPropagation?.();
    if (projectOptionsOpen) {
      setProjectOptionsOpen(false);
      return;
    }
    openProjectOptions(event);
  };

  useEffect(() => {
    if (!projectOptionsOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setProjectOptionsOpen(false);
    };

    const onPointerDown = (e) => {
      const menuEl = projectOptionsMenuRef.current;
      const btnEl = projectOptionsButtonRef.current;
      const target = e.target;

      if (menuEl && menuEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;

      setProjectOptionsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [projectOptionsOpen]);

  useEffect(() => {
    const lockScroll = projectOptionsOpen || confirmLeaveOpen || manageTeamOpen;
    if (!lockScroll) return;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [projectOptionsOpen, confirmLeaveOpen, manageTeamOpen]);

  const handleLeaveProject = async () => {
    if (!projectId) return;
    const email = currentUserProfile?.email || '';
    if (!email) return;
    const isLastMember = (Array.isArray(projectMembers) ? projectMembers.filter(Boolean).length : 0) <= 1;

    setLeaveLoading(true);
    try {
      if (isLastMember) {
        const tasksSnap = await getDocs(collection(db, 'projects', projectId, 'tasks'));
        await Promise.all(tasksSnap.docs.map((d) => deleteDoc(d.ref)));
        await deleteDoc(doc(db, 'projects', projectId));
      } else {
        await updateDoc(doc(db, 'projects', projectId), {
          members: arrayRemove(email),
        });
      }
      setConfirmLeaveOpen(false);
      setProjectOptionsOpen(false);
      navigate('/Projetos');
    } catch {
      // mantém o modal aberto caso falhe
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.data?.current?.docId;
    const taskProjectId = active.data?.current?.projectId || '';
    const dragId = active.id;
    const newStatus = over.id;
    if (!taskId) return;
    
    // Verifica se o over.id é uma coluna válida
    const isValidColumn = COLUNAS.some(col => col.id === newStatus);
    if (!isValidColumn) return;
    
    // Esconde o card temporariamente para evitar o "fantasma"
    setMovingTaskId(dragId);
    atualizarStatusTarefa(taskId, newStatus, { projectId: taskProjectId });
    
    // Limpa após um pequeno delay para garantir que o estado atualizou
    setTimeout(() => setMovingTaskId(null), 100);
  };

  return (
    <>
      <Navbar page="Granban"/>
      <div className="granban-container dark">
        {projectId ? (
          <div className="project-hero" aria-label="Capa do projeto">
            {projectCoverUrl ? (
              <>
                <div
                  className="project-hero__bg"
                  style={{ backgroundImage: `url(${projectCoverUrl})` }}
                  aria-hidden="true"
                />
                <img className="project-hero__img" src={projectCoverUrl} alt="" />
              </>
            ) : (
              <div className="project-hero__fallback" aria-hidden="true" />
            )}
            <div className="project-hero__overlay" aria-hidden="true" />
            <div className="project-hero__inner">
              <div className="project-hero__title">{projectName || 'Projeto'}</div>
            </div>
          </div>
        ) : null}

        <Heading
          page={projectId ? '' : 'Granban pessoal'}
          titleActions={projectId ? (
            <>
              <button
                type="button"
                className="heading-btn"
                aria-label="Mais opções"
                title="Mais opções"
                onClick={handleToggleProjectOptions}
                ref={projectOptionsButtonRef}
              >
                <span className="heading-threeDots" aria-hidden="true">•••</span>
              </button>
              <button
                type="button"
                className="heading-btn"
                aria-label="Adicionar membro"
                title="Adicionar membro"
                onClick={() => {
                  if (!canInviteMembers) return;
                  setInviteMemberOpen(true);
                }}
                disabled={!canInviteMembers}
              >
                <img src={AddMemberIcon} alt="" aria-hidden="true" />
              </button>
            </>
          ) : null}
          onFuncClick={canAddTask ? handleAddTask : undefined}
          onExpandClick={() => setCompactCards((prev) => !prev)}
          isCompact={compactCards}
        />

        {projectId && projectOptionsOpen ? (
          <div
            className="project-optionsMenu"
            role="dialog"
            aria-label="Opções do projeto"
            style={{ top: projectOptionsPos.top, left: projectOptionsPos.left }}
            ref={projectOptionsMenuRef}
          >
            <button
              type="button"
              className="project-optionsMenu__item"
              onClick={() => {
                setProjectOptionsOpen(false);
                setManageTeamOpen(true);
              }}
            >
              Gerenciar equipe
            </button>
            <div className="project-optionsMenu__divider" aria-hidden="true" />
            <button
              type="button"
              className="project-optionsMenu__item project-optionsMenu__item--danger"
              onClick={() => {
                setProjectOptionsOpen(false);
                setConfirmLeaveOpen(true);
              }}
            >
              Se retirar do projeto
            </button>
          </div>
        ) : null}

        <ModalManageTeam
          open={projectId && manageTeamOpen}
          onClose={() => setManageTeamOpen(false)}
          projectId={projectId}
          currentUserEmail={currentUserProfile?.email || ''}
          createdBy={projectCreatedBy}
          projectName={projectName}
          coverUrl={projectCoverUrl}
          tasksDoneCount={getTarefasPorColuna?.('concluded')?.length || 0}
          memberCount={(Array.isArray(projectMembers) ? projectMembers.length : 0)}
          members={projectMembers}
          memberProfiles={memberProfiles}
          ownerEmail={ownerEmail}
        />

        <ModalInviteMember
          open={projectId && inviteMemberOpen}
          onClose={() => setInviteMemberOpen(false)}
          projectId={projectId}
          projectName={projectName}
          coverUrl={projectCoverUrl}
          memberCount={(Array.isArray(projectMembers) ? projectMembers.length : 0)}
          inviter={currentUserProfile}
        />

        {projectId && confirmLeaveOpen ? (
          <div
            className="project-leaveConfirmOverlay"
            role="presentation"
          >
            <div
              className="project-leaveConfirmCard"
              role="dialog"
              aria-label="Confirmar saída do projeto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="modal-details-closeBtn project-leaveConfirmCloseBtn"
                onClick={() => setConfirmLeaveOpen(false)}
                aria-label="Fechar"
                title="Fechar"
                disabled={leaveLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className="project-leaveConfirmTitle">Sair do projeto?</div>
              <div className="project-leaveConfirmText">
                {(() => {
                  const memberCount = Array.isArray(projectMembers) ? projectMembers.filter(Boolean).length : 0;
                  if (memberCount <= 1) {
                    return 'Você é o último membro. Ao sair, este projeto será apagado do sistema.';
                  }
                  return 'Você tem certeza que deseja se retirar deste projeto?';
                })()}
              </div>
              <div className="project-leaveConfirmActions">
                <button
                  type="button"
                  className="project-leaveConfirmBtn"
                  onClick={() => setConfirmLeaveOpen(false)}
                  disabled={leaveLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="project-leaveConfirmBtn project-leaveConfirmBtn--danger"
                  onClick={handleLeaveProject}
                  disabled={leaveLoading}
                >
                  {leaveLoading ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {projectId ? (
          <div className="project-membersRow" aria-label="Membros do projeto">
            <div className="project-membersRow__avatars">
              {memberProfiles.map((m) => (
                <div key={m.key} className="project-memberAvatar" title={m.name} aria-label={m.name}>
                  {m.photoURL ? (
                    <img src={m.photoURL} alt="" />
                  ) : (
                    <span className="project-memberAvatar__fallback" aria-hidden="true">{String(m.name || '?').slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showEditModal && (
          <ModalTask
            task={editingTask}
            onClose={handleCloseEditModal}
            onBack={returnToDetailsTask ? handleBackToDetails : undefined}
            projectId={modalProjectId}
            projectName={modalProjectName}
            currentUser={currentUserProfile}
          />
        )}

        {detailsTask && (
          <ModalTaskDetails
            task={detailsTask}
            onClose={() => setDetailsTask(null)}
            onEdit={(task) => {
              setReturnToDetailsTask(task);
              setDetailsTask(null);
              handleEdit(task);
            }}
            onDelete={(task) => excluirTarefa(task.id, { projectId: task.projectId })}
            onStatusChange={(id, status, options) => atualizarStatusTarefa(id, status, options)}
          />
        )}

        {reviewTask && (
          <ModalTaskReview
            task={reviewTask}
            onClose={() => setReviewTask(null)}
            onStatusChange={atualizarStatusTarefa}
          />
        )}
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="board-granban">
            {!projectId && loading ? (
              <div className="board-loading" role="status" aria-live="polite">
                <span className="board-loading__spinner" aria-hidden="true" />
                <span className="board-loading__label">Carregando suas tarefas...</span>
              </div>
            ) : (
              COLUNAS.map(coluna => (
                <Column
                  key={coluna.id}
                  id={coluna.id}
                  title={coluna.titulo}
                  tasks={getTarefasPorColuna(coluna.id)}
                  onDelete={excluirTarefa}
                  onEdit={handleEdit}
                  onOpenDetails={handleOpenDetails}
                  onOpenReview={handleOpenReview}
                  movingTaskId={movingTaskId}
                  showOnlyTitle={compactCards}
                />
              ))
            )}
          </div>
        </DndContext>
      </div>
    </>
  );
}

