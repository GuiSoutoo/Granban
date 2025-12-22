import { useState } from 'react';

export default function ModalContent({ onClose }) {
    const [formData, setFormData] = useState({
            titulo: '',
            status: 'A fazer',
            tag: '',
            executor: '',
            dataEntrega: '',
            descricao: '',
    });
        
    function handleChange(e){
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    function createTask(e){
        e.preventDefault();
    }
        
    return (
        <div className="modal-content-granban">
            <div className="modal-header">
                <div className="modal-header-title">
                    <i className="bi bi-clipboard-plus"></i>
                    <span>Adicionar Tarefa</span>
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
                <form onSubmit={createTask}>
                    {/* Título da tarefa */}
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

                    {/* Status e Tag */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="A fazer">A fazer</option>
                                <option value="Em progresso">Em progresso</option>
                                <option value="Revisão">Revisão</option>
                                <option value="Rejeitado">Rejeitado</option>
                                <option value="Concluído">Concluído</option>
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

                    {/* Executor e Data de entrega */}
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

                    {/* Descrição */}
                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            placeholder="Digite uma descrição"
                        ></textarea>
                    </div>

                    {/* Botão */}
                    <button type="submit" className="btn-submit">
                        Criar tarefa
                    </button>
                </form>
            </div>
        </div>
    );
}


  