import { useEffect, useState } from 'react';
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
import { collection, doc, getDoc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Granban() {
  const { projectKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialProjectId = location?.state?.projectId || '';
  const initialProjectName = location?.state?.projectName || '';
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectName, setProjectName] = useState(initialProjectName);

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
    excluirTarefa,
    atualizarStatusTarefa,
    getTarefasPorColuna
  } = useTarefa(projectId, projectName);

  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [returnToDetailsTask, setReturnToDetailsTask] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [compactCards, setCompactCards] = useState(false);

  // Mantém o nome do projeto atualizado (caso não venha por state)
  // e também permite refletir renomes no header.
  useEffect(() => {
    if (!projectId) return;

    const unsub = onSnapshot(
      doc(db, 'projects', projectId),
      (snap) => {
        const name = snap.data()?.name;
        if (name) setProjectName(name);
      },
      () => {}
    );

    return () => {
      try { unsub(); } catch {}
    };
  }, [projectId]);

  const handleEdit = (task) => { setEditingTask(task); setShowEditModal(true); };
  const handleOpenDetails = (task) => { setDetailsTask(task); };
  const handleOpenReview = (task) => { setReviewTask(task); };
  const handleAddTask = () => {
    setDetailsTask(null);
    setReviewTask(null);
    setReturnToDetailsTask(null);
    setEditingTask(null);
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id;
    const newStatus = over.id;
    
    // Verifica se o over.id é uma coluna válida
    const isValidColumn = COLUNAS.some(col => col.id === newStatus);
    if (!isValidColumn) return;
    
    // Esconde o card temporariamente para evitar o "fantasma"
    setMovingTaskId(taskId);
    atualizarStatusTarefa(taskId, newStatus);
    
    // Limpa após um pequeno delay para garantir que o estado atualizou
    setTimeout(() => setMovingTaskId(null), 100);
  };

  return (
    <>
      <Navbar page="Granban"/>
      <div className="granban-container dark">
        <Heading
          page={projectId ? (projectName ? `Projeto: ${projectName}` : 'Projeto') : 'Kanban pessoal'}
          onFuncClick={handleAddTask}
          onExpandClick={() => setCompactCards((prev) => !prev)}
          isCompact={compactCards}
        />
        <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        </div>

        {showEditModal && (
          <ModalTask
            task={editingTask}
            onClose={handleCloseEditModal}
            onBack={returnToDetailsTask ? handleBackToDetails : undefined}
            projectId={projectId}
            projectName={projectName}
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
            onDelete={(task) => excluirTarefa(task.id)}
            onStatusChange={atualizarStatusTarefa}
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
            {COLUNAS.map(coluna => (
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
            ))}
          </div>
        </DndContext>
      </div>
    </>
  );
}

