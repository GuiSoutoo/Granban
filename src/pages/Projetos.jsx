import { useEffect, useMemo, useRef, useState } from 'react';
import { arrayUnion, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { Heading } from "../components/Layout/Heading";
import { Navbar } from "../components/Layout/Navbar";
import ModalNewProject from '../components/Projects/ModalNewProject';
import ModalProjectDetails from '../components/Projects/ModalProjectDetails';
import ModalEditProject from '../components/Projects/ModalEditProject';
import ProjectCard from '../components/Projects/ProjectCard';
import ProjectInviteCard from '../components/Projects/ProjectInviteCard';
import { db } from '../services/firebase';
import { getCurrentUser, onAuthChange } from '../services/auth';
import { slugify } from '../utils/slugify';
import '../style/Granban.css';
import '../style/Projetos.css';
import IsEmptyIcon from "../assets/IsEmpty.svg";

const STATUS_KEYS = ['to-do', 'in-progress', 'in-review', 'rejected', 'concluded'];

function emptyCounts() {
    return STATUS_KEYS.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});
}

export default function Projetos(){
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const [user, setUser] = useState(() => getCurrentUser());
    const [projects, setProjects] = useState([]);
    const [invites, setInvites] = useState([]);
    const [countsByProject, setCountsByProject] = useState({});
    const [error, setError] = useState('');

    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return null;
        return projects.find((p) => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

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
        setInvites([]);

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
        setInvites([]);
        if (!user?.email) return;

        const emailLower = String(user.email).trim().toLowerCase();
        const invitesCol = collection(db, 'projectInvites');
        const qInvites = query(invitesCol, where('inviteeEmailLower', '==', emailLower));

        const unsub = onSnapshot(
            qInvites,
            (snap) => {
                const list = [];
                snap.forEach((d) => {
                    const data = d.data() || {};
                    if (data?.status && data.status !== 'pending') return;
                    list.push({ id: d.id, ...data });
                });
                // mais recente primeiro
                list.sort((a, b) => {
                    const at = a?.createdAt?.toMillis?.() || 0;
                    const bt = b?.createdAt?.toMillis?.() || 0;
                    return bt - at;
                });
                setInvites(list);
            },
            (err) => {
                console.error('Erro ao carregar convites:', err);
            }
        );

        return () => {
            try { unsub(); } catch {}
        };
    }, [user?.email]);

    const handleAcceptInvite = async (invite) => {
        if (!user?.email) return;
        const projectId = invite?.projectId;
        if (!projectId) return;

        await updateDoc(doc(db, 'projects', projectId), {
            members: arrayUnion(user.email),
        });

        if (invite?.id) {
            await deleteDoc(doc(db, 'projectInvites', invite.id));
        }
    };

    const handleDeclineInvite = async (invite) => {
        if (invite?.id) {
            await deleteDoc(doc(db, 'projectInvites', invite.id));
        }
    };

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

                    {!error && invites.length > 0 ? (
                        <div className="project-invites">
                            <div className="project-invites-title">Convites</div>
                            <div className="project-invites-list">
                                {invites.map((invite) => (
                                    <ProjectInviteCard
                                        key={invite.id}
                                        invite={invite}
                                        onAccept={handleAcceptInvite}
                                        onDecline={handleDeclineInvite}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {!error && projects.length === 0 ? (
                        <div className="projects-empty">
                            <img src={IsEmptyIcon} alt="Sem projetos" className="projects-empty__art" />
                            <p className="projects-empty__title">Sem projetos por aqui!</p>
                            <p className="projects-empty__subtitle">Crie um novo ou solicite um convite :)</p>
                        </div>
                    ) : null}

                    {projects.length > 0 ? (
                        <div className="projects-grid">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    counts={countsByProject[project.id]}
                                    onInfo={(p) => {
                                        setSelectedProjectId(p?.id || null);
                                        setShowProjectDetailsModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            {showNewProjectModal && (
                <ModalNewProject onClose={() => setShowNewProjectModal(false)} />
            )}

            {showProjectDetailsModal && selectedProject ? (
                <ModalProjectDetails
                    project={selectedProject}
                    counts={countsByProject[selectedProject.id]}
                    onEdit={(p) => {
                        setSelectedProjectId(p?.id || null);
                        setShowProjectDetailsModal(false);
                        setShowEditProjectModal(true);
                    }}
                    onClose={() => {
                        setShowProjectDetailsModal(false);
                        setSelectedProjectId(null);
                    }}
                />
            ) : null}

            {showEditProjectModal && selectedProject ? (
                <ModalEditProject
                    project={selectedProject}
                    onClose={() => {
                        setShowEditProjectModal(false);
                        setSelectedProjectId(null);
                    }}
                />
            ) : null}
        </>
    )
}