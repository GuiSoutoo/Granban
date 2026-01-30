function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeHeader({ userName }) {
  const greeting = getGreeting();

  return (
    <header className="home-header">
      <span className="home-greeting">{greeting}</span>
      <h1 className="home-username">{userName || 'Usuário'}</h1>
    </header>
  );
}
