import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

export function formResolver<TValues extends FieldValues>(schema: ZodType<TValues>): Resolver<TValues> {
  // React Hook Form and Zod v4 expose different input/output generics; this keeps the cast in one interop boundary.
  return zodResolver<TValues, unknown, TValues>(schema as never) as Resolver<TValues>;
}
