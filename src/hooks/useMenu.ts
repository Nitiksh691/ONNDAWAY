import useSWR from "swr";
import { MenuItem } from "@/lib/types";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Failed to fetch menu: ${r.status}`);
  }
  const data = await r.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid menu data format");
  }
  return data;
};

export function useMenu(fallbackData?: MenuItem[]) {
  const { data, error, isLoading, mutate } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    fallbackData,
    revalidateOnFocus: false,      // Don't re-fetch every tab switch — menu rarely changes
    revalidateOnReconnect: true,   // Do re-fetch on network reconnect
    dedupingInterval: 60000,       // Cache for 60s
  });

  const menuItems = Array.isArray(data) ? data : (Array.isArray(fallbackData) ? fallbackData : []);

  return {
    menuItems,
    isLoading,
    isError: error,
    mutate,
  };
}
