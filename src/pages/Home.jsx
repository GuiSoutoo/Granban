import { Navbar } from '../components/Layout/Navbar';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTarefa } from '../hooks/UseTarefas';
import { useProjects } from '../hooks/UseProjects';
import HomeHeader from '../components/Home/HomeHeader';
import HomeTasksSection from '../components/Home/HomeTasksSection';
import HomeProjectsSection from '../components/Home/HomeProjectsSection';
import '../style/Home.css';

export default function Home() {
  const { userProfile } = useCurrentUser();
  const { tarefas, loading: loadingTasks } = useTarefa(null, null, userProfile);
  const { projects, loading: loadingProjects } = useProjects(userProfile);

  return (
    <>
      <Navbar />
      <main className="home-main">
        <HomeHeader userName={userProfile?.name} />
        <HomeTasksSection tarefas={tarefas} loading={loadingTasks} />
        <HomeProjectsSection projects={projects} loading={loadingProjects} />
      </main>
    </>
  );
}