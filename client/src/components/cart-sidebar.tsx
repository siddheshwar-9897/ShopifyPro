import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
}

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-20" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Your cart is empty
            </p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative aspect-square w-20 h-20">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <p className="text-muted-foreground">
                      ${Number(item.product.price).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            id: item.id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            id: item.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={updateQuantityMutation.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 ml-auto"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <div className="flex justify-between mb-4">
            <span className="font-medium">Total</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          <Button className="w-full" disabled={cartItems.length === 0}>
            Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}