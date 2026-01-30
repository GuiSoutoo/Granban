import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskCard } from '../Board/TaskCard';

// Extrai dia/mês/ano de uma string ou Date, ignorando horário
function parseDueDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      day: value.getDate(),
      month: value.getMonth() + 1,
      year: value.getFullYear(),
    };
  }

  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  const cleaned = str.split('T')[0].split(' ')[0];

  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length >= 2) {
      const day = Number(parts[0]);
      const month = Number(parts[1]);
      const year = Number(parts[2]) || new Date().getFullYear();
      if (day && month) return { day, month, year };
    }
  }

  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length >= 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      if (day && month) return { day, month, year };
    }
  }

  const fallback = new Date(cleaned);
  if (!Number.isNaN(fallback.getTime())) {
    return {
      day: fallback.getDate(),
      month: fallback.getMonth() + 1,
      year: fallback.getFullYear(),
    };
  }

  return null;
}

// Agrupa tarefas por dia e mês da data de entrega (ignora horário)
function groupTasksByDueDate(tasks) {
  const groups = new Map();

  tasks.forEach((task) => {
    const parsed = parseDueDate(task.dueDate);
    const key = parsed ? `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}` : '';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(task);
  });

  // Converte para array e ordena por mês/dia (considerando o ano atual)
  return Array.from(groups.entries()).sort((a, b) => {
    if (!a[0]) return 1;
    if (!b[0]) return -1;

    const parseKey = (key) => {
      const parts = key.split('/');
      if (parts.length === 2) {
        const day = Number(parts[0]) || 0;
        const month = Number(parts[1]) || 0;
        return month * 100 + day;
      }
      return Number.MAX_SAFE_INTEGER;
    };

    return parseKey(a[0]) - parseKey(b[0]);
  });
}

// Formata a data para exibição (ex: "31 Segunda", "01/01 Terça")
function formatDateLabel(dateKey) {
  if (!dateKey) return 'Sem data';

  const parts = dateKey.split('/');
  if (parts.length !== 2) return dateKey;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  if (!day || !month) return dateKey;

  const year = new Date().getFullYear();
  const date = new Date(year, month - 1, day);
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const weekDay = weekDays[date.getDay()];

  const currentMonth = new Date().getMonth() + 1;
  const dayLabel = String(day).padStart(2, '0');
  const monthLabel = String(month).padStart(2, '0');

  if (month === currentMonth) {
    return `${dayLabel} ${weekDay}`;
  }

  return `${dayLabel}/${monthLabel} ${weekDay}`;
}

export default function HomeTasksSection({ tarefas, loading }) {
  const navigate = useNavigate();

  const inProgressTasks = useMemo(() => {
    return tarefas.filter(t => t.status === 'in-progress');
  }, [tarefas]);

  const groupedInProgress = useMemo(() => {
    return groupTasksByDueDate(inProgressTasks);
  }, [inProgressTasks]);

  const todoTasks = useMemo(() => {
    return tarefas.filter(t => t.status === 'to-do');
  }, [tarefas]);

  const groupedTasks = useMemo(() => {
    return groupTasksByDueDate(todoTasks);
  }, [todoTasks]);

  const handleTaskClick = (task) => {
    const openTaskKey = task.uniqueKey || `${task.projectId || 'personal'}::${task.id}`;
    navigate('/Granban', {
      state: {
        openTaskKey,
        openTaskId: task.id,
        openTaskProjectId: task.projectId || '',
      },
    });
  };

  return (
    <section className="home-section">
      <h2 className="home-section__title">Tarefas em andamento</h2>

      {loading ? (
        <p className="home-loading">Carregando tarefas...</p>
      ) : groupedInProgress.length === 0 ? (
        <p className="home-empty">Nenhuma tarefa em andamento</p>
      ) : (
        <div className="home-tasks-groups">
          {groupedInProgress.map(([dateKey, tasks]) => (
            <div key={dateKey || 'no-date'} className="home-tasks-group">
              <h3 className="home-tasks-group__date">{formatDateLabel(dateKey)}</h3>
              <div className="home-tasks-group__cards">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.uniqueKey || task.id}
                    task={task}
                    index={index}
                    hideDetailsButton
                    onCardClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="home-section__title">Tarefas a fazer</h2>
      
      {loading ? (
        <p className="home-loading">Carregando tarefas...</p>
      ) : groupedTasks.length === 0 ? (
        <p className="home-empty">Nenhuma tarefa pendente 🎉</p>
      ) : (
        <div className="home-tasks-groups">
          {groupedTasks.map(([dateKey, tasks]) => (
            <div key={dateKey || 'no-date'} className="home-tasks-group">
              <h3 className="home-tasks-group__date">{formatDateLabel(dateKey)}</h3>
              <div className="home-tasks-group__cards">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.uniqueKey || task.id}
                    task={task}
                    index={index}
                    hideDetailsButton
                    onCardClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
