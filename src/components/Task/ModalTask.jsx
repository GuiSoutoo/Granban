import { useEffect, useState } from 'react';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Modal.css';

export default function ModalTask({ task, onClose, onBack }) {
  const { adicionarTarefa, atualizarTarefa, loading } = useTarefa();
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
                style={{ width: 42, height: 42 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="modal-details-tagWrap">
                <div className="modal-details-tag">
                  {isEditing ? 'Editar tarefa' : 'Nova tarefa'}
                </div>
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
            className="modal-details-title"
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            placeholder="Título da tarefa"
            required
          />

          {/* META */}
          <div className="modal-details-meta">
            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Prioridade</span>
              <select
                className="modal-details-metaValue"
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
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Prazo</span>
              <input
                className="modal-details-metaValue"
                type="datetime-local"
                name="dataEntrega"
                value={formData.dataEntrega}
                onChange={handleChange}
              />
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Status</span>
              <select
                className={`modal-details-statusSelect status--${formData.status}`}
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
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Executor</span>
              <select
                className="modal-details-metaValue"
                name="executor"
                value={formData.executor}
                onChange={handleChange}
              >
                <option value="">Selecione</option>
                <option value="Raica">Raica</option>
                <option value="Wilho">Wilho</option>
              </select>
            </div>

            <div className="modal-details-metaRow">
              <span className="modal-details-metaLabel">Tag</span>
              <select
                className="modal-details-metaValue"
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
            </div>
          </div>

          <div className="modal-details-divider" />

          {/* DESCRIPTION */}
          <textarea
            className="modal-details-description"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descrição da tarefa"
          />

          {/* FOOTER */}
          <div className="modal-details-actions" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="modal-details-iconBtn"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="modal-details-iconBtn"
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
