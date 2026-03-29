import type { FormEventHandler } from "react";

type Props = {
  name: string;
  email: string;
  password: string;
  message: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler;
  onGoToLogin: () => void;
};

export function RegisterCard(props: Props) {
  return (
    <section className="login-card">
      <div>
        <p className="eyebrow">Barbearia</p>
        <h1>Criar conta</h1>
        <p className="muted">Cadastre uma nova conta de cliente para acessar o sistema.</p>
      </div>

      <form className="login-form" onSubmit={props.onSubmit}>
        <label>
          Nome
          <input value={props.name} onChange={(event) => props.onNameChange(event.target.value)} />
        </label>
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
        <button type="submit">Cadastrar</button>
      </form>

      <button type="button" className="ghost" onClick={props.onGoToLogin}>
        Voltar para login
      </button>

      {props.message ? <p className="message error">{props.message}</p> : null}
    </section>
  );
}
