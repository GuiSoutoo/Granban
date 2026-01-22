import { useState, useEffect } from 'react';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Modal.css';

export default function ModalTask({ task, onClose }) {
    const { adicionarTarefa, atualizarTarefa, excluirTarefa, loading } = useTarefa();
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

    function handleChange(e){
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    async function handleSubmit(e){
        e.preventDefault();

        if (isEditing) {
            await atualizarTarefa(task.id, formData);
        } else {
            await adicionarTarefa(formData);
        }

        setFormData({
            titulo: '',
            status: 'to-do',
            tag: '',
            prioridade: '',
            executor: '',
            dataEntrega: '',
            descricao: '',
        });
        onClose();
    }

    async function handleDelete(){
        if (!isEditing) return;

        const confirmed = window.confirm('Deseja excluir esta tarefa?');
        if (!confirmed) return;

        await excluirTarefa(task.id);
        onClose();
    }

    const createdInfo = isEditing
        ? `Criado em ${task?.criadoEm || '--/--/----'} por ${task?.criador || 'Nome do Criador'}`
        : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-edit-wrap" onClick={(e) => e.stopPropagation()}>
                <form className="modal-edit-card" onSubmit={handleSubmit}>
                    <header className="modal-edit-header">
                        <div className="modal-edit-headerLeft">
                            <span className="modal-edit-icon" aria-hidden="true">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" fill="currentColor" />
                                    <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83Z" fill="currentColor" />
                                </svg>
                            </span>
                            <div className="modal-edit-titleBlock">
                                <div className="modal-edit-title">{isEditing ? 'Editar tarefa' : 'Adicionar tarefa'}</div>
                                {isEditing ? (
                                    <div className="modal-edit-subtitle">{createdInfo}</div>
                                ) : null}
                            </div>
                        </div>
                    </header>

                    <section className="modal-edit-section">
                        <div className="modal-edit-titleBox">
                            <input
                                className="modal-edit-titleInput"
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                placeholder="Título"
                                required
                            />
                        </div>

                        <div className="modal-edit-fields">
                            <div className="modal-edit-row">
                                <label className="modal-edit-label">Prioridade</label>
                                <select
                                    className="modal-edit-pill"
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

                            <div className="modal-edit-row">
                                <label className="modal-edit-label">Prazo</label>
                                <div className="modal-edit-pillGroup">
                                    <input
                                        className="modal-edit-pill modal-edit-pillInput"
                                        type="datetime-local"
                                        name="dataEntrega"
                                        value={formData.dataEntrega}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-edit-row">
                                <label className="modal-edit-label">Status</label>
                                <select
                                    className="modal-edit-pill modal-edit-pillStatus"
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

                            <div className="modal-edit-row">
                                <label className="modal-edit-label">Executor</label>
                                <select
                                    className="modal-edit-pill"
                                    name="executor"
                                    value={formData.executor}
                                    onChange={handleChange}
                                >
                                    <option value="">Nome do Abençoado</option>
                                    <option value="usuario1">Usuário 1</option>
                                    <option value="usuario2">Usuário 2</option>
                                </select>
                            </div>

                            <div className="modal-edit-row modal-edit-rowTag">
                                <label className="modal-edit-label">Tag</label>
                                <div className="modal-edit-tagRowRight">
                                    <select
                                        className="modal-edit-pill"
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

                                    {isEditing ? (
                                        <button
                                            type="button"
                                            className="modal-edit-trash"
                                            onClick={handleDelete}
                                            aria-label="Excluir tarefa"
                                            title="Excluir"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="modal-edit-divider" />

                        <div className="modal-edit-description">
                            <textarea
                                className="modal-edit-descriptionInput"
                                name="descricao"
                                value={formData.descricao}
                                onChange={handleChange}
                                placeholder="Descrição"
                            />

                            <div className="modal-edit-attachment" aria-hidden="true">
                                <span className="modal-edit-attachmentIcon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 7a2 2 0 0 1 2-2h6l6 6v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="2" />
                                        <path d="M13 5v6h6" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </span>
                                <span className="modal-edit-attachmentName">IMG_3SA8SHFIA8S.png</span>
                            </div>
                        </div>
                    </section>

                    <footer className="modal-edit-footer">
                        <button type="button" className="modal-edit-btn modal-edit-btnCancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="modal-edit-btn modal-edit-btnSave"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
