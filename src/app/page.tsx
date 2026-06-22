import { redirect } from "next/navigation";

export default function Home() {
  // M1：唯一核心页是 /forge，根路径直接跳转（不做 landing page）。
  redirect("/forge");
}
