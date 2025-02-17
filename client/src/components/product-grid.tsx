import { Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden group">
          <div className="relative aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-muted-foreground">
              ${Number(product.price).toFixed(2)}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => addToCartMutation.mutate(product.id)}
              disabled={addToCartMutation.isPending}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteMutation.mutate(product.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
