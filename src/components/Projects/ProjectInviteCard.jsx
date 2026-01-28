import { useMemo, useState } from 'react';
import '../../style/Projetos.css';

import GranbanLogoIcon from '../../assets/GranbanLogoIcon.svg';

export default function ProjectInviteCard({ invite, onAccept, onDecline }) {
  const [loading, setLoading] = useState('');

  const coverUrl = useMemo(() => String(invite?.coverUrl || '').trim(), [invite?.coverUrl]);
  const inviterName = useMemo(() => String(invite?.inviterName || invite?.inviterEmail || '').trim(), [invite?.inviterName, invite?.inviterEmail]);
  const projectName = useMemo(() => String(invite?.projectName || '').trim() || 'Projeto', [invite?.projectName]);

  const handle = async (type) => {
    if (loading) return;
    setLoading(type);
    try {
      if (type === 'accept') await onAccept?.(invite);
      if (type === 'decline') await onDecline?.(invite);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="project-invite-card" role="article" aria-label="Convite de projeto">
      <div className="project-invite-card__cover" aria-hidden="true">
        {coverUrl ? (
          <>
            <div className="project-invite-card__bg" style={{ backgroundImage: `url(${coverUrl})` }} />
            <img className="project-invite-card__img" src={coverUrl} alt="" />
          </>
        ) : (
          <div className="project-invite-card__placeholder">
            <img src={GranbanLogoIcon} alt="" />
          </div>
        )}
        <div className="project-invite-card__overlay" />
      </div>

      <div className="project-invite-card__content">
        <div className="project-invite-card__text">
          <div className="project-invite-card__inviter">{inviterName || 'Alguém'} lhe convidou para o projeto:</div>
          <div className="project-invite-card__projectName">{projectName}</div>
        </div>

        <div className="project-invite-card__actions">
          <button
            type="button"
            className="project-invite-card__btn project-invite-card__btn--decline"
            onClick={() => handle('decline')}
            disabled={loading === 'accept' || loading === 'decline'}
          >
            {loading === 'decline' ? 'Recusando...' : 'Recusar'}
          </button>
          <button
            type="button"
            className="project-invite-card__btn project-invite-card__btn--accept"
            onClick={() => handle('accept')}
            disabled={loading === 'accept' || loading === 'decline'}
          >
            {loading === 'accept' ? 'Aceitando...' : 'Aceitar'}
          </button>
        </div>
      </div>
    </div>
  );
}
