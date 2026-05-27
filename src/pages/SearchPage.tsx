import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import AnnouncementBar from "@/components/AnnouncementBar";
import StoreHeader from "@/components/StoreHeader";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { getBrand } from "@/lib/productBrand";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

type SortKey = "relevance" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Relevância",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
};

const SearchPage = () => {
  const [params] = useSearchParams();
  const q = params.get("q")?.trim() ?? "";

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const baseResults = useMemo(() => {
    if (!q) return [];
    const nq = normalize(q);
    return products.filter((p) => normalize(p.name).includes(nq));
  }, [q]);

  const availableBrands = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of baseResults) {
      const b = getBrand(p);
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [baseResults]);

  const filtered = useMemo(() => {
    let list = baseResults;
    if (selectedBrands.length) {
      list = list.filter((p) => selectedBrands.includes(getBrand(p)));
    }
    const min = parseFloat(priceMin.replace(",", "."));
    const max = parseFloat(priceMax.replace(",", "."));
    if (!isNaN(min)) list = list.filter((p) => p.price >= min);
    if (!isNaN(max)) list = list.filter((p) => p.price <= max);

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
    }

    return sorted;
  }, [baseResults, selectedBrands, priceMin, priceMax, sort]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setPriceMin("");
    setPriceMax("");
  };

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-foreground">
          Ordenar por
        </h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase text-foreground">
          Preço
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Mín"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Máx"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {availableBrands.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase text-foreground">
            Marca
          </h3>
          <ul className="space-y-2">
            {availableBrands.map(([brand, count]) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="flex-1">{brand}</span>
                  <span className="text-xs text-muted-foreground">({count})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(selectedBrands.length > 0 || priceMin || priceMax) && (
        <button
          onClick={clearFilters}
          className="w-full rounded-md border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <StoreHeader />
      <Navigation />
      <div className="container-page py-6 md:py-8">
        <h1 className="mb-1 text-xl font-bold text-foreground md:text-2xl">
          Resultados para "{q}"
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {filtered.length} produto(s) encontrado(s)
        </p>

        {/* Mobile filter trigger */}
        <div className="mb-4 flex items-center justify-between md:hidden">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {(selectedBrands.length > 0 || priceMin || priceMax) && (
              <span className="ml-1 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                {selectedBrands.length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0)}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 flex-shrink-0 md:block">
            <div className="sticky top-4 rounded-lg border border-border bg-card p-4">
              {FiltersPanel}
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                <Link
                  to="/"
                  className="mt-4 inline-block text-primary hover:underline"
                >
                  Voltar para a página inicial
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} fullWidth />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Filtros</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Fechar"
                className="rounded-md p-1 text-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {FiltersPanel}
            <button
              onClick={() => setFiltersOpen(false)}
              className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Ver {filtered.length} resultado(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
