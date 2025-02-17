import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProductGrid from "@/components/product-grid";
import CartSidebar from "@/components/cart-sidebar";
import ProductForm from "@/components/product-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            E-Commerce Store
          </h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCartOpen(true)}
            >
              Cart
            </Button>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <ProductGrid products={products} isLoading={isLoading} />
      </main>

      {/* Product Form Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <ProductForm onSuccess={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Cart Sidebar */}
      <CartSidebar open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
