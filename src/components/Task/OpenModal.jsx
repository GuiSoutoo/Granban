import { useState } from 'react';
import { createPortal } from 'react-dom';
import ModalContent from './ModalContent.jsx';
import NovaTarefaIcon from '../../assets/NovaTarefaIcon.svg';
import '../../style/Task.css';

export default function OpenModal() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      
      <button className="buttonGr TaskButton" onClick={() => setShowModal(true)}>
        <img src={NovaTarefaIcon} alt="Nova tarefa" />
        <span>Nova tarefa</span>
      </button>
      {showModal && createPortal(
        <ModalContent onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  );
}