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
import { motion, AnimatePresence } from "framer-motion";

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
  const { data: cartItems = [], isLoading, refetch } = useQuery<CartItem[]>({
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
    onError: (error: Error) => {
      toast({
        title: "Error removing item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity < 1 || quantity > 100) {
        throw new Error("Quantity must be between 1 and 100");
      }
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Quantity updated",
        description: "Cart item quantity has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating quantity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full flex flex-col"
        >
          <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Skeleton className="h-20 w-20 animate-pulse" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-2/3 mb-2 animate-pulse" />
                      <Skeleton className="h-4 w-1/3 animate-pulse" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : cartItems.length === 0 ? (
              <motion.p 
                className="text-muted-foreground text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Your cart is empty
              </motion.p>
            ) : (
              <AnimatePresence>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      className="flex gap-4"
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="relative aspect-square w-20 h-20 overflow-hidden rounded-md">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium hover:text-primary transition-colors duration-300">
                          {item.product.name}
                        </h3>
                        <p className="text-muted-foreground bg-gradient-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">
                          ${Number(item.product.price).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:border-primary hover:text-primary transition-colors duration-300"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            disabled={
                              updateQuantityMutation.isPending || item.quantity <= 1
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <motion.span 
                            key={item.quantity}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            className="w-8 text-center font-medium"
                          >
                            {item.quantity}
                          </motion.span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:border-primary hover:text-primary transition-colors duration-300"
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                id: item.id,
                                quantity: Math.min(100, item.quantity + 1),
                              })
                            }
                            disabled={
                              updateQuantityMutation.isPending || item.quantity >= 100
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 ml-auto hover:scale-105 active:scale-95 transition-transform duration-150"
                            onClick={() => removeMutation.mutate(item.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </ScrollArea>
          <motion.div 
            className="mt-auto pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Separator className="mb-4" />
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total</span>
              <motion.span 
                key={total}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-medium bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              >
                ${total.toFixed(2)}
              </motion.span>
            </div>
            <Button 
              className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150" 
              disabled={cartItems.length === 0}
            >
              Checkout
            </Button>
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}