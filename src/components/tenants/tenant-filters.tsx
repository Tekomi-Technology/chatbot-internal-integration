"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

/**
 * Đẩy bộ lọc lên URL search params thay vì giữ trong state, để trang danh sách
 * vẫn là Server Component và filter chia sẻ / reload được.
 */
export function TenantFilters({
  defaultQuery,
  defaultStatus,
}: {
  defaultQuery?: string;
  defaultStatus?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(defaultQuery ?? "");

  function pushParams(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname));
  }

  // Debounce ô tìm kiếm để mỗi lần gõ không tạo một round-trip xuống DB.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");
      if (next.toString() !== searchParams.toString()) pushParams(next);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchParams]);

  function onStatusChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    pushParams(next);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Tìm theo tên, slug hoặc Dify App ID…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Tìm tenant"
        />
      </div>

      <Select
        className="w-44"
        defaultValue={defaultStatus ?? ""}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Lọc theo trạng thái"
      >
        <option value="">Mọi trạng thái</option>
        <option value="ACTIVE">Đang hoạt động</option>
        <option value="INACTIVE">Đã tắt</option>
      </Select>
    </div>
  );
}
