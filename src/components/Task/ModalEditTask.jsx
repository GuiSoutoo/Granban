import { useState, useEffect } from 'react';
import { useTarefa } from '../../hooks/UseTarefas';
import '../../style/Modal.css';

export default function ModalEditTask({ task, onClose }) {
    const { atualizarTarefa, loading } = useTarefa();
    const [formData, setFormData] = useState({
        titulo: '',
        status: 'todo',
        tag: '',
        executor: '',
        dataEntrega: '',
        descricao: '',
    });

    useEffect(() => {
        if (task) {
            setFormData({
                titulo: task.titulo || '',
                status: task.status || 'todo',
                tag: task.tag || '',
                executor: task.executor || '',
                dataEntrega: task.dataEntrega || '',
                descricao: task.descricao || '',
            });
        }
    }, [task]);

    function handleChange(e){
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    async function updateTask(e){
        e.preventDefault();

        await atualizarTarefa(task.id, formData); 

        onClose();
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content-granban">
                    <div className="modal-header">
                        <div className="modal-header-title">
                            <i className="bi bi-pencil-square"></i>
                            <span>Editar Tarefa</span>
                        </div>
                        <button
                            type="button"
                            className="btn-close-custom"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="modal-body">
                        <form onSubmit={updateTask}>
                    <div className="form-group">
                        <label>Título da tarefa</label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleChange}
                            placeholder="Digite o título"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="todo">A fazer</option>
                                <option value="em-progresso">Em progresso</option>
                                <option value="revisao">Revisão</option>
                                <option value="rejeitado">Rejeitado</option>
                                <option value="concluido">Concluído</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tag</label>
                            <select
                                name="tag"
                                value={formData.tag}
                                onChange={handleChange}
                            >
                                <option value="">Selecione uma tag</option>
                                <option value="urgent">Urgente</option>
                                <option value="importante">Importante</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Executor</label>
                            <select
                                name="executor"
                                value={formData.executor}
                                onChange={handleChange}
                            >
                                <option value="">Nome do Usuário</option>
                                <option value="usuario1">Usuário 1</option>
                                <option value="usuario2">Usuário 2</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Data de entrega</label>
                            <input
                                type="datetime-local"
                                name="dataEntrega"
                                value={formData.dataEntrega}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            placeholder="Digite uma descrição"
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-submit"
                        disabled={loading}  
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
                    </div>
                </div>
            </div>
        </div>
    );
}