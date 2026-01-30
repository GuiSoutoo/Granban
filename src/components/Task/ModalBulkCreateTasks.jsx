import { useState } from 'react';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Modal.css';
import '../../style/Task.css';

const MAX_TASKS = 10;

function createEmptyTask() {
  return {
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    executor: '',
    priority: 'Média',
    tag: 'Funcionalidade',
    dueDate: '',
  };
}

function BulkTaskRow({ task, index, onChange, onRemove, canRemove, teamMembers }) {
  return (
    <tr className="bulk-task-row">
      <td className="bulk-task-cell bulk-task-cell--index">{index + 1}</td>
      <td className="bulk-task-cell bulk-task-cell--title">
        <input
          type="text"
          className="bulk-task-input"
          placeholder="Título da tarefa"
          value={task.title}
          onChange={(e) => onChange(task.id, 'title', e.target.value)}
          maxLength={100}
        />
      </td>
      <td className="bulk-task-cell bulk-task-cell--executor">
        <select
          className="bulk-task-select"
          value={task.executor}
          onChange={(e) => onChange(task.id, 'executor', e.target.value)}
        >
          <option value="">Selecione</option>
          {teamMembers.map((member) => (
            <option key={member.username} value={member.username}>
              {member.name}
            </option>
          ))}
        </select>
      </td>
      <td className="bulk-task-cell bulk-task-cell--priority">
        <select
          className="bulk-task-select"
          value={task.priority}
          onChange={(e) => onChange(task.id, 'priority', e.target.value)}
        >
          <option value="Urgente">Urgente</option>
          <option value="Alta">Alta</option>
          <option value="Média">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
      </td>
      <td className="bulk-task-cell bulk-task-cell--tag">
        <select
          className="bulk-task-select"
          value={task.tag}
          onChange={(e) => onChange(task.id, 'tag', e.target.value)}
        >
          <option value="Funcionalidade">Funcionalidade</option>
          <option value="Bug">Bug</option>
          <option value="Layout">Layout</option>
          <option value="Alteração">Alteração</option>
          <option value="Melhoria">Melhoria</option>
          <option value="Essencial">Essencial</option>
          <option value="Remoção">Remoção</option>
        </select>
      </td>
      <td className="bulk-task-cell bulk-task-cell--date">
        <input
          type="date"
          className="bulk-task-input"
          value={task.dueDate}
          onChange={(e) => onChange(task.id, 'dueDate', e.target.value)}
        />
      </td>
      <td className="bulk-task-cell bulk-task-cell--actions">
        {canRemove && (
          <button
            type="button"
            className="bulk-task-remove"
            onClick={() => onRemove(task.id)}
            aria-label="Remover"
            title="Remover"
          >
            ×
          </button>
        )}
      </td>
    </tr>
  );
}

export default function ModalBulkCreateTasks({
  onClose,
  projectId,
  projectName,
  currentUser,
  teamMembers = [],
}) {
  const { adicionarTarefa } = useTarefa(projectId, projectName, currentUser);
  const [tasks, setTasks] = useState([createEmptyTask()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (taskId, field, value) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, [field]: value } : task))
    );
    setError('');
  };

  const handleRemove = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleAdd = () => {
    if (tasks.length >= MAX_TASKS) return;
    setTasks((prev) => [...prev, createEmptyTask()]);
  };

  const handleSave = async () => {
    const validTasks = tasks.filter((task) => task.title.trim());

    if (validTasks.length === 0) {
      setError('Adicione pelo menos uma tarefa com título');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Usa a mesma função adicionarTarefa do hook para manter consistência
      for (const task of validTasks) {
        const taskData = {
          title: task.title.trim(),
          status: 'to-do',
          executor: task.executor || '',
          description: '',
          priority: task.priority || 'Média',
          tag: task.tag || 'Funcionalidade',
          dueDate: task.dueDate || '',
        };

        await adicionarTarefa(taskData, { projectId, projectName });
      }

      onClose();
    } catch (err) {
      console.error('Erro ao criar tarefas:', err);
      setError('Erro ao criar tarefas. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const canAddMore = tasks.length < MAX_TASKS;

  return (
    <div className="modal-overlay">
      <div className="modal-task-container modal-bulk-container">
        <div className="modal-task-header">
          <h2 className="modal-task-title">Criar tarefas em massa</h2>
          <button
            type="button"
            className="modal-task-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="modal-bulk-content">
          <div className="modal-bulk-info">
            {projectId ? (
              <p className="modal-bulk-project">
                Projeto: <strong>{projectName || 'Sem nome'}</strong>
              </p>
            ) : (
              <p className="modal-bulk-project">Tarefas pessoais</p>
            )}
            <p className="modal-bulk-count">
              {tasks.length} / {MAX_TASKS} tarefas
            </p>
          </div>

          <div className="modal-bulk-table-wrapper">
            <table className="bulk-task-table">
              <thead>
                <tr>
                  <th className="bulk-task-header">#</th>
                  <th className="bulk-task-header">Título*</th>
                  <th className="bulk-task-header">Executor</th>
                  <th className="bulk-task-header">Prioridade</th>
                  <th className="bulk-task-header">Tag</th>
                  <th className="bulk-task-header">Data</th>
                  <th className="bulk-task-header"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <BulkTaskRow
                    key={task.id}
                    task={task}
                    index={index}
                    onChange={handleChange}
                    onRemove={handleRemove}
                    canRemove={tasks.length > 1}
                    teamMembers={teamMembers}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="modal-bulk-error">{error}</p>}

          <div className="modal-bulk-actions">
            <button
              type="button"
              className="modal-bulk-btn modal-bulk-btn--add"
              onClick={handleAdd}
              disabled={!canAddMore || saving}
            >
              + Adicionar linha
            </button>
            <div className="modal-bulk-actions-right">
              <button
                type="button"
                className="modal-bulk-btn modal-bulk-btn--cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-bulk-btn modal-bulk-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Criar tarefas'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
