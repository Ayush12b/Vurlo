import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useProducts, resolveProductImage, formatPrice } from "@/hooks/use-products";
import { getProductSlug } from "@/utils/product";
import { PRODUCT_SEO_DATA } from "@/utils/seo-data";
import { ShoppingBag, Loader2, Heart, ArrowLeft, ShieldCheck, Truck, Users, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    const seo = PRODUCT_SEO_DATA[slug];
    const metaTitle = seo?.metaTitle || `${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} - Vurlo | Premium Lighting & Decor`;
    const metaDesc = seo?.metaDescription || `Shop the premium ${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} on Vurlo. High-quality aesthetic lighting, crystal lamps, galaxy projectors, and ambient room decor. Free shipping available.`;
    return {
      meta: [
        { title: metaTitle },
        {
          name: "description",
          content: metaDesc,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://vurlo.store/product/${slug}` },
        { property: "og:title", content: metaTitle },
        { property: "og:description", content: metaDesc },
        { property: "og:image", content: "https://vurlo.store/preview.jpg" },
        { property: "twitter:card", content: "summary_large_image" },
        { property: "twitter:url", content: `https://vurlo.store/product/${slug}` },
        { property: "twitter:title", content: metaTitle },
        { property: "twitter:description", content: metaDesc },
        { property: "twitter:image", content: "https://vurlo.store/preview.jpg" },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data: dbProducts = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const product = useMemo(() => {
    return dbProducts.find((p) => p.slug === slug);
  }, [dbProducts, slug]);

  const seoData = useMemo(() => {
    if (!product) return null;
    return PRODUCT_SEO_DATA[product.slug] || null;
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const filtered = dbProducts.filter((p) => p.id !== product.id && p.active !== false);
    const sameCategory = filtered.filter((p) => p.category === product.category);
    const pool = sameCategory.length >= 3 ? sameCategory : filtered;
    return pool.slice(0, 3);
  }, [dbProducts, product]);

  // Debug logging for product slugs and error handling
  useEffect(() => {
    if (!isLoading && dbProducts.length > 0) {
      console.log("All product slugs:", dbProducts.map((p) => p.slug));
      if (!product) {
        console.error(`Product slug not found: "${slug}". Showing fallback UI.`);
      }
    }
  }, [dbProducts, isLoading, product, slug]);

  // Variant Detection
  const hasVariants = useMemo(() => {
    return (
      product?.images != null &&
      typeof product.images === "object" &&
      !Array.isArray(product.images) &&
      Object.keys(product.images).length > 0
    );
  }, [product?.images]);

  // Initial Variant Selection
  const getInitialVariant = useCallback(() => {
    if (hasVariants && product) {
      const keys = Object.keys(product.images);
      if (product.defaultVariant) {
        const found = keys.find(
          (k) => k.toLowerCase() === product.defaultVariant!.toLowerCase()
        );
        if (found) return found;
      }
      return keys[0] || "";
    }
    return "";
  }, [hasVariants, product]);

  const [selectedVariant, setSelectedVariant] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);

  // Set default variant on product load
  useEffect(() => {
    if (product) {
      setSelectedVariant(getInitialVariant());
      setCurrentImageIndex(0);
      setImgError(false);
      setNotifyDone(false);
    }
  }, [product, getInitialVariant]);

  // Resolved Images array
  const resolvedImages = useMemo(() => {
    if (!product) return [];
    let imgs: string[] = [];
    if (hasVariants) {
      imgs = (product.images as Record<string, string[]>)[selectedVariant] || [];
    } else if (Array.isArray(product.images)) {
      imgs = product.images;
    } else if (typeof product.image === "string") {
      imgs = [product.image];
    }
    return Array.from(new Set(imgs)).filter((img) => typeof img === "string" && img.trim() !== "");
  }, [hasVariants, product, selectedVariant]);

  const currentImage = useMemo(() => {
    return resolvedImages[currentImageIndex] ?? resolvedImages[0] ?? "";
  }, [resolvedImages, currentImageIndex]);

  // Reset img error on image change
  useEffect(() => {
    setImgError(false);
  }, [currentImage]);

  const handleVariantChange = (variant: string) => {
    setSelectedVariant(variant);
    setCurrentImageIndex(0);
    setImgError(false);
  };

  const handleAddToCart = async () => {
    if (addingToCart || !product || product.stock === 0) return;
    setAddingToCart(true);
    try {
      await addToCart({
        productId: product.id,
        name: hasVariants
          ? `${product.name} (${selectedVariant})`
          : product.name,
        price: product.price,
        image: resolvedImages[0] || resolveProductImage("", product.name),
      });
      toast.success("Added to cart", {
        description: `${product.name} added to your bag successfully.`,
        duration: 2500,
      });
    } catch (err) {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleNotifyMe = async () => {
    if (!product) return;
    const cleanEmail = notifyEmail.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setNotifySubmitting(true);
    try {
      const q = query(
        collection(db, "stock_notifications"),
        where("productId", "==", product.id),
        where("email", "==", cleanEmail)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.info("You're already on the list for this product.");
        setNotifyDone(true);
        return;
      }
      await addDoc(collection(db, "stock_notifications"), {
        productId: product.id,
        productName: product.name,
        email: cleanEmail,
        createdAt: serverTimestamp(),
      });
      setNotifyDone(true);
      toast.success("We'll notify you when it's back!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setNotifySubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <p className="text-sm text-white/40 tracking-wider">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="mx-auto max-w-md text-center py-32 px-6">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300">404</h1>
            <h2 className="mt-4 text-xl font-bold text-white">Product Not Found</h2>
            <p className="mt-2 text-sm text-gray-400">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:brightness-110 text-white font-bold uppercase tracking-wider text-xs px-6 h-11 transition-all"
              >
                Go to Shop
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const onSale = product.isOnSale || product.onSale || false;
  const discount = product.discountPercentage || product.discountPercent || 0;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between page-transition">
      <div>
        <Navbar />

        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:py-16">
          {/* Ambient ambient background glows */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div
              className="absolute top-10 left-1/4 w-[600px] h-[600px] rounded-full opacity-35 blur-[130px]"
              style={{
                background: `radial-gradient(circle, ${product.accent || "#8a2eff"}15 0%, transparent 70%)`,
              }}
            />
            <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
          </div>

          {/* Breadcrumb / Back button */}
          <div className="mb-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Gallery Section */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-2xl border border-white/[0.06] bg-white/[0.01] flex items-center justify-center p-6 overflow-hidden">
                <div
                  className="absolute w-[80%] h-[80%] rounded-full opacity-20 blur-[50px] pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${product.accent || "#8a2eff"}20 0%, transparent 70%)`,
                  }}
                />
                <img
                  src={imgError || !currentImage ? resolveProductImage("", product.name) : currentImage}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="max-w-full max-h-full object-contain relative z-10 rounded-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* Thumbnails */}
              {resolvedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-1 min-h-[64px]">
                  {resolvedImages.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl border shrink-0 bg-white/[0.01] overflow-hidden transition-all duration-200 cursor-pointer ${
                        idx === currentImageIndex
                          ? "border-violet-500 scale-105 opacity-100"
                          : "border-white/[0.08] opacity-40 hover:opacity-75"
                      }`}
                    >
                      <img
                        src={img || resolveProductImage("", "")}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = resolveProductImage("", "");
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] text-white/50">
                    {product.category || "RGB Lights"}
                  </span>
                  {product.stock === 0 ? (
                    <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/25 text-red-400">
                      Sold Out
                    </span>
                  ) : (
                    <>
                      {product.badge && (
                        <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/25 text-amber-400 animate-pulse">
                          {product.badge}
                        </span>
                      )}
                      {onSale && (
                        <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/25 text-red-400">
                          {discount > 0 ? `${discount}% OFF` : "Sale"}
                        </span>
                      )}
                      {product.isNew && (
                        <span className="inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                          New
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* H1 Title */}
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {seoData?.title || product.name}
                </h1>

                {/* Rating & Reviews */}
                {product.rating !== undefined && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const isFilled = idx < Math.floor(product.rating || 0);
                        return (
                          <span key={idx} className={isFilled ? "text-amber-400 font-bold" : "text-white/20"}>
                            ★
                          </span>
                        );
                      })}
                    </div>
                    <span className="font-bold">{product.rating}</span>
                    {product.reviewsCount !== undefined && (
                      <span className="text-white/35 font-medium">
                        ({product.reviewsCount} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Pricing & Variants */}
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <p
                      className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300"
                      style={{ textShadow: `0 0 30px rgba(var(--accent-rgb), 0.25)` }}
                    >
                      ₹{formatPrice(product.price)}
                    </p>
                    {onSale && product.originalPrice && (
                      <p className="text-sm text-white/30 line-through font-semibold">
                        ₹{formatPrice(product.originalPrice)}
                      </p>
                    )}
                  </div>

                  {/* Variant Selection */}
                  {hasVariants && (
                    <div className="space-y-2 border-t border-white/[0.04] pt-4">
                      <label className="text-[10px] font-bold text-white/45 uppercase tracking-widest block">
                        Choose Variant
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(product.images).map((variant) => (
                          <button
                            key={variant}
                            type="button"
                            onClick={() => handleVariantChange(variant)}
                            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                              selectedVariant === variant
                                ? "border-violet-500 bg-violet-500/10 text-violet-300"
                                : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white/80 hover:border-white/20"
                            }`}
                          >
                            {variant.charAt(0).toUpperCase() + variant.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[1px] bg-white/[0.06] my-6" />

              {/* Description & Variant Specific text */}
              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                  {seoData?.description || product.description ||
                    "Premium aesthetic setup upgrade designed to elevate your room and workspace ambiance with stylish lighting and high quality build."}
                </p>

                {hasVariants && (
                  <div
                    key={selectedVariant}
                    className="p-4 rounded-xl border border-violet-500/10 bg-violet-500/[0.02] text-xs text-violet-300 leading-relaxed whitespace-pre-line animate-in fade-in duration-300"
                  >
                    <p className="font-bold text-[10px] text-white/50 uppercase tracking-wider block mb-1">
                      {selectedVariant.charAt(0).toUpperCase() + selectedVariant.slice(1)} Edition Details
                    </p>
                    <p className="text-gray-400 leading-relaxed text-xs">
                      {selectedVariant.toLowerCase() === "galaxy" && "Vibrant nebula lighting with rotating stars, best for gaming setups and active visual effects."}
                      {selectedVariant.toLowerCase() === "moon" && "Warm, peaceful moonlight glow with cozy lunar details, perfect for relaxation and ambient bedroom decor."}
                      {selectedVariant.toLowerCase() === "saturn" && "Elegant Saturn design etched inside a crystal sphere, glowing with a warm ambient light. Perfect for aesthetic setups and cozy room decor."}
                      {selectedVariant.toLowerCase() === "astronaut" && "A glowing astronaut crystal ball lamp with a dreamy moon and stars design. Perfect for cozy lighting, aesthetic setups, and unique gifting."}
                    </p>
                  </div>
                )}
              </div>

              {/* Features List */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest block">
                    Product Features
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(product.features as string[]).map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-violet-400 font-bold select-none">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add to Cart or Notify Me */}
              <div className="pt-6 border-t border-white/[0.06] flex items-center gap-4">
                {product.stock === 0 ? (
                  <div className="w-full space-y-3">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      Notify me when back in stock
                    </p>
                    {notifyDone ? (
                      <div className="w-full h-12 rounded-xl border border-green-500/20 bg-green-500/5 flex items-center justify-center text-xs font-bold text-green-400">
                        ✓ We will email you once it's restocked!
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-12 px-4 text-xs focus:outline-none transition-all"
                        />
                        <button
                          onClick={handleNotifyMe}
                          disabled={notifySubmitting}
                          className="h-12 px-6 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 transition-all shrink-0"
                          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)" }}
                        >
                          {notifySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify Me"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3 w-full">
                    <button
                      disabled={addingToCart}
                      onClick={handleAddToCart}
                      className="flex-1 text-xs font-bold uppercase tracking-wider h-12 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_25px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)" }}
                    >
                      {addingToCart ? (
                        <><Loader2 className="h-4.5 w-4.5 animate-spin" /><span>Adding...</span></>
                      ) : (
                        <><ShoppingBag className="h-4.5 w-4.5" /><span>Add to Bag</span></>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        toggleWishlist?.({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: resolvedImages[0] || resolveProductImage("", product.name),
                        })
                      }
                      className={`h-12 w-12 rounded-xl border flex items-center justify-center transition cursor-pointer focus:outline-none shrink-0 ${
                        isWishlisted(product.id)
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                          : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white"
                      }`}
                      aria-label="Toggle wishlist"
                    >
                      <Heart size={16} className={isWishlisted(product.id) ? "fill-rose-400" : ""} />
                    </button>
                  </div>
                )}
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.04]">
                {[
                  [Truck, "Free Shipping", "On all orders"],
                  [ShieldCheck, "Secure Checkout", "SSL Encrypted"],
                  [Users, "Trusted by 1000+ Customers", "Satisfied buyers"],
                ].map(([Icon, label, sub]: any, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]"
                  >
                    <Icon className="h-5 w-5 text-violet-400 mb-1.5" />
                    <span className="text-[10px] font-bold text-white/80 block leading-tight">
                      {label}
                    </span>
                    <span className="text-[8px] text-white/30 block mt-0.5 leading-none">
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Content Sections, FAQs, and Related Products */}
        {seoData && (
          <div className="mt-20 border-t border-white/[0.06] pt-16 space-y-16 animate-in fade-in duration-500">
            {/* 1. Unique SEO-optimized Description */}
            <section className="space-y-4 max-w-4xl text-left">
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                About {product.name}
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                {seoData.description}
              </p>
            </section>

            {/* 2. Structured Sections: Use Cases & Why Buy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
              <section className="space-y-4">
                <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <span>Typical Use Cases</span>
                </h2>
                <ul className="space-y-3">
                  {seoData.useCases.map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-white/50 leading-relaxed">
                      <span className="text-violet-400 font-bold select-none">•</span>
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-display text-xl font-bold text-white">
                  Why Choose Vurlo Lighting
                </h2>
                <ul className="space-y-3">
                  {seoData.whyBuy.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-white/50 leading-relaxed">
                      <span className="text-cyan-400 font-bold select-none">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 3. FAQ Section */}
            {seoData.faqs.length > 0 && (
              <section className="space-y-6 text-left">
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Frequently Asked Questions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {seoData.faqs.map((faq, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{faq.question}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Related Products Section */}
            {relatedProducts.length > 0 && (
              <section className="space-y-6 text-left">
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Related Products
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedProducts.map((related) => {
                    const relatedImage = (() => {
                      if (Array.isArray(related.images)) {
                        return related.images[0] || related.image || "";
                      }
                      if (related.images && typeof related.images === "object") {
                        const defVar = (related.defaultVariant || "Galaxy").toLowerCase();
                        const varImages = (related.images as Record<string, string[]>)[defVar] || Object.values(related.images)[0] || [];
                        return varImages[0] || related.image || "";
                      }
                      return related.image || "";
                    })();

                    return (
                      <Link
                        key={related.id}
                        to="/product/$slug"
                        params={{ slug: related.slug }}
                        className="group rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:border-violet-500/30 p-4 transition-all duration-300 flex flex-col h-full hover:shadow-[0_8px_30px_rgba(138,46,255,0.05)]"
                      >
                        <div className="aspect-square w-full rounded-xl bg-white/[0.02] flex items-center justify-center p-4 overflow-hidden relative">
                          <img
                            src={resolveProductImage(relatedImage, related.name)}
                            alt={related.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
                          />
                        </div>
                        <div className="flex flex-col flex-1 mt-4 space-y-2">
                          <h3 className="text-xs font-bold text-white truncate">{related.name}</h3>
                          <p className="text-[10px] text-white/30 truncate uppercase tracking-widest">{related.category}</p>
                          <p className="text-xs font-bold text-violet-400 mt-auto">₹{formatPrice(related.price)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": seoData?.title || product.name,
                "description": seoData?.description || product.description,
                "image": resolvedImages[0] || resolveProductImage("", seoData?.title || product.name),
                "brand": {
                  "@type": "Brand",
                  "name": "Vurlo"
                },
                "offers": {
                  "@type": "Offer",
                  "price": product.price,
                  "priceCurrency": "INR",
                  "availability": (product.stock ?? 10) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "url": `https://vurlo.store/product/${product.slug}`
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": product.rating || 4.7,
                  "reviewCount": product.reviewsCount || 38
                }
              })}
            </script>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
