import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllReviews } from "@/hooks/use-reviews";
import { Star } from "lucide-react";
import { motion } from "motion/react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
}

export function AdminReviewsPage() {
  const { data: reviews, isLoading } = useAllReviews();

  const avgRating =
    reviews && reviews.length > 0
      ? (
          reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6" data-ocid="admin.reviews.page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Customer Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All submitted order reviews
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-display font-bold text-primary">
            {avgRating}
          </p>
          <p className="text-xs text-muted-foreground">avg rating</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].slice(0, 3).map((rating) => {
          const count = (reviews ?? []).filter(
            (r) => r.overallRating === rating,
          ).length;
          return (
            <Card key={rating} className="bg-card border-border text-center">
              <CardContent className="pt-4 pb-3">
                <StarRating rating={rating} />
                <p className="text-2xl font-display font-bold text-foreground mt-1">
                  {count}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reviews list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            All Reviews
            <Badge variant="secondary" className="ml-2 text-xs">
              {reviews?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : !reviews || reviews.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.reviews.empty_state"
            >
              <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No reviews submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl border border-border/60 bg-muted/20"
                  data-ocid={`admin.reviews.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarRating rating={review.overallRating} />
                        <span className="text-xs text-muted-foreground">
                          Order #{review.orderId.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-foreground mt-1.5">
                          {review.comment}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(
                        Number(review.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 mt-2">
                    Customer: {review.customerId.slice(0, 16)}…
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
