import type { User } from "../app/types";

type Props = {
  user: User;
  onLogout: () => void;
};

export function AppHeader({ user, onLogout }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <h1>{user.name}</h1>
      </div>
      <button className="ghost topbar-logout" onClick={onLogout}>
        Sair
      </button>
    </header>
  );
}
