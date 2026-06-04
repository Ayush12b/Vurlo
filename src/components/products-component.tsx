import { useState, useEffect } from "react";
import { collection, getDocs, doc, addDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { formatPrice } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { getProductImage, getProductSlug } from "@/utils/product";
import { Loader2, Plus, Edit2, Trash2, Eye, EyeOff, X, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  tag?: string | null;
  active?: boolean;
  isOnSale?: boolean;
  onSale?: boolean;
  originalPrice?: number;
  discountPercentage?: number;
  discountPercent?: number;
  isFeatured?: boolean;
  isNew?: boolean;
  category?: string;
  stock?: number;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  badge?: string | null;
  slug?: string;
  features?: string[];
  tags?: string[];
  variants?: { name: string; images: string[] }[];
  defaultVariant?: string;
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [category, setCategory] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [stock, setStock] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [featuresText, setFeaturesText] = useState("");
  const [badge, setBadge] = useState("");

  // Variant Management states
  const [localVariants, setLocalVariants] = useState<{ name: string; images: string[] }[]>([]);
  const [editingVariantName, setEditingVariantName] = useState<string>("Galaxy");
  const [variantUrlInput, setVariantUrlInput] = useState("");
  const [newVariantName, setNewVariantName] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Fetch Products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["admin", "products"],
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let feat = data.isFeatured || false;
        let nw = data.isNew || false;

        // Auto migration logic for database fetch
        if (data.tag) {
          const t = String(data.tag).toUpperCase();
          if (t === "FEATURED") feat = true;
          if (t === "NEW") nw = true;
          // Only migrate if isFeatured/isNew not already set
          if (data.isFeatured === undefined && data.isNew === undefined) {
            setDoc(
              doc(db, "products", docSnap.id),
              { isFeatured: feat, isNew: nw, tag: null },
              { merge: true },
            ).catch(console.error);
          }
        }

        const imgUrl = getProductImage(data);

        return {
          id: docSnap.id,
          name: data.name || "",
          price: data.price ?? 0,
          image: imgUrl,
          images: Array.isArray(data.images)
            ? data.images
            : (data.images && typeof data.images === "object")
              ? data.images
              : data.image ? [data.image] : [],
          tag: data.tag || null,
          active: data.active !== false, // default to true
          isOnSale: data.isOnSale !== undefined ? data.isOnSale : data.onSale || false,
          onSale: data.onSale !== undefined ? data.onSale : data.isOnSale || false,
          originalPrice: data.originalPrice || 0,
          discountPercentage:
            data.discountPercentage !== undefined
              ? data.discountPercentage
              : data.discountPercent || 0,
          discountPercent:
            data.discountPercent !== undefined
              ? data.discountPercent
              : data.discountPercentage || 0,
          isFeatured: feat,
          isNew: nw,
          category: data.category || "RGB Lights",
          stock: data.stock !== undefined ? Number(data.stock) : 10,
          description: data.description || "",
          rating: data.rating !== undefined ? Number(data.rating) : undefined,
          reviewsCount: data.reviewsCount !== undefined ? Number(data.reviewsCount) : undefined,
          badge: data.badge || null,
          slug: data.slug || "",
          features: Array.isArray(data.features) ? data.features : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          variants: Array.isArray(data.variants) ? data.variants : undefined,
          defaultVariant: data.defaultVariant || undefined,
        };
      });
    },
  });

  // 2. Add Product Mutation
  const addMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id">) => {
      await addDoc(collection(db, "products"), newProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // also invalidate customer view
      toast.success("Product added successfully!");
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to add product.");
    },
  });

  // 3. Edit Product Mutation
  const editMutation = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      if (!updatedProduct.id) throw new Error("Missing productId");
      const { id, ...data } = updatedProduct;
      const updateData = Object.fromEntries(
        Object.entries({
          ...data,
          stock: Number(data.stock),
          tag: data.tag ?? null,
          badge: data.badge ?? null,
        }).filter(([key, value]) => {
          if (value === undefined) return false;
          // Never overwrite image with empty or fallback
          if (key === "image" && (value === "" || value === "/fallback.jpg")) return false;
          // Never overwrite images with empty array
          if (key === "images" && Array.isArray(value) && value.length === 0) return false;
          // Never overwrite images with empty variant object {}
          if (key === "images" && value && typeof value === "object" && !Array.isArray(value) && Object.keys(value as any).length === 0) return false;
          // Never overwrite images with variant object where ALL variant arrays are empty
          if (key === "images" && value && typeof value === "object" && !Array.isArray(value)) {
            const hasAny = Object.values(value as any).some(arr => Array.isArray(arr) && arr.length > 0);
            if (!hasAny) return false;
          }
          return true;
        }),
      );
      try {
        await updateDoc(doc(db, "products", id), updateData);
      } catch (err) {
        console.error("Stock/product update failed:", err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully!");
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update product.");
    },
  });

  // 4. Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "products", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
      setIsDeleteModalOpen(false);
      setCurrentProduct(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete product.");
    },
  });

  // 5. Toggle Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await updateDoc(doc(db, "products", id), { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product visibility updated!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update status.");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
    setIsFeatured(false);
    setIsNew(false);
    setCategory("");
    setIsOnSale(false);
    setOriginalPrice("");
    setDiscountPercentage("");
    setStock("");
    setTag(null);
    setActive(true);
    setImagesList([]);
    setLocalVariants([]);
    setEditingVariantName("Galaxy");
    setVariantUrlInput("");
    setNewVariantName("");
    setCurrentProduct(null);
    setFeaturesText("");
    setBadge("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setCurrentProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(String(product.price));
    setImage("");
    setIsFeatured(product.isFeatured || false);
    setIsNew(product.isNew || false);
    setCategory(product.category || "RGB Lights");
    setIsOnSale(product.isOnSale || false);
    setOriginalPrice(product.originalPrice ? String(product.originalPrice) : "");
    setDiscountPercentage(product.discountPercentage ? String(product.discountPercentage) : "");
    setStock(product.stock !== undefined ? String(product.stock) : "10");
    setTag(product.tag || null);
    setActive(product.active !== false);
    setFeaturesText(Array.isArray(product.features) ? product.features.join("\n") : "");
    setBadge(product.badge || "");

    const isVar = product.images && typeof product.images === "object" && !Array.isArray(product.images);
    if (isVar) {
      const imgObj = product.images as unknown as Record<string, string[]>;
      const vars = Object.keys(imgObj).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        images: imgObj[key] || []
      }));
      setLocalVariants(vars);
      setEditingVariantName(vars[0]?.name || "Galaxy");
      setImagesList([]);
    } else {
      setLocalVariants([]);
      // Only load real URLs — never load fallback.jpg into imagesList
      const rawImgs = Array.isArray(product.images) ? product.images : [];
      const cleanImgs = rawImgs.filter((img: string) => img && img.trim() !== "" && img !== "/fallback.jpg");
      setImagesList(cleanImgs);
    }
    setVariantUrlInput("");
    setIsEditModalOpen(true);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setImagesList((prev) => [...prev, downloadUrl]);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Error uploading image:", err);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleUploadVariantFiles = async (e: React.ChangeEvent<HTMLInputElement>, variantName: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate count limit
    const activeVar = localVariants.find(v => v.name.toLowerCase() === variantName.toLowerCase());
    const currentCount = activeVar?.images?.length || 0;
    if (currentCount + fileArray.length > 8) {
      toast.error(`Cannot exceed maximum of 8 images. You tried to upload ${fileArray.length} but can only add ${8 - currentCount} more.`);
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      setLocalVariants((prev) => {
        return prev.map((v) => {
          if (v.name.toLowerCase() === variantName.toLowerCase()) {
            const combined = [...v.images, ...uploadedUrls];
            // Filter duplicates
            const unique = combined.filter((img, idx) => combined.indexOf(img) === idx);
            return { ...v, images: unique };
          }
          return v;
        });
      });
      toast.success(`Uploaded ${fileArray.length} image(s) to ${variantName} variant!`);
    } catch (err) {
      console.error("Error uploading variant images:", err);
      toast.error("Failed to upload image(s).");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddVariantUrl = (variantName: string) => {
    const trimmed = variantUrlInput.trim();
    if (!trimmed) return;

    setLocalVariants((prev) => {
      return prev.map((v) => {
        if (v.name.toLowerCase() === variantName.toLowerCase()) {
          if (v.images.includes(trimmed)) {
            toast.error("This image URL already exists in this variant.");
            return v;
          }
          if (v.images.length >= 8) {
            toast.error("Maximum 8 images allowed per variant.");
            return v;
          }
          return { ...v, images: [...v.images, trimmed] };
        }
        return v;
      });
    });
    setVariantUrlInput("");
    toast.success("Image URL added to variant!");
  };

  const handleRemoveVariantImage = (variantName: string, indexToRemove: number) => {
    setLocalVariants((prev) => {
      return prev.map((v) => {
        if (v.name.toLowerCase() === variantName.toLowerCase()) {
          const filtered = v.images.filter((_, idx) => idx !== indexToRemove);
          return { ...v, images: filtered };
        }
        return v;
      });
    });
    toast.success("Image removed from variant");
  };

  const handleMoveVariantImage = (variantName: string, index: number, direction: "up" | "down" | "cover") => {
    setLocalVariants((prev) => {
      return prev.map((v) => {
        if (v.name.toLowerCase() === variantName.toLowerCase()) {
          const list = [...v.images];
          if (direction === "cover") {
            const [item] = list.splice(index, 1);
            list.unshift(item);
          } else if (direction === "up" && index > 0) {
            const temp = list[index];
            list[index] = list[index - 1];
            list[index - 1] = temp;
          } else if (direction === "down" && index < list.length - 1) {
            const temp = list[index];
            list[index] = list[index + 1];
            list[index + 1] = temp;
          }
          return { ...v, images: list };
        }
        return v;
      });
    });
  };

  const handleMoveProductImage = (index: number, direction: "up" | "down" | "cover") => {
    setImagesList((prev) => {
      const list = [...prev];
      if (direction === "cover") {
        const [item] = list.splice(index, 1);
        list.unshift(item);
      } else if (direction === "up" && index > 0) {
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
      } else if (direction === "down" && index < list.length - 1) {
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
      }
      return list;
    });
  };

  const handleOpenDelete = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name cannot be empty.");
      return;
    }

    let finalPrice = 0;
    let finalOriginalPrice = 0;
    let finalDiscountPercentage = 0;

    if (isOnSale) {
      const origPrice = parseFloat(originalPrice);
      const discount = parseFloat(discountPercentage);
      if (isNaN(origPrice) || origPrice <= 0) {
        toast.error("Original price must be greater than zero.");
        return;
      }
      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error("Discount percentage must be between 0 and 100.");
        return;
      }
      finalOriginalPrice = origPrice;
      finalDiscountPercentage = discount;
      finalPrice = Math.round(origPrice * (1 - discount / 100));
      if (finalPrice <= 0) {
        toast.error("Calculated sale price must be greater than zero.");
        return;
      }
    } else {
      const stdPrice = parseFloat(price);
      if (isNaN(stdPrice) || stdPrice <= 0) {
        toast.error("Price must be a valid positive number greater than zero.");
        return;
      }
      finalPrice = stdPrice;
    }

    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Stock quantity must be a valid non-negative integer.");
      return;
    }
    const finalStock = parsedStock;

    if (!category) {
      toast.error("Please select a product category.");
      return;
    }

    const finalImage = imagesList[0] || "/fallback.jpg";
    const finalFeatures = featuresText.split("\n").map((f) => f.trim()).filter(Boolean);

    addMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      price: finalPrice,
      image: finalImage,
      images: imagesList.length > 0 ? imagesList : [finalImage],
      isFeatured,
      isNew,
      category: category.trim(),
      active,
      isOnSale,
      onSale: isOnSale,
      originalPrice: finalOriginalPrice,
      discountPercentage: finalDiscountPercentage,
      discountPercent: finalDiscountPercentage,
      stock: finalStock,
      tag: tag || null,
      features: finalFeatures,
      badge: badge.trim() || null,
      slug: getProductSlug(name.trim()),
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    if (!name.trim()) {
      toast.error("Product name cannot be empty.");
      return;
    }

    let finalPrice = 0;
    let finalOriginalPrice = 0;
    let finalDiscountPercentage = 0;

    if (isOnSale) {
      const origPrice = parseFloat(originalPrice);
      const discount = parseFloat(discountPercentage);
      if (isNaN(origPrice) || origPrice <= 0) {
        toast.error("Original price must be greater than zero.");
        return;
      }
      if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error("Discount percentage must be between 0 and 100.");
        return;
      }
      finalOriginalPrice = origPrice;
      finalDiscountPercentage = discount;
      finalPrice = Math.round(origPrice * (1 - discount / 100));
      if (finalPrice <= 0) {
        toast.error("Calculated sale price must be greater than zero.");
        return;
      }
    } else {
      const stdPrice = parseFloat(price);
      if (isNaN(stdPrice) || stdPrice <= 0) {
        toast.error("Price must be a valid positive number greater than zero.");
        return;
      }
      finalPrice = stdPrice;
    }

    const parsedStock = parseInt(stock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      toast.error("Stock quantity must be a valid non-negative integer.");
      return;
    }
    const finalStock = parsedStock;

    if (!category) {
      toast.error("Please select a product category.");
      return;
    }

    let finalImages: string[] | Record<string, string[]> | undefined = undefined;

    if (localVariants.length > 0) {
      const imgObj: Record<string, string[]> = {};
      localVariants.forEach((v) => {
        const key = v.name.toLowerCase();
        imgObj[key] = v.images;
      });
      // Only use if at least one variant has real images
      const hasAny = Object.values(imgObj).some(arr => arr.length > 0);
      if (hasAny) finalImages = imgObj;
    } else if (imagesList.length > 0) {
      finalImages = imagesList;
    }
    // If neither — leave as undefined so editMutation filter drops it (keeps existing Firestore value)

    const defaultImg = finalImages
      ? (
          Array.isArray(finalImages)
            ? finalImages[0]
            : Object.values(finalImages as Record<string, string[]>).find(arr => Array.isArray(arr) && arr.length > 0)?.[0]
        )
      : undefined;
    // Only set image field if we have a real URL — otherwise keep existing Firestore value

    const finalFeatures = featuresText.split("\n").map((f) => f.trim()).filter(Boolean);

    editMutation.mutate({
      id: currentProduct.id,
      name: name.trim(),
      description: description.trim(),
      price: finalPrice,
      ...(defaultImg ? { image: defaultImg } : {}),
      ...(finalImages !== undefined ? { images: finalImages } : {}),
      isFeatured,
      isNew,
      category: category.trim(),
      active,
      isOnSale,
      onSale: isOnSale,
      originalPrice: finalOriginalPrice,
      discountPercentage: finalDiscountPercentage,
      discountPercent: finalDiscountPercentage,
      stock: finalStock,
      tag: tag || null,
      badge: badge.trim() || null,
      slug: getProductSlug(name.trim()),
      features: finalFeatures,
      tags: currentProduct.tags || [],
      ...(currentProduct.rating !== undefined && { rating: currentProduct.rating }),
      ...(currentProduct.reviewsCount !== undefined && { reviewsCount: currentProduct.reviewsCount }),
      ...(currentProduct.defaultVariant ? { defaultVariant: currentProduct.defaultVariant } : {}),
    } as any);
  };

  const handleDeleteSubmit = () => {
    if (!currentProduct) return;
    deleteMutation.mutate(currentProduct.id);
  };

  const handleToggleActive = (product: Product) => {
    const nextState = product.active === false ? true : false;
    toggleActiveMutation.mutate({ id: product.id, active: nextState });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredProducts = products
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );



  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white/90">
            Product Catalog
          </h1>
          <p className="text-xs text-white/45">
            Add, edit, structure tags, and toggle visibility states.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="sm:w-auto text-xs font-bold uppercase tracking-wider h-11 px-6 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
          }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filter and search operations */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/40 text-white rounded-xl placeholder:text-white/20 h-10 pl-10 pr-10 text-xs tracking-wide focus:outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors duration-200 px-1 cursor-pointer focus:outline-none"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main product log table */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            <p className="text-xs text-white/45">Fetching catalog products...</p>
          </div>
        ) : !filteredProducts || filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-white/35">
            {searchQuery
              ? "No products match your search query."
              : "No products found in the database. Add one to start!"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <th className="pb-3 pl-2">Product</th>
                    <th className="pb-3">Tag</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Stock</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="text-xs text-white/70 hover:bg-white/[0.01]">
                      <td className="py-4 pl-2">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={resolveProductImage(p.image, p.name)}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-white/[0.03] border border-white/[0.06]"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                                "",
                                p.name,
                              );
                            }}
                          />
                          <div>
                            <p className="font-semibold text-white/90 leading-tight">{p.name}</p>
                            <p className="text-[9px] font-mono text-white/25 mt-1">
                              ID: {p.id.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/25 text-violet-400">
                              Featured
                            </span>
                          )}
                          {p.isNew && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                              New
                            </span>
                          )}
                          {p.isOnSale && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/25 text-red-400">
                              Sale
                            </span>
                          )}
                          {!p.isFeatured && !p.isNew && !p.isOnSale && (
                            <span className="text-white/20">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-white/80">
                        {p.isOnSale && p.originalPrice ? (
                          <div className="flex flex-col">
                            <span className="text-white/90">{formatPrice(p.price)}</span>
                            <span className="text-[10px] text-white/30 line-through font-normal">
                              {formatPrice(p.originalPrice)} (-{p.discountPercentage}%)
                            </span>
                          </div>
                        ) : (
                          formatPrice(p.price)
                        )}
                      </td>
                      <td className="py-4 font-semibold text-white/70">
                        {p.stock !== undefined ? p.stock : 10}
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleActive(p)}
                          disabled={toggleActiveMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer select-none transition-all duration-300 ${
                            p.active !== false
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                              : "bg-white/[0.03] border-white/[0.08] text-white/30"
                          } ${toggleActiveMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {p.active !== false ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-white/40 hover:text-violet-400 transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(p)}
                            className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 text-white/40 hover:text-red-400 transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.04] text-xs">
                <span className="text-white/35 font-medium">
                  Showing {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}-
                  {Math.min(filteredProducts.length, currentPage * itemsPerPage)} of{" "}
                  {filteredProducts.length} products
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 rounded-lg border border-white/10 bg-transparent text-xs hover:bg-white/[0.03] text-white/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    Previous
                  </Button>
                  <span className="text-white/60 font-semibold uppercase tracking-wider text-[10px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 rounded-lg border border-white/10 bg-transparent text-xs hover:bg-white/[0.03] text-white/80 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODALS (ADD PRODUCT) ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d16] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Add Catalog Product
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Product Name
                </label>
                <Input
                  type="text"
                  placeholder="Premium Noise-Cancelling Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Enter product description here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 p-3 text-xs min-h-[80px] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Features (One feature per line)
                </label>
                <textarea
                  placeholder="16 Color Changing Modes&#10;Soft Silicone Body (Kid Safe)"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 p-3 text-xs min-h-[100px] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 py-2.5 border-y border-white/[0.06] my-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="add-isFeatured"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-isNew"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="add-isNew"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    New Arrival
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-isOnSale"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="add-isOnSale"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    On Sale
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="add-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="add-active"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    Active status
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isOnSale ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                        Original Price (INR)
                      </label>
                      <Input
                        type="number"
                        placeholder="14999"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                        required={isOnSale}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                        Discount %
                      </label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                        required={isOnSale}
                      />
                    </div>
                    {originalPrice && discountPercentage && (
                      <div className="col-span-2 text-[10px] text-emerald-400 font-semibold mt-1">
                        Calculated Sale Price:{" "}
                        {formatPrice(
                          Math.round(
                            parseFloat(originalPrice) * (1 - parseFloat(discountPercentage) / 100),
                          ),
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                      Price (INR)
                    </label>
                    <Input
                      type="number"
                      placeholder="14999"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                      required={!isOnSale}
                    />
                  </div>
                )}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl h-10 px-3 text-xs focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-[#0f0f18] text-white/40">
                      Select Category
                    </option>
                    <option value="RGB Lights" className="bg-[#0f0f18]">
                      RGB Lights
                    </option>
                    <option value="Ambient Lamps" className="bg-[#0f0f18]">
                      Ambient Lamps
                    </option>
                    <option value="Bedroom Lighting" className="bg-[#0f0f18]">
                      Bedroom Lighting
                    </option>
                    <option value="Gaming Setup Lights" className="bg-[#0f0f18]">
                      Gaming Setup Lights
                    </option>
                    <option value="Aesthetic Decor" className="bg-[#0f0f18]">
                      Aesthetic Decor
                    </option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Tag
                  </label>
                  <select
                    value={tag || ""}
                    onChange={(e) => setTag(e.target.value || null)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl h-10 px-3 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0f0f18]">
                      No Tag
                    </option>
                    <option value="NEW" className="bg-[#0f0f18]">
                      NEW
                    </option>
                    <option value="FEATURED" className="bg-[#0f0f18]">
                      FEATURED
                    </option>
                    <option value="SALE" className="bg-[#0f0f18]">
                      SALE
                    </option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Badge (e.g. 16 Colors)
                  </label>
                  <Input
                    type="text"
                    placeholder="16 Colors"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Product Gallery Section */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block">
                  Product Gallery
                </label>

                {imagesList.length > 0 && (
                  <div className="grid grid-cols-4 gap-3.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01]">
                    {imagesList.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden aspect-square border border-white/10 bg-black/40 flex items-center justify-center"
                      >
                        <img
                          src={resolveProductImage(url)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                          {/* Make cover / move first */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "cover")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Make Cover"
                            disabled={idx === 0}
                          >
                            <Sparkles className="h-3 w-3 text-amber-400" />
                          </button>
                          {/* Move left/up */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "up")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Move Left"
                            disabled={idx === 0}
                          >
                            ←
                          </button>
                          {/* Move right/down */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "down")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Move Right"
                            disabled={idx === imagesList.length - 1}
                          >
                            →
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setImagesList((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded bg-red-500/80 hover:bg-red-600 text-white transition cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-emerald-500/90 text-[8px] font-bold text-white uppercase tracking-wider">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Paste Image URL..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (image.trim()) {
                          setImagesList((prev) => [...prev, image.trim()]);
                          setImage("");
                        }
                      }}
                      className="bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-semibold px-4 rounded-xl h-10 text-white cursor-pointer"
                    >
                      Add URL
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFile}
                      disabled={isUploading}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs pt-2"
                    />
                    {isUploading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-violet-400 font-semibold bg-black/60 px-2 py-1 rounded-md">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
                <Button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-transparent border border-white/10 hover:bg-white/[0.04] text-xs font-semibold px-5 rounded-xl h-10 text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMutation.isPending || isUploading}
                  className="text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-xl text-white transition-all duration-300 shadow-[0_4px_15px_rgba(124,58,237,0.25)] flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                  }}
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALS (EDIT PRODUCT) ── */}
      {isEditModalOpen && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d16] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Edit Product Details
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Product Name
                </label>
                <Input
                  type="text"
                  placeholder="Premium Noise-Cancelling Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Enter product description here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 p-3 text-xs min-h-[80px] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                  Features (One feature per line)
                </label>
                <textarea
                  placeholder="16 Color Changing Modes&#10;Soft Silicone Body (Kid Safe)"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 p-3 text-xs min-h-[100px] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 py-2.5 border-y border-white/[0.06] my-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="edit-isFeatured"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-isNew"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="edit-isNew"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    New Arrival
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-isOnSale"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="edit-isOnSale"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    On Sale
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded border-white/[0.08] bg-white/[0.02] text-violet-500 focus:ring-violet-500/50 cursor-pointer h-4 w-4"
                  />
                  <label
                    htmlFor="edit-active"
                    className="text-[11px] font-semibold text-white/70 select-none cursor-pointer"
                  >
                    Active status
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isOnSale ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                        Original Price (INR)
                      </label>
                      <Input
                        type="number"
                        placeholder="14999"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                        required={isOnSale}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                        Discount %
                      </label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                        required={isOnSale}
                      />
                    </div>
                    {originalPrice && discountPercentage && (
                      <div className="col-span-2 text-[10px] text-emerald-400 font-semibold mt-1">
                        Calculated Sale Price:{" "}
                        {formatPrice(
                          Math.round(
                            parseFloat(originalPrice) * (1 - parseFloat(discountPercentage) / 100),
                          ),
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                      Price (INR)
                    </label>
                    <Input
                      type="number"
                      placeholder="14999"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                      required={!isOnSale}
                    />
                  </div>
                )}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl h-10 px-3 text-xs focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-[#0f0f18] text-white/40">
                      Select Category
                    </option>
                    <option value="RGB Lights" className="bg-[#0f0f18]">
                      RGB Lights
                    </option>
                    <option value="Ambient Lamps" className="bg-[#0f0f18]">
                      Ambient Lamps
                    </option>
                    <option value="Bedroom Lighting" className="bg-[#0f0f18]">
                      Bedroom Lighting
                    </option>
                    <option value="Gaming Setup Lights" className="bg-[#0f0f18]">
                      Gaming Setup Lights
                    </option>
                    <option value="Aesthetic Decor" className="bg-[#0f0f18]">
                      Aesthetic Decor
                    </option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Tag
                  </label>
                  <select
                    value={tag || ""}
                    onChange={(e) => setTag(e.target.value || null)}
                    className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl h-10 px-3 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0f0f18]">
                      No Tag
                    </option>
                    <option value="NEW" className="bg-[#0f0f18]">
                      NEW
                    </option>
                    <option value="FEATURED" className="bg-[#0f0f18]">
                      FEATURED
                    </option>
                    <option value="SALE" className="bg-[#0f0f18]">
                      SALE
                    </option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Badge (e.g. 16 Colors)
                  </label>
                  <Input
                    type="text"
                    placeholder="16 Colors"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider">
                    Stock Quantity
                  </label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs"
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Product Gallery Section */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-bold text-white/45 uppercase tracking-wider block">
                  Product Gallery
                </label>

                {imagesList.length > 0 && (
                  <div className="grid grid-cols-4 gap-3.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.01]">
                    {imagesList.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden aspect-square border border-white/10 bg-black/40 flex items-center justify-center"
                      >
                        <img
                          src={resolveProductImage(url)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5">
                          {/* Make cover / move first */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "cover")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Make Cover"
                            disabled={idx === 0}
                          >
                            <Sparkles className="h-3 w-3 text-amber-400" />
                          </button>
                          {/* Move left/up */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "up")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Move Left"
                            disabled={idx === 0}
                          >
                            ←
                          </button>
                          {/* Move right/down */}
                          <button
                            type="button"
                            onClick={() => handleMoveProductImage(idx, "down")}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                            title="Move Right"
                            disabled={idx === imagesList.length - 1}
                          >
                            →
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setImagesList((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 rounded bg-red-500/80 hover:bg-red-600 text-white transition cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-emerald-500/90 text-[8px] font-bold text-white uppercase tracking-wider">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Paste Image URL..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (image.trim()) {
                          setImagesList((prev) => [...prev, image.trim()]);
                          setImage("");
                        }
                      }}
                      className="bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-semibold px-4 rounded-xl h-10 text-white cursor-pointer"
                    >
                      Add URL
                    </Button>
                  </div>

                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFile}
                      disabled={isUploading}
                      className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-10 px-3 text-xs pt-2"
                    />
                    {isUploading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-violet-400 font-semibold bg-black/60 px-2 py-1 rounded-md">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Variants (Galaxy / Moon / Saturn) Section */}
              <div className="space-y-3.5 border-t border-white/[0.06] pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">
                    Variant-Specific Galleries
                  </label>
                </div>

                {/* Add Variant Row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Galaxy)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    className="bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-9 px-3 text-xs flex-1 focus:outline-none"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const trimmed = newVariantName.trim();
                      if (!trimmed) return;
                      const alreadyExists = localVariants.some(v => v.name.toLowerCase() === trimmed.toLowerCase());
                      if (alreadyExists) { toast.error("Variant already exists."); return; }
                      const newVar = { name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1), images: [] };
                      setLocalVariants(prev => [...prev, newVar]);
                      setEditingVariantName(newVar.name);
                      setNewVariantName("");
                      toast.success(`Variant "${newVar.name}" added!`);
                    }}
                    className="bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 text-xs font-semibold px-3 rounded-xl h-9 text-violet-400 cursor-pointer"
                  >
                    + Add Variant
                  </Button>
                </div>

                {localVariants && localVariants.length > 0 && (
                  <>
                    {/* Variant selector tabs */}
                    <div className="flex flex-wrap gap-1.5 bg-white/[0.02] border border-white/[0.06] p-1 rounded-xl w-fit">
                      {localVariants.map((v) => {
                        const isEditingActive = v.name.toLowerCase() === editingVariantName.toLowerCase();
                        return (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => {
                              setEditingVariantName(v.name);
                              setVariantUrlInput("");
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer select-none focus:outline-none ${
                              isEditingActive
                                ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                                : "text-white/45 hover:text-white/70 border border-transparent"
                            }`}
                          >
                            {v.name} ({v.images?.length || 0})
                          </button>
                        );
                      })}
                    </div>

                  {/* Active Variant Editing Section */}
                  {(() => {
                    const activeEditingVar = localVariants.find(
                      (v) => v.name.toLowerCase() === editingVariantName.toLowerCase()
                    );
                    if (!activeEditingVar) return null;

                    return (
                      <div className="space-y-3 bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                            {activeEditingVar.name} Images
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-white/30">
                              {activeEditingVar.images?.length || 0} / 8 images
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLocalVariants(prev => prev.filter(v => v.name !== activeEditingVar.name));
                                const remaining = localVariants.filter(v => v.name !== activeEditingVar.name);
                                if (remaining.length > 0) setEditingVariantName(remaining[0].name);
                                toast.success(`Variant "${activeEditingVar.name}" removed.`);
                              }}
                              className="text-[9px] text-red-400/60 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-2 py-0.5 rounded-lg transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Image Previews grid */}
                        {activeEditingVar.images && activeEditingVar.images.length > 0 ? (
                          <div className="grid grid-cols-4 gap-3">
                            {activeEditingVar.images.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-lg overflow-hidden aspect-square border border-white/10 bg-black/40 flex items-center justify-center"
                              >
                                <img
                                  src={resolveProductImage(url)}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1">
                                  {/* Make cover / move first */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveVariantImage(activeEditingVar.name, idx, "cover")}
                                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition"
                                    title="Make Cover"
                                    disabled={idx === 0}
                                  >
                                    <Sparkles className="h-3 w-3 text-amber-400" />
                                  </button>
                                  {/* Move left/up */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveVariantImage(activeEditingVar.name, idx, "up")}
                                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition"
                                    title="Move Left"
                                    disabled={idx === 0}
                                  >
                                    ←
                                  </button>
                                  {/* Move right/down */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveVariantImage(activeEditingVar.name, idx, "down")}
                                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition"
                                    title="Move Right"
                                    disabled={idx === activeEditingVar.images.length - 1}
                                  >
                                    →
                                  </button>
                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariantImage(activeEditingVar.name, idx)}
                                    className="p-1 rounded bg-red-500/80 hover:bg-red-600 text-white transition animate-bounce-short"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                {idx === 0 && (
                                  <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-amber-500/90 text-[8px] font-bold text-white uppercase tracking-wider">
                                    Cover
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-white/10 rounded-lg text-white/30 text-xs">
                            No images uploaded for {activeEditingVar.name} variant.
                          </div>
                        )}

                        {/* Upload / Add controls for active variant */}
                        <div className="space-y-2 mt-3 pt-3 border-t border-white/[0.04]">
                          {/* Add URL */}
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder={`Paste Image URL for ${activeEditingVar.name}...`}
                              value={variantUrlInput}
                              onChange={(e) => setVariantUrlInput(e.target.value)}
                              className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-9 px-3 text-xs flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddVariantUrl(activeEditingVar.name)}
                              className="bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-semibold px-3 rounded-xl h-9 text-white cursor-pointer"
                            >
                              Add URL
                            </Button>
                          </div>

                          {/* Upload Multiple Files */}
                          <div className="relative">
                            <Input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleUploadVariantFiles(e, activeEditingVar.name)}
                              disabled={isUploading}
                              className="bg-white/[0.02] border-white/[0.06] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-9 px-3 text-xs pt-1.5"
                            />
                            {isUploading && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[9px] text-violet-400 font-semibold bg-black/60 px-2 py-1 rounded-md">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Uploading...
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-white/25 block leading-normal">
                            * Supports selecting multiple files at once. Uploads will append to the current {activeEditingVar.name} variant images list. Maximum 8 images per variant.
                          </span>
                        </div>
                      </div>
                    );
                  })()}
            </>
          )}
        </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
                <Button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-transparent border border-white/10 hover:bg-white/[0.04] text-xs font-semibold px-5 rounded-xl h-10 text-white/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editMutation.isPending || isUploading}
                  className="text-xs font-bold uppercase tracking-wider h-10 px-6 rounded-xl text-white transition-all duration-300 shadow-[0_4px_15px_rgba(124,58,237,0.25)] flex items-center gap-1.5 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                  }}
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALS (CONFIRM DELETE) ── */}
      {isDeleteModalOpen && currentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d16] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Confirm Catalog Deletion
              </h3>
              <p className="text-xs text-white/45 leading-relaxed">
                Are you absolutely sure you want to delete{" "}
                <span className="text-white font-semibold">{currentProduct.name}</span>? This action
                is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
              <Button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-transparent border border-white/10 hover:bg-white/[0.04] text-xs font-semibold px-5 rounded-xl h-10 text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold uppercase tracking-wider h-10 px-5 rounded-xl text-red-400 hover:text-red-300 transition duration-200 flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Product"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
