import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import ProjectCard from '../Projects/ProjectCard';
import ModalProjectDetails from '../Projects/ModalProjectDetails';

const STATUS_KEYS = ['to-do', 'in-progress', 'in-review', 'rejected', 'concluded', 'archived'];

function emptyCounts() {
  return STATUS_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
}

export default function HomeProjectsSection({ projects, loading }) {
  const [detailsProject, setDetailsProject] = useState(null);
  const [countsByProject, setCountsByProject] = useState({});
  const taskUnsubsRef = useRef(new Map());

  const recentProjects = useMemo(() => {
    return projects.slice(0, 4);
  }, [projects]);

  useEffect(() => {
    // Remove listeners de projetos que saíram da lista
    const activeIds = new Set(recentProjects.map((p) => p.id));
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
    recentProjects.forEach((p) => {
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

    return () => {
      for (const unsub of taskUnsubsRef.current.values()) {
        try { unsub(); } catch {}
      }
      taskUnsubsRef.current.clear();
    };
  }, [recentProjects]);

  return (
    <>
      <section className="home-section">
        <h2 className="home-section__title">Projetos recentes</h2>
        
        {loading ? (
          <p className="home-loading">Carregando projetos...</p>
        ) : recentProjects.length === 0 ? (
          <p className="home-empty">Nenhum projeto encontrado</p>
        ) : (
          <div className="home-projects-grid">
            {recentProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                counts={countsByProject[project.id] || {}}
                onInfo={(p) => setDetailsProject(p)}
              />
            ))}
          </div>
        )}

        {projects.length > 4 && (
          <Link to="/Projetos" className="home-see-all">
            Ver todos os projetos →
          </Link>
        )}
      </section>

      {detailsProject && (
        <ModalProjectDetails
          project={detailsProject}
          counts={countsByProject[detailsProject.id] || {}}
          onClose={() => setDetailsProject(null)}
        />
      )}
    </>
  );
}
