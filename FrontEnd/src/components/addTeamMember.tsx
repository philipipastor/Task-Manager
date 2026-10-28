import { useWorkspace } from "../context/WorkspaceContext";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { api } from "../services/api";
import { Button } from "./button";
import { type Teams } from "../types/teams";
import arrowBack from "../assets/seta-esquerda.png";

type User = {
  id: string;
  name: string;
  email: string;
};

type AddTeamMemberProps = {
  team: Teams;
  onCancel: () => void;
  onAdded: () => Promise<void>;
};

const existingUserSchema = z.object({
  user_id: z.string().uuid("Selecione um usuário")
});

type ExistingUserForm = z.infer<typeof existingUserSchema>;


export function AddTeamMember({
  team,
  onCancel,
  onAdded
}: AddTeamMemberProps) {
  const { workspace } = useWorkspace()

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const existingForm = useForm<ExistingUserForm>({
    resolver: zodResolver(existingUserSchema),
    defaultValues: {
      user_id: "" 
    }
  });

  const isSubmitting = existingForm.formState.isSubmitting;

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      try {
        const response = await api.get<User[]>("/users", { params: { workSpaceId: workspace!.id } });
        if (!cancelled) setUsers(response.data);
      } catch (error) {
        console.log(error);
        if (!cancelled) setError("Não foi possível carregar os usuários.");
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  async function addExistingUser(data: ExistingUserForm) {
    setError("");

    try {
      await api.post("/members", {
        user_id: data.user_id,
        team_id: team.id
      });

      await onAdded();
    } catch (error) {
      console.log(error);
      setError("Não foi possível vincular o usuário à equipe.");
    }
  }

  return (
    <section className="min-w-0 flex-1 p-5 sm:p-7">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <img src={arrowBack} alt="" aria-hidden="true" className="size-4 shrink-0 object-contain invert" /> Voltar à equipe
      </button>

      <h2 className="text-xl font-semibold text-content">
        Adicionar membro
      </h2>

      <p className="mt-2 text-sm text-muted">
        Equipe:{" "}
        <span className="font-semibold text-content">
          {team.name}
        </span>
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {loadingUsers && <p role="status" className="mt-4 text-sm text-muted">Carregando usuários...</p>}


        <form
          onSubmit={existingForm.handleSubmit(addExistingUser)}
          noValidate
          className="mt-6 max-w-xl space-y-5"
        >
          <div>
            <label
              htmlFor="existing-user"
              className="mb-2 block text-sm font-medium text-content"
            >
              Usuário
            </label>

            <select
              id="existing-user"
              disabled={loadingUsers || isSubmitting}
              {...existingForm.register("user_id")}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-base text-content sm:text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="" className="bg-surface">
                {loadingUsers ? "Carregando usuários..." : "Selecione um usuário"}
              </option>

              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-surface"
                >
                  {user.name} — {user.email}
                </option>
              ))}
            </select>

            {existingForm.formState.errors.user_id && (
              <p className="mt-1 text-xs text-danger">
                {existingForm.formState.errors.user_id.message}
              </p>
            )}

            <p className="mt-5 text-xs text-muted">
              Selecione uma pessoa que já pertence ao espaço. Para novas pessoas, envie um convite pela tela Pessoas e convites.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-11 cursor-pointer rounded-lg border border-line px-4 text-sm font-medium text-content hover:bg-page"
            >
              Cancelar
            </button>

            <Button
              type="submit"
              isLoading={existingForm.formState.isSubmitting}
              disabled={loadingUsers || isSubmitting || users.length === 0}
            >
              {existingForm.formState.isSubmitting
                ? "Vinculando..."
                : "Vincular à equipe"}
            </Button>
          </div>
        </form>
    </section>
  );
}
