"use client";

import dynamic from "next/dynamic";
import "./variants.css";
import type { DoorsViewProps, ShopViewProps, Variant } from "./kit";
import { PosterDoors, PosterShop } from "./poster";

const GridDoors =
  process.env.NODE_ENV === "production"
    ? function GridDoorsOff() {
        return null;
      }
    : dynamic(() => import("./grid").then((mod) => mod.GridDoors));
const GridShop =
  process.env.NODE_ENV === "production"
    ? function GridShopOff() {
        return null;
      }
    : dynamic(() => import("./grid").then((mod) => mod.GridShop));
const CeramicDoors =
  process.env.NODE_ENV === "production"
    ? function CeramicDoorsOff() {
        return null;
      }
    : dynamic(() => import("./ceramic").then((mod) => mod.CeramicDoors));
const CeramicShop =
  process.env.NODE_ENV === "production"
    ? function CeramicShopOff() {
        return null;
      }
    : dynamic(() => import("./ceramic").then((mod) => mod.CeramicShop));

export function VariantDoors({ variant, ...props }: DoorsViewProps & { variant: Variant }) {
  if (process.env.NODE_ENV !== "production") {
    if (variant === "b") return <GridDoors {...props} />;
    if (variant === "c") return <CeramicDoors {...props} />;
  }
  return <PosterDoors {...props} />;
}

export function VariantShop({ variant, ...props }: ShopViewProps & { variant: Variant }) {
  if (process.env.NODE_ENV !== "production") {
    if (variant === "b") return <GridShop {...props} />;
    if (variant === "c") return <CeramicShop {...props} />;
  }
  return <PosterShop {...props} />;
}
