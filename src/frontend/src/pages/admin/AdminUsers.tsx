import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import { Role } from "../../backend";
import type { UserProfile } from "../../backend.d";

// ── helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  [Role.customer]: "Customer",
  [Role.delivery_partner]: "Delivery Partner",
  [Role.admin]: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  [Role.customer]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  [Role.delivery_partner]:
    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  [Role.admin]: "bg-primary/10 text-primary border-primary/20",
};

// ── hooks ─────────────────────────────────────────────────────────────────────
function useAllUsers() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserProfile[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllUsers();
      if (result.__kind__ !== "ok") return [];
      return result.ok.sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

function useSetAdminRole() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      makeAdmin,
    }: {
      principal: string;
      makeAdmin: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.setAdminRole(principal as any, makeAdmin);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(
        vars.makeAdmin ? "Admin role granted" : "Admin role revoked",
      );
    },
    onError: () => toast.error("Failed to update role"),
  });
}

// ── copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy principal ID"
      data-ocid="admin_users.copy_button"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

// ── role editor ───────────────────────────────────────────────────────────────
function RoleEditor({ user }: { user: UserProfile }) {
  const setRole = useSetAdminRole();
  const principalStr = user.principal.toString();

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`text-xs ${ROLE_COLORS[user.role] ?? "border-muted"}`}
      >
        {ROLE_LABELS[user.role] ?? user.role}
      </Badge>
      {user.role !== Role.admin ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
          disabled={setRole.isPending}
          onClick={() =>
            setRole.mutate({ principal: principalStr, makeAdmin: true })
          }
          data-ocid="admin_users.promote_button"
        >
          Make Admin
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={setRole.isPending}
          onClick={() =>
            setRole.mutate({ principal: principalStr, makeAdmin: false })
          }
          data-ocid="admin_users.revoke_button"
        >
          Revoke Admin
        </Button>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
type RoleFilter = "all" | "customer" | "delivery_partner" | "admin";

export function AdminUsers() {
  const { data: users = [], isLoading } = useAllUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      !search || u.name.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div data-ocid="admin_users.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage user roles and view account details.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-semibold border-primary/30 text-primary"
        >
          {users.length} total
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            data-ocid="admin_users.search_input"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as RoleFilter)}
        >
          <SelectTrigger
            className="w-48 h-9"
            data-ocid="admin_users.role_filter_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value={Role.customer}>Customer</SelectItem>
            <SelectItem value={Role.delivery_partner}>
              Delivery Partner
            </SelectItem>
            <SelectItem value={Role.admin}>Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-table-container"
        data-ocid="admin_users.table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">
            {filtered.length} Users
          </h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3" data-ocid="admin_users.loading_state">
            {(["a", "b", "c", "d", "e"] as const).map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="admin_users.empty_state"
          >
            No users match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Principal", "Name", "Role", "Joined", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left last:text-right"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => (
                  <tr
                    key={user.principal.toString()}
                    data-ocid={`admin_users.item.${idx + 1}`}
                    className="admin-table-row border-b border-border/50 last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-muted-foreground">
                          {user.principal.toString().slice(0, 14)}…
                        </span>
                        <CopyButton text={user.principal.toString()} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {user.name || (
                        <span className="text-muted-foreground italic">
                          Unnamed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs ${ROLE_COLORS[user.role] ?? "border-muted"}`}
                        data-ocid={`admin_users.role_badge.${idx + 1}`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {new Date(
                        Number(user.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RoleEditor user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
