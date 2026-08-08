import { redirect } from "next/navigation";

export default function DashboardIndexPage() {
  // Phase 1 chưa có trang tổng quan riêng — vào thẳng danh sách tenant.
  redirect("/tenants");
}
