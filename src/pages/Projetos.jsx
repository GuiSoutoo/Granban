import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { Heading } from "../components/Layout/Heading";
import { Navbar } from "../components/Layout/Navbar";
import ModalNewProject from '../components/Projects/ModalNewProject';
import ProjectCard from '../components/Projects/ProjectCard';
import { db } from '../services/firebase';
import { getCurrentUser, onAuthChange } from '../services/auth';
import { slugify } from '../utils/slugify';
import '../style/Granban.css';
import '../style/Projetos.css';

const STATUS_KEYS = ['to-do', 'in-progress', 'in-review', 'rejected', 'concluded'];

function emptyCounts() {
    return STATUS_KEYS.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});
}

export default function Projetos(){
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    const [user, setUser] = useState(() => getCurrentUser());
    const [projects, setProjects] = useState([]);
    const [countsByProject, setCountsByProject] = useState({});
    const [error, setError] = useState('');

    const memberMapRef = useRef(new Map());
    const taskUnsubsRef = useRef(new Map());

    const canQueryMembers = useMemo(() => !!user?.email, [user?.email]);

    useEffect(() => {
        const unsub = onAuthChange((u) => setUser(u));
        return unsub;
    }, []);

    useEffect(() => {
        setError('');
        memberMapRef.current = new Map();
        setProjects([]);

        if (!user?.uid) return;

        function mergeAndSet() {
            const list = Array.from(memberMapRef.current.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
            setProjects(list);
        }

        // A tela deve mostrar projetos que o usuário faz parte.
        // Como ownerId agora é o nome, a fonte de verdade aqui é members (array de e-mails).
        if (!canQueryMembers || !user.email) return;

        const projectsCol = collection(db, 'projects');
        const qMember = query(projectsCol, where('members', 'array-contains', user.email));
        const unsubMember = onSnapshot(
            qMember,
            (snap) => {
                const next = new Map();
                const pending = [];
                snap.forEach((d) => next.set(d.id, { id: d.id, ...d.data() }));

                // Backfill slug para projetos antigos (best-effort)
                snap.forEach((d) => {
                    const data = d.data();
                    if (!data?.slug && data?.name) {
                        const slug = slugify(data.name);
                        if (slug) {
                            pending.push(updateDoc(doc(db, 'projects', d.id), { slug }));
                        }
                    }
                });

                if (pending.length) {
                    Promise.allSettled(pending).catch(() => {});
                }

                memberMapRef.current = next;
                mergeAndSet();
            },
            (err) => {
                console.error('Erro ao carregar projetos (member):', err);
                setError(err?.message || 'Não foi possível carregar projetos.');
            }
        );

        return () => {
            try { unsubMember(); } catch {}
        };
    }, [user?.uid, user?.email, canQueryMembers]);

    useEffect(() => {
        // Remove listeners de projetos que saíram da lista
        const activeIds = new Set(projects.map((p) => p.id));
        for (const [projectId, unsub] of taskUnsubsRef.current.entries()) {
            if (!activeIds.has(projectId)) {
                try { unsub(); } catch {}
                taskUnsubsRef.current.delete(projectId);
                setCountsByProject((prev) => {
                    const next = { ...prev };
                    delete next[projectId];
                    return next;
                });
            }
        }

        // Cria listeners para novos projetos
        projects.forEach((p) => {
            if (!p?.id || taskUnsubsRef.current.has(p.id)) return;

            const tasksCol = collection(db, 'projects', p.id, 'tasks');
            const unsub = onSnapshot(
                tasksCol,
                (snap) => {
                    const counts = emptyCounts();
                    snap.forEach((d) => {
                        const status = d.data()?.status;
                        if (status && Object.prototype.hasOwnProperty.call(counts, status)) {
                            counts[status] += 1;
                        }
                    });
                    setCountsByProject((prev) => ({ ...prev, [p.id]: counts }));
                },
                (err) => {
                    console.error('Erro ao carregar tasks do projeto:', p.id, err);
                }
            );

            taskUnsubsRef.current.set(p.id, unsub);
        });
    }, [projects]);

    useEffect(() => {
        return () => {
            for (const unsub of taskUnsubsRef.current.values()) {
                try { unsub(); } catch {}
            }
            taskUnsubsRef.current.clear();
        };
    }, []);

    return(
        <>
            <Navbar page="Projetos" />
            <div className="granban-container dark">
                <Heading page="Projetos" onFuncClick={() => setShowNewProjectModal(true)} />

                <div className="projects-page">
                    {error ? (
                        <div className="projects-error">{error}</div>
                    ) : null}

                    {!error && projects.length === 0 ? (
                        <div className="projects-empty">Nenhum projeto encontrado para este usuário.</div>
                    ) : null}

                    {projects.length > 0 ? (
                        <div className="projects-grid">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    counts={countsByProject[project.id]}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            {showNewProjectModal && (
                <ModalNewProject onClose={() => setShowNewProjectModal(false)} />
            )}
        </>
    )
}