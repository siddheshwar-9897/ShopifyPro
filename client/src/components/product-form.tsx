import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const productSchema = insertProductSchema.extend({
  price: insertProductSchema.shape.price.transform((val) => val.toString()),
});

interface ProductFormProps {
  onSuccess?: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      image: "",
      inventory: 0,
      description: "",
      category: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: typeof productSchema._type) => {
      return apiRequest("POST", "/api/products", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "New product has been added successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-h-[80vh] overflow-y-auto px-1">
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl">Add New Product</DialogTitle>
        <DialogDescription>
          Fill in the product details below. All fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-6"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} className="w-full" />
                  </FormControl>
                  <FormDescription>
                    Use letters, numbers, spaces, hyphens, and underscores only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="999999.99"
                      placeholder="0.00"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a price between $0.01 and $999,999.99
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="inventory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Inventory *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the initial stock quantity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Product category"
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: categorize your product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Product description"
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Optional: describe your product (10-1000 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://..."
                    {...field}
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Must be a secure HTTPS URL for product image
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Create Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
}