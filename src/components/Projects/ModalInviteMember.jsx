import { useEffect, useMemo, useState } from 'react';
import '../../style/Modal.css';

import AddMemberIcon from '../../assets/DetalhesProjeto/AdicionarMembro.png';
import MembrosProjetosIcon from '../../assets/DetalhesProjeto/MembrosProjetos.png';

import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ModalInviteMember({
  open,
  onClose,
  projectId,
  projectName,
  coverUrl,
  memberCount = 0,
  inviter,
}) {
  const isOpen = Boolean(open);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inviterName = useMemo(() => {
    const name = typeof inviter?.name === 'string' ? inviter.name.trim() : '';
    const username = typeof inviter?.username === 'string' ? inviter.username.trim() : '';
    const emailValue = typeof inviter?.email === 'string' ? inviter.email.trim() : '';
    return name || username || emailValue;
  }, [inviter?.name, inviter?.username, inviter?.email]);

  const inviterEmail = useMemo(() => (typeof inviter?.email === 'string' ? inviter.email.trim() : ''), [inviter?.email]);
  const inviterUid = useMemo(() => (typeof inviter?.uid === 'string' ? inviter.uid.trim() : ''), [inviter?.uid]);

  useEffect(() => {
    if (!isOpen) return;
    setEmail('');
    setError('');
    setSuccess('');
    setLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const inviteEmailLower = String(email || '').trim().toLowerCase();
  const canInvite = Boolean(!loading && projectId && inviteEmailLower.includes('@'));

  const handleInvite = async () => {
    if (!canInvite) return;
    setError('');
    setSuccess('');

    if (!inviterUid) {
      setError('Você precisa estar logado para enviar convites.');
      return;
    }

    if (inviterEmail && inviteEmailLower && inviterEmail.toLowerCase() === inviteEmailLower) {
      setError('Você não pode convidar seu próprio email.');
      return;
    }

    setLoading(true);
    try {
      const inviteId = `${projectId}__${inviteEmailLower}`;
      await setDoc(
        doc(db, 'projectInvites', inviteId),
        {
          projectId,
          projectName: projectName || 'Projeto',
          coverUrl: coverUrl || '',
          inviterUid: inviterUid || '',
          inviterEmail: inviterEmail || '',
          inviterName: inviterName || '',
          inviteeEmail: String(email || '').trim(),
          inviteeEmailLower: inviteEmailLower,
          createdAt: serverTimestamp(),
          status: 'pending',
        },
        { merge: true }
      );

      setSuccess('Convite enviado!');
      setEmail('');
    } catch (err) {
      console.error('Erro ao convidar:', err);
      const code = err?.code || '';
      if (code === 'permission-denied') {
        setError('Sem permissão para enviar convites. Verifique as regras do Firestore para a coleção "projectInvites".');
      } else {
        setError(err?.message || 'Não foi possível enviar o convite.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-details-wrap modal-invite-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-details-card modal-invite-card">
          <button
            type="button"
            className="modal-details-closeBtn modal-invite-closeBtn"
            onClick={() => onClose?.()}
            aria-label="Fechar"
            title="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="modal-invite-header">
            <div className="modal-invite-headerLeft">
              <div className="modal-invite-bigIcon" aria-hidden="true">
                <img src={AddMemberIcon} alt="" />
              </div>
              <div className="modal-invite-headerText">
                <div className="modal-invite-projectName">{projectName || 'Projeto'}</div>
                <div className="modal-invite-subtitle">Convidar ao projeto</div>
              </div>
            </div>

            <div className="modal-invite-headerRight" aria-label="Membros">
              <div className="modal-invite-memberCount">{Number(memberCount) || 0}</div>
              <img className="modal-invite-memberIcon" src={MembrosProjetosIcon} alt="" aria-hidden="true" />
            </div>
          </div>

          <div className="modal-invite-body">
            <div className="modal-invite-label">Email do convidado</div>
            <div className="modal-invite-row">
              <input
                className="modal-invite-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                aria-label="Email do convidado"
                autoComplete="off"
              />
              <button
                type="button"
                className="modal-invite-inviteBtn"
                onClick={handleInvite}
                disabled={!canInvite}
              >
                {loading ? 'Convidando...' : 'Convidar'}
              </button>
            </div>

            {error ? <div className="modal-invite-feedback modal-invite-feedback--error">{error}</div> : null}
            {success ? <div className="modal-invite-feedback modal-invite-feedback--success">{success}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
