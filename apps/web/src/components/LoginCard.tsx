import type { FormEventHandler } from "react";

type Props = {
  email: string;
  password: string;
  message: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler;
  onGoToRegister: () => void;
};

export function LoginCard(props: Props) {
  return (
    <section className="login-card">
      <div>
        <p className="eyebrow">Barbearia</p>
        <h1>Acesse sua conta</h1>
        <p className="muted">Entre com seu usuario para acessar o sistema.</p>
      </div>

      <form className="login-form" onSubmit={props.onSubmit}>
        <label>
          E-mail
          <input value={props.email} onChange={(event) => props.onEmailChange(event.target.value)} />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={props.password}
            onChange={(event) => props.onPasswordChange(event.target.value)}
          />
        </label>
        <button type="submit">Entrar</button>
      </form>

      <button type="button" className="ghost" onClick={props.onGoToRegister}>
        Criar nova conta
      </button>

      {props.message ? <p className="message error">{props.message}</p> : null}
    </section>
  );
}
