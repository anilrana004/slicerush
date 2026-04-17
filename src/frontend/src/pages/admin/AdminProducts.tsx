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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Eye,
  EyeOff,
  Package,
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { createActor } from "../../backend";
import { Crust, Size } from "../../backend";
import type { Category, Product, ProductUpdate } from "../../backend.d";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: bigint) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

// ── hooks ─────────────────────────────────────────────────────────────────────
function useProducts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Product[]>({
    queryKey: ["admin", "products"],
    queryFn: async () => (actor ? actor.getProducts() : []),
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

function useCategories() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn: async () => (actor ? actor.getCategories() : []),
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: { id: string; updates: ProductUpdate }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProduct(id, updates);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product updated");
    },
    onError: () => toast.error("Failed to update product"),
  });
}

function useCreateProduct() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Not connected");
      return actor.createProduct(product);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product created");
    },
    onError: () => toast.error("Failed to create product"),
  });
}

function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product archived");
    },
    onError: () => toast.error("Failed to archive product"),
  });
}

// ── product form ──────────────────────────────────────────────────────────────
interface ProductFormData {
  name: string;
  description: string;
  basePrice: string;
  categoryId: string;
  imageUrl: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  basePrice: "",
  categoryId: "",
  imageUrl: "",
};

function productToForm(p: Product): ProductFormData {
  return {
    name: p.name,
    description: p.description,
    basePrice: (Number(p.basePrice) / 100).toFixed(2),
    categoryId: p.categoryId,
    imageUrl: p.imageUrl,
  };
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  editProduct?: Product;
}

function ProductModal({
  open,
  onClose,
  categories,
  editProduct,
}: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(
    editProduct ? productToForm(editProduct) : EMPTY_FORM,
  );
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isPending = create.isPending || update.isPending;

  const set = (k: keyof ProductFormData) => (v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceInCents = BigInt(
      Math.round(Number.parseFloat(form.basePrice || "0") * 100),
    );
    if (editProduct) {
      await update.mutateAsync({
        id: editProduct.id,
        updates: {
          name: form.name,
          description: form.description,
          basePrice: priceInCents,
          categoryId: form.categoryId,
          imageUrl: form.imageUrl,
        },
      });
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: form.name,
        description: form.description,
        basePrice: priceInCents,
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
        isAvailable: true,
        isArchived: false,
        rating: 0,
        ratingCount: BigInt(0),
        addOns: [],
        sizes: [
          { size: Size.small, priceMultiplier: 0.7, displayName: 'Small 9"' },
          {
            size: Size.medium,
            priceMultiplier: 1.0,
            displayName: 'Medium 12"',
          },
          { size: Size.large, priceMultiplier: 1.3, displayName: 'Large 15"' },
        ],
        crusts: [
          {
            crust: Crust.thin,
            extraPrice: BigInt(0),
            displayName: "Thin Crust",
          },
          {
            crust: Crust.hand_tossed,
            extraPrice: BigInt(0),
            displayName: "Hand Tossed",
          },
          {
            crust: Crust.stuffed,
            extraPrice: BigInt(250),
            displayName: "Stuffed Crust +$2.50",
          },
        ],
      };
      await create.mutateAsync(newProduct);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg bg-card border-border"
        data-ocid="admin_products.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {editProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              placeholder="Pepperoni Passion"
              required
              data-ocid="admin_products.name_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="A delicious pizza with…"
              rows={2}
              data-ocid="admin_products.textarea"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Base Price ($)</Label>
              <Input
                id="p-price"
                type="number"
                step="0.01"
                min="0"
                value={form.basePrice}
                onChange={(e) => set("basePrice")(e.target.value)}
                placeholder="15.99"
                required
                data-ocid="admin_products.price_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={set("categoryId")}>
                <SelectTrigger data-ocid="admin_products.category_select">
                  <SelectValue placeholder="Pick category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-img">Image URL</Label>
            <Input
              id="p-img"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl")(e.target.value)}
              placeholder="https://…"
              data-ocid="admin_products.image_input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="admin_products.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="admin_products.submit_button"
            >
              {isPending
                ? "Saving…"
                : editProduct
                  ? "Save Changes"
                  : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const del = useDeleteProduct();
  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm bg-card border-border"
        data-ocid="admin_products.delete_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Archive Product?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">
          "{product?.name}" will be hidden from the menu. This can be undone.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin_products.cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={del.isPending}
            data-ocid="admin_products.confirm_button"
            onClick={async () => {
              if (product) {
                await del.mutateAsync(product.id);
                onClose();
              }
            }}
          >
            {del.isPending ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export function AdminProducts() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const updateProduct = useUpdateProduct();

  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const visible = products.filter((p) => showArchived || !p.isArchived);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  function openCreate() {
    setEditProduct(undefined);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setModalOpen(true);
  }

  return (
    <div data-ocid="admin_products.page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your menu items, pricing, and availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="show-archived"
            className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
          >
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
              data-ocid="admin_products.archived_toggle"
            />
            Show archived
          </label>
          <Button
            onClick={openCreate}
            className="gap-2"
            data-ocid="admin_products.add_button"
          >
            <PlusCircle className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-table-container"
        data-ocid="admin_products.table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">
            {visible.length} Products
          </h2>
        </div>

        {isLoading ? (
          <div
            className="p-5 space-y-3"
            data-ocid="admin_products.loading_state"
          >
            {(["a", "b", "c", "d"] as const).map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground text-sm"
            data-ocid="admin_products.empty_state"
          >
            No products found. Add your first menu item!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Add-ons
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...visible]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p, idx) => (
                    <tr
                      key={p.id}
                      data-ocid={`admin_products.item.${idx + 1}`}
                      className="admin-table-row border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {categoryMap[p.categoryId] ?? p.categoryId}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                        {fmt(p.basePrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {p.addOns.length}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {p.isArchived ? (
                            <Badge
                              variant="outline"
                              className="border-muted text-muted-foreground gap-1"
                            >
                              <Archive className="w-3 h-3" /> Archived
                            </Badge>
                          ) : p.isAvailable ? (
                            <Badge
                              variant="outline"
                              className="border-green-500/30 text-green-400"
                            >
                              Available
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-destructive/30 text-destructive"
                            >
                              Unavailable
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title={
                              p.isAvailable
                                ? "Set unavailable"
                                : "Set available"
                            }
                            data-ocid={`admin_products.toggle_button.${idx + 1}`}
                            onClick={() =>
                              updateProduct.mutate({
                                id: p.id,
                                updates: { isAvailable: !p.isAvailable },
                              })
                            }
                          >
                            {p.isAvailable ? (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-ocid={`admin_products.edit_button.${idx + 1}`}
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            data-ocid={`admin_products.delete_button.${idx + 1}`}
                            onClick={() => setDeleteProduct(p)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        editProduct={editProduct}
      />
      <DeleteConfirm
        product={deleteProduct}
        onClose={() => setDeleteProduct(null)}
      />
    </div>
  );
}
