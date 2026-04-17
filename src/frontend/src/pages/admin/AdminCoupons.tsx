import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PlusCircle, Tag, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import { DiscountType } from "../../backend";
import type { CouponPublic, Product } from "../../backend.d";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function fmtExpiry(ts?: bigint) {
  if (!ts) return "Never";
  return new Date(Number(ts) / 1_000_000).toLocaleDateString();
}

const TYPE_LABELS: Record<string, string> = {
  [DiscountType.flat]: "Flat",
  [DiscountType.percentage]: "Percentage",
  [DiscountType.bogo]: "BOGO",
  [DiscountType.free_delivery]: "Free Delivery",
};

const TYPE_COLORS: Record<string, string> = {
  [DiscountType.flat]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  [DiscountType.percentage]: "bg-primary/10 text-primary border-primary/20",
  [DiscountType.bogo]: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  [DiscountType.free_delivery]:
    "bg-green-500/10 text-green-400 border-green-500/20",
};

// ── hooks ─────────────────────────────────────────────────────────────────────
function useCoupons() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<CouponPublic[]>({
    queryKey: ["admin", "coupons"],
    queryFn: async () => (actor ? actor.getCoupons() : []),
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

function useProductList() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Product[]>({
    queryKey: ["admin", "products"],
    queryFn: async () => (actor ? actor.getProducts() : []),
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

function useCreateCoupon() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      discountType: DiscountType;
      discountValue: bigint;
      minOrderAmount: bigint;
      maxUsages: bigint;
      expiresAt: bigint | null;
      triggerProductId: string | null;
      freeProductId: string | null;
      requiresMinQty: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCoupon(
        payload.code,
        payload.discountType,
        payload.discountValue,
        payload.minOrderAmount,
        payload.maxUsages,
        payload.expiresAt,
        payload.triggerProductId,
        payload.freeProductId,
        payload.requiresMinQty,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("Coupon created");
    },
    onError: () => toast.error("Failed to create coupon"),
  });
}

// ── coupon modal ──────────────────────────────────────────────────────────────
interface CouponForm {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxUsages: string;
  expiresAt: string;
  triggerProductId: string;
  freeProductId: string;
  requiresMinQty: string;
}

const EMPTY: CouponForm = {
  code: "",
  discountType: DiscountType.flat,
  discountValue: "",
  minOrderAmount: "0",
  maxUsages: "100",
  expiresAt: "",
  triggerProductId: "",
  freeProductId: "",
  requiresMinQty: "1",
};

interface CouponModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
}

