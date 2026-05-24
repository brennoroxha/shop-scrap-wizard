import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import bannerActine from "@/assets/banner-desktop-actine.webp";
import bannerCleanance from "@/assets/banner-desktop-cleanance.webp";

const slides = [
  { src: bannerActine, alt: "Actine Gel de Limpeza", to: "/busca?q=actine" },
  { src: bannerCleanance, alt: "Cleanance Gel de Limpeza", to: "/busca?q=cleanance" },
];

const DesktopBannerCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    const id = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(id);
    };
  }, [emblaApi]);

  return (
    <section className="hidden md:block py-4">
      <div className="container-page">
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex">
            {slides.map((s, i) => (
              <div key={i} className="min-w-0 flex-[0_0_100%]">
                <Link to={s.to} className="block">
                  <img
                    src={s.src}
                    alt={s.alt}
                    className="block w-full h-auto"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para banner ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                selected === i ? "w-6 bg-[#29ABE2]" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DesktopBannerCarousel;
