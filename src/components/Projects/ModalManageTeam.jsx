import { useEffect, useMemo, useRef, useState } from 'react';
import '../../style/Modal.css';

import { arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

import GranbanLogoIcon from '../../assets/GranbanLogoIcon.svg';
import TasksProjetosIcon from '../../assets/DetalhesProjeto/TasksProjetos.png';
import MembrosProjetosIcon from '../../assets/DetalhesProjeto/MembrosProjetos.png';
import GerenciarEquipeIcon from '../../assets/DetalhesProjeto/GerenciarEquipe.png';

function getInitial(nameOrEmail) {
  const value = String(nameOrEmail || '').trim();
  if (!value) return '?';
  return value.slice(0, 1).toUpperCase();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default function ModalManageTeam({
  open,
  onClose,
  projectId,
  currentUserEmail = '',
  createdBy = '',
  projectName,
  coverUrl,
  tasksDoneCount = 0,
  memberCount = 0,
  members = [],
  memberProfiles = [],
  ownerEmail = '',
}) {
  const isOpen = Boolean(open);
  const normalizedOwnerEmail = normalizeEmail(ownerEmail);
  const normalizedCurrentEmail = normalizeEmail(currentUserEmail);
  const isOwner = Boolean(normalizedCurrentEmail && normalizedOwnerEmail && normalizedCurrentEmail === normalizedOwnerEmail);

  const [rowMenuOpen, setRowMenuOpen] = useState(false);
  const [rowMenuPos, setRowMenuPos] = useState({ top: 0, left: 0 });
  const [rowMenuTarget, setRowMenuTarget] = useState('');
  const rowMenuRef = useRef(null);
  const rowMenuBtnRef = useRef(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState('');
  const [confirmTarget, setConfirmTarget] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const profileByEmail = useMemo(() => {
    const map = new Map();
    (Array.isArray(memberProfiles) ? memberProfiles : []).forEach((p) => {
      if (p?.key) map.set(p.key, p);
    });
    return map;
  }, [memberProfiles]);

  useEffect(() => {
    if (!isOpen) return;
    setRowMenuOpen(false);
    setConfirmOpen(false);
    setConfirmType('');
    setConfirmTarget('');
    setActionLoading(false);
  }, [isOpen]);

  useEffect(() => {
    if (!rowMenuOpen) return;

    const onPointerDown = (e) => {
      const menuEl = rowMenuRef.current;
      const btnEl = rowMenuBtnRef.current;
      const target = e.target;

      if (menuEl && menuEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;
      setRowMenuOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [rowMenuOpen]);

  if (!isOpen) return null;

  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];

  const canActOnTarget = (email) => {
    if (!isOwner) return false;
    if (!email) return false;
    if (normalizeEmail(email) === normalizedOwnerEmail) return false;
    return true;
  };

  const openRowMenu = (event, email) => {
    if (!isOwner) return;
    if (!email) return;
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const menuWidth = 260;
    const gap = 10;

    const left = rect
      ? Math.min(
          Math.max(12, rect.right - menuWidth),
          Math.max(12, window.innerWidth - menuWidth - 12)
        )
      : Math.max(12, window.innerWidth - menuWidth - 12);
    const top = rect ? rect.bottom + gap : 78;

    setRowMenuPos({ top, left });
    setRowMenuTarget(email);
    setRowMenuOpen(true);
  };

  const openConfirm = (type, email) => {
    setConfirmType(type);
    setConfirmTarget(email);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (actionLoading) return;
    setConfirmOpen(false);
    setConfirmType('');
    setConfirmTarget('');
  };

  const doRemoveMember = async (email) => {
    if (!projectId) return;
    if (!email) return;

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        members: arrayRemove(email),
      });
      closeConfirm();
    } catch {
      // mantém o confirm aberto caso falhe
    } finally {
      setActionLoading(false);
    }
  };

  const doMakeOwner = async (email) => {
    if (!projectId) return;
    if (!email) return;

    setActionLoading(true);
    try {
      const payload = { ownerEmail: email };
      const createdByStr = String(createdBy || '').trim();
      if (createdByStr.includes('@') || !createdByStr) payload.createdBy = email;
      await updateDoc(doc(db, 'projects', projectId), payload);
      closeConfirm();
    } catch {
      // mantém o confirm aberto caso falhe
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-details-wrap modal-team-wrap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-details-card modal-team-card">
          <div className="modal-team-header">
            <div className="modal-team-headerLeft">
              <div className="modal-team-cover">
                {coverUrl ? (
                  <img className="modal-team-coverImg" src={coverUrl} alt="" />
                ) : (
                  <div className="modal-team-coverFallback" aria-hidden="true">
                    <img src={GranbanLogoIcon} alt="" />
                  </div>
                )}
              </div>

              <div className="modal-team-headerInfo">
                <div className="modal-team-projectName">{projectName || 'Projeto'}</div>
                <div className="modal-team-metrics">
                  <div className="modal-team-metric" title="Tasks concluídas">
                    <span className="modal-team-metricValue">{Number(tasksDoneCount) || 0}</span>
                    <img className="modal-team-metricIcon" src={TasksProjetosIcon} alt="" aria-hidden="true" />
                  </div>
                  <div className="modal-team-metric" title="Membros">
                    <span className="modal-team-metricValue">{Number(memberCount) || 0}</span>
                    <img className="modal-team-metricIcon" src={MembrosProjetosIcon} alt="" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="modal-details-closeBtn"
              onClick={() => onClose?.()}
              aria-label="Fechar"
              title="Fechar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="modal-team-titleRow">
            <img className="modal-team-titleIcon" src={GerenciarEquipeIcon} alt="" aria-hidden="true" />
            <div className="modal-team-titleText">Gerenciar equipe</div>
          </div>

          <div className="modal-team-table">
            {safeMembers.map((email) => {
              const info = profileByEmail.get(email);
              const name = String(info?.name || '').trim() || 'Sem nome';
              const photoURL = String(info?.photoURL || '').trim();
              const role = normalizeEmail(email) && normalizedOwnerEmail && normalizeEmail(email) === normalizedOwnerEmail ? 'Owner' : 'Executor';
              const disableDots = !isOwner;

              return (
                <div key={email} className="modal-team-row">
                  <div className="modal-team-avatar" aria-hidden="true">
                    {photoURL ? (
                      <img src={photoURL} alt="" />
                    ) : (
                      <span className="modal-team-avatarFallback">{getInitial(name !== 'Sem nome' ? name : email)}</span>
                    )}
                  </div>
                  <div className="modal-team-cell modal-team-cell--name">{name}</div>
                  <div className="modal-team-cell modal-team-cell--email">{email}</div>
                  <div className={`modal-team-role${role === 'Owner' ? ' modal-team-role--owner' : ''}`}>{role}</div>
                  <button
                    type="button"
                    className="modal-team-rowDots"
                    aria-label="Mais opções"
                    title={isOwner ? 'Mais opções' : 'Apenas o owner pode gerenciar'}
                    disabled={disableDots}
                    ref={rowMenuTarget === email ? rowMenuBtnRef : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOwner) return;
                      if (rowMenuOpen && rowMenuTarget === email) {
                        setRowMenuOpen(false);
                        return;
                      }
                      openRowMenu(e, email);
                    }}
                  >
                    •••
                  </button>
                </div>
              );
            })}

            {safeMembers.length === 0 ? (
              <div className="modal-team-empty">Sem membros.</div>
            ) : null}
          </div>

          {rowMenuOpen && isOwner ? (
            <div
              className="modal-team-optionsMenu"
              role="dialog"
              aria-label="Opções do membro"
              style={{ top: rowMenuPos.top, left: rowMenuPos.left }}
              ref={rowMenuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="modal-team-optionsMenu__item"
                disabled={!canActOnTarget(rowMenuTarget)}
                onClick={() => {
                  const target = rowMenuTarget;
                  setRowMenuOpen(false);
                  if (!canActOnTarget(target)) return;
                  openConfirm('make-owner', target);
                }}
              >
                Tornar owner
              </button>
              <div className="modal-team-optionsMenu__divider" aria-hidden="true" />
              <button
                type="button"
                className="modal-team-optionsMenu__item modal-team-optionsMenu__item--danger"
                disabled={!canActOnTarget(rowMenuTarget) || normalizeEmail(rowMenuTarget) === normalizedCurrentEmail}
                onClick={() => {
                  const target = rowMenuTarget;
                  setRowMenuOpen(false);
                  if (!canActOnTarget(target) || normalizeEmail(target) === normalizedCurrentEmail) return;
                  openConfirm('remove-member', target);
                }}
              >
                Remover do projeto
              </button>
            </div>
          ) : null}

          {confirmOpen ? (
            <div className="modal-team-confirmOverlay" role="presentation">
              <div
                className="modal-team-confirmCard"
                role="dialog"
                aria-label="Confirmar ação"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="modal-details-closeBtn modal-team-confirmCloseBtn"
                  onClick={closeConfirm}
                  aria-label="Fechar"
                  title="Fechar"
                  disabled={actionLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>

                {confirmType === 'make-owner' ? (
                  <>
                    <div className="modal-team-confirmTitle">Tornar owner?</div>
                    <div className="modal-team-confirmText">
                      Você tem certeza que deseja tornar <strong>{confirmTarget}</strong> o novo owner do projeto?
                    </div>
                    <div className="modal-team-confirmActions">
                      <button
                        type="button"
                        className="modal-team-confirmBtn"
                        onClick={closeConfirm}
                        disabled={actionLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="modal-team-confirmBtn modal-team-confirmBtn--danger"
                        onClick={() => doMakeOwner(confirmTarget)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Salvando...' : 'Confirmar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="modal-team-confirmTitle">Remover membro?</div>
                    <div className="modal-team-confirmText">
                      Você tem certeza que deseja remover <strong>{confirmTarget}</strong> do projeto?
                    </div>
                    <div className="modal-team-confirmActions">
                      <button
                        type="button"
                        className="modal-team-confirmBtn"
                        onClick={closeConfirm}
                        disabled={actionLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="modal-team-confirmBtn modal-team-confirmBtn--danger"
                        onClick={() => doRemoveMember(confirmTarget)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