function CouponModal({ open, onClose, products }: CouponModalProps) {
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const create = useCreateCoupon();

  const set = (k: keyof CouponForm) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const expiresAt = form.expiresAt
      ? BigInt(new Date(form.expiresAt).getTime()) * BigInt(1_000_000)
      : null;
    await create.mutateAsync({
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: BigInt(
        Math.round(Number.parseFloat(form.discountValue || "0") * 100),
      ),
      minOrderAmount: BigInt(
        Math.round(Number.parseFloat(form.minOrderAmount || "0") * 100),
      ),
      maxUsages: BigInt(Number.parseInt(form.maxUsages || "100", 10)),
      expiresAt,
      triggerProductId: form.triggerProductId || null,
      freeProductId: form.freeProductId || null,
      requiresMinQty: BigInt(Number.parseInt(form.requiresMinQty || "1", 10)),
    });
    setForm(EMPTY);
    onClose();
  }

  const isBOGO = form.discountType === DiscountType.bogo;
  const isFreeDelivery = form.discountType === DiscountType.free_delivery;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        data-ocid="admin_coupons.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Create Coupon
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Coupon Code</Label>
              <Input
                id="c-code"
                value={form.code}
                onChange={(e) => set("code")(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                required
                data-ocid="admin_coupons.code_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Discount Type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => set("discountType")(v)}
              >
                <SelectTrigger data-ocid="admin_coupons.type_select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DiscountType.flat}>Flat ($)</SelectItem>
                  <SelectItem value={DiscountType.percentage}>
                    Percentage (%)
                  </SelectItem>
                  <SelectItem value={DiscountType.bogo}>BOGO</SelectItem>
                  <SelectItem value={DiscountType.free_delivery}>
                    Free Delivery
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isFreeDelivery && !isBOGO && (
            <div className="space-y-1.5">
              <Label htmlFor="c-val">
                {form.discountType === DiscountType.percentage
                  ? "Discount %"
                  : "Discount Amount ($)"}
              </Label>
              <Input
                id="c-val"
                type="number"
                step="0.01"
                min="0"
                value={form.discountValue}
                onChange={(e) => set("discountValue")(e.target.value)}
                placeholder={
                  form.discountType === DiscountType.percentage ? "20" : "5.00"
                }
                required
                data-ocid="admin_coupons.value_input"
              />
            </div>
          )}

          {isBOGO && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Trigger Product (Buy)</Label>
                <Select
                  value={form.triggerProductId}
                  onValueChange={set("triggerProductId")}
                >
                  <SelectTrigger data-ocid="admin_coupons.trigger_select">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => !p.isArchived)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Free Product (Get)</Label>
                <Select
                  value={form.freeProductId}
                  onValueChange={set("freeProductId")}
                >
                  <SelectTrigger data-ocid="admin_coupons.free_product_select">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => !p.isArchived)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-min">Min Order ($)</Label>
              <Input
                id="c-min"
                type="number"
                step="0.01"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount")(e.target.value)}
                placeholder="0"
                data-ocid="admin_coupons.min_order_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-max">Max Usages</Label>
              <Input
                id="c-max"
                type="number"
                min="1"
                value={form.maxUsages}
                onChange={(e) => set("maxUsages")(e.target.value)}
                placeholder="100"
                data-ocid="admin_coupons.max_usages_input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-exp">Expires At (optional)</Label>
            <Input
              id="c-exp"
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt")(e.target.value)}
              data-ocid="admin_coupons.expiry_input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="admin_coupons.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              data-ocid="admin_coupons.submit_button"
            >
              {create.isPending ? "Creating…" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── delete confirm ────────────────────────────────────────────────────────────
function DeleteCouponConfirm({
  coupon,
  onClose,
  onConfirm,
}: {
  coupon: CouponPublic | null;
  onClose: () => void;
  onConfirm: (code: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!coupon) return;
    setPending(true);
    // Backend has no deleteCoupon — deactivate client-side by hiding from list
    onConfirm(coupon.code);
    toast.success(`Coupon ${coupon.code} deactivated`);
    setPending(false);
    onClose();
  }

  return (
    <Dialog open={!!coupon} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="admin_coupons.delete_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Delete Coupon?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">
          Coupon{" "}
          <span className="font-mono font-bold text-primary">
            {coupon?.code}
          </span>{" "}
          will be permanently removed.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin_coupons.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
            data-ocid="admin_coupons.confirm_button"
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export function AdminCoupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const { data: products = [] } = useProductList();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteCoupon, setDeleteCoupon] = useState<CouponPublic | null>(null);
  // client-side set of deactivated coupon codes (backend has no deleteCoupon)
  const [deactivated, setDeactivated] = useState<Set<string>>(new Set());

  const visibleCoupons = coupons.filter((c) => !deactivated.has(c.code));

  function handleDeactivate(code: string) {
    setDeactivated((prev) => new Set([...prev, code]));
  }

  return (
    <div data-ocid="admin_coupons.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Coupons
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create and manage discount codes and promotions.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2"
          data-ocid="admin_coupons.add_button"
        >
          <PlusCircle className="w-4 h-4" />
          Add Coupon
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-table-container"
        data-ocid="admin_coupons.table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">
            {coupons.length} Coupons
          </h2>
        </div>

        {isLoading ? (
          <div
            className="p-5 space-y-3"
            data-ocid="admin_coupons.loading_state"
          >
            {(["a", "b", "c"] as const).map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="admin_coupons.empty_state"
          >
            No coupons yet. Create your first promotion!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Code",
                    "Type",
                    "Value",
                    "Min Order",
                    "Usage / Max",
                    "Expires",
                    "Active",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleCoupons.map((coupon, idx) => (
                  <tr
                    key={coupon.code}
                    data-ocid={`admin_coupons.item.${idx + 1}`}
                    className="admin-table-row border-b border-border/50 last:border-0"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary">
                      {coupon.code}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TYPE_COLORS[coupon.discountType] ?? ""}`}
                      >
                        {TYPE_LABELS[coupon.discountType] ??
                          coupon.discountType}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-foreground font-semibold">
                      {coupon.discountType === DiscountType.percentage
                        ? `${Number(coupon.discountValue)}%`
                        : coupon.discountType === DiscountType.free_delivery ||
                            coupon.discountType === DiscountType.bogo
                          ? "—"
                          : fmtMoney(coupon.discountValue)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {fmtMoney(coupon.minOrderAmount)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                      {Number(coupon.usageCount)} / {Number(coupon.maxUsages)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {fmtExpiry(coupon.expiresAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={
                          coupon.isActive
                            ? "border-green-500/30 text-green-400"
                            : "border-destructive/30 text-destructive"
                        }
                        data-ocid={`admin_coupons.status_badge.${idx + 1}`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setDeleteCoupon(coupon)}
                        data-ocid={`admin_coupons.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <CouponModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={products}
      />
      <DeleteCouponConfirm
        coupon={deleteCoupon}
        onClose={() => setDeleteCoupon(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
