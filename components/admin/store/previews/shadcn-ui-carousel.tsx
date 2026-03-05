"use client";

import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/registry/new-york-v4/ui/carousel";

type Slide = { src?: string; alt?: string; caption?: string; href?: string };
type Props = { showControls?: 'true' | 'false'; slides?: Slide[]; className?: string };

export default function ShadcnCarousel({ showControls = 'true', slides = [], className = '' }: Props) {
  return (
    <div className={className}>
      <Carousel className="w-full">
        <CarouselContent>
          {slides.map((slide, idx) => (
            <CarouselItem key={idx}>
              <div className="space-y-2 rounded-lg border bg-white p-3">
                {slide.href ? (
                  <a href={slide.href} target="_blank" rel="noreferrer">
                    {slide.src ? (
                      <Image
                        src={slide.src}
                        alt={slide.alt || ''}
                        width={1200}
                        height={800}
                        className="h-auto w-full rounded-md"
                        unoptimized
                      />
                    ) : (
                      <div className="h-40 w-full rounded-md bg-muted" />
                    )}
                  </a>
                ) : slide.src ? (
                  <Image
                    src={slide.src}
                    alt={slide.alt || ''}
                    width={1200}
                    height={800}
                    className="h-auto w-full rounded-md"
                    unoptimized
                  />
                ) : (
                  <div className="h-40 w-full rounded-md bg-muted" />
                )}
                {slide.caption ? <p className="text-sm text-muted-foreground">{slide.caption}</p> : null}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {showControls === 'true' ? (<>
          <CarouselPrevious />
          <CarouselNext />
        </>) : null}
      </Carousel>
    </div>
  );
}
