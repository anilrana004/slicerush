import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAllBanners,
  useCreateBanner,
  useDeleteBanner,
  useToggleBannerActive,
  useUpdateBanner,
} from "@/hooks/use-banners";
import { ExternalLink, Image, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PromoBanner } from "../../types";

interface BannerFormData {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  couponCode: string;
  priority: string;
}

const EMPTY_FORM: BannerFormData = {
  title: "",
  description: "",
  imageUrl: "",
  ctaText: "",
  ctaLink: "",
  couponCode: "",
  priority: "0",
};

function BannerFormDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: PromoBanner | null;
}) {
  const [form, setForm] = useState<BannerFormData>(
    editing
      ? {
          title: editing.title,
          description: editing.description,
          imageUrl: editing.imageUrl,
          ctaText: editing.ctaText,
          ctaLink: editing.ctaLink,
          couponCode: editing.couponCode ?? "",
          priority: String(editing.priority),
        }
      : EMPTY_FORM,
  );
  const { mutate: create, isPending: creating } = useCreateBanner();
  const { mutate: update, isPending: updating } = useUpdateBanner();
  const isPending = creating || updating;

  function handleSave() {
    const payload = {
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl,
      ctaText: form.ctaText,
      ctaLink: form.ctaLink,
      couponCode: form.couponCode || null,
      priority: Number(form.priority) || 0,
    };
    if (editing) {
      update({ id: editing.id, ...payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  }

  function set(field: keyof BannerFormData, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-lg"
        data-ocid="admin.banners.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Edit Banner" : "New Banner"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Summer Special"
                data-ocid="admin.banners.title_input"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Get 20% off all pizzas this weekend"
                rows={2}
                data-ocid="admin.banners.description_input"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://..."
                data-ocid="admin.banners.image_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CTA Text</Label>
              <Input
                value={form.ctaText}
                onChange={(e) => set("ctaText", e.target.value)}
                placeholder="Order Now"
                data-ocid="admin.banners.cta_text_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>CTA Link</Label>
              <Input
                value={form.ctaLink}
                onChange={(e) => set("ctaLink", e.target.value)}
                placeholder="/menu"
                data-ocid="admin.banners.cta_link_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coupon Code (optional)</Label>
              <Input
                value={form.couponCode}
                onChange={(e) => set("couponCode", e.target.value)}
                placeholder="SUMMER20"
                data-ocid="admin.banners.coupon_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                min={0}
                data-ocid="admin.banners.priority_input"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isPending || !form.title}
              data-ocid="admin.banners.submit_button"
            >
              {isPending
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Create Banner"}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              data-ocid="admin.banners.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminBannersPage() {
  const { data: banners, isLoading } = useAllBanners();
  const { mutate: deleteBanner } = useDeleteBanner();
  const { mutate: toggleActive } = useToggleBannerActive();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PromoBanner | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(banner: PromoBanner) {
    setEditing(banner);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6" data-ocid="admin.banners.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Promo Banners
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage homepage promotional banners
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          data-ocid="admin.banners.create_button"
        >
          <Plus className="w-4 h-4" />
          New Banner
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            All Banners
            <Badge variant="secondary" className="ml-2 text-xs">
              {banners?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : !banners || banners.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.banners.empty_state"
            >
              <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No banners created yet.</p>
              <Button
                variant="link"
                onClick={openCreate}
                className="mt-2"
                data-ocid="admin.banners.empty_create_button"
              >
                Create your first banner
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {banners.map((banner, idx) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-muted/20"
                  data-ocid={`admin.banners.item.${idx + 1}`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {banner.title}
                      </p>
                      {banner.couponCode && (
                        <Badge variant="outline" className="text-xs">
                          {banner.couponCode}
                        </Badge>
                      )}
                      <Badge
                        className={`text-xs ${banner.isActive ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"}`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {banner.description}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground/60">
                        {banner.ctaText} → {banner.ctaLink}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() => toggleActive(banner.id)}
                      data-ocid={`admin.banners.toggle.${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(banner)}
                      className="h-8 w-8"
                      data-ocid={`admin.banners.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteBanner(banner.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive/80"
                      data-ocid={`admin.banners.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BannerFormDialog open={formOpen} onClose={closeForm} editing={editing} />
    </div>
  );
}
