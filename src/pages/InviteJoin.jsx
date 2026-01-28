import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCurrentUser } from '../services/auth';

export default function InviteJoin() {
  const { token } = useParams();
  const navigate = useNavigate();

  const user = useMemo(() => getCurrentUser(), []);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Validando convite...');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');

      const tokenValue = String(token || '').trim();
      if (!tokenValue) {
        setError('Link inválido.');
        setLoading(false);
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser?.email) {
        setError('Você precisa estar logado para aceitar o convite.');
        setLoading(false);
        return;
      }

      try {
        setStatus('Carregando convite...');
        const linkSnap = await getDoc(doc(db, 'projectInviteLinks', tokenValue));
        if (!linkSnap.exists()) {
          setError('Convite não encontrado ou expirado.');
          setLoading(false);
          return;
        }

        const linkData = linkSnap.data() || {};
        const projectId = String(linkData?.projectId || '').trim();
        const active = linkData?.active !== false;

        if (!projectId || !active) {
          setError('Convite inválido ou desativado.');
          setLoading(false);
          return;
        }

        setStatus('Entrando no projeto...');
        const email = String(currentUser.email).trim();

        await updateDoc(doc(db, 'projects', projectId), {
          members: arrayUnion(email),
        });

        const projectSnap = await getDoc(doc(db, 'projects', projectId));
        const projectName = projectSnap.exists() ? (projectSnap.data()?.name || 'Projeto') : 'Projeto';
        const projectSlug = projectSnap.exists() ? (projectSnap.data()?.slug || '') : '';

        if (cancelled) return;

        navigate(`/Granban/${projectSlug || projectId}`,
          {
            replace: true,
            state: { projectId, projectName },
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Erro ao aceitar convite por link:', err);
        const code = err?.code || '';
        if (code === 'permission-denied') {
          setError('Sem permissão para entrar no projeto via link. É preciso ajustar as regras do Firestore (projects/members).');
        } else {
          setError(err?.message || 'Não foi possível entrar no projeto.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b12', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(560px, 100%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Convite do projeto</div>
        {!error ? (
          <div style={{ opacity: 0.9, marginBottom: 14 }}>{loading ? status : 'Pronto!'}</div>
        ) : (
          <div style={{ background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 12, padding: 12, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/Projetos', { replace: true })}
            style={{
              borderRadius: 12,
              padding: '10px 14px',
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Ir para Projetos
          </button>

          {user?.email ? (
            <div style={{ marginLeft: 'auto', opacity: 0.75, alignSelf: 'center', fontSize: 12 }}>
              Logado como {String(user.email)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
