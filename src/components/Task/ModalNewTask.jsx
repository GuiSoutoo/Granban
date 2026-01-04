import { useState } from 'react';
import ModalContent from '../Task/ModalContent';
import NovaTarefaIcon from '../../assets/NovaTarefaIcon.svg';
import '../../style/Modal.css';

export default function ModalNewTask() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button 
        className="buttonGr TaskButton"
        onClick={() => setShowModal(true)}
      >
        <img src={NovaTarefaIcon} alt="Nova tarefa"/>
        <span>Nova tarefa</span>
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <ModalContent onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </>
  );
}