import { useState } from 'react';
import ModalTask from './ModalTask';
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
        <ModalTask onClose={() => setShowModal(false)} />
      )}
    </>
  );
}