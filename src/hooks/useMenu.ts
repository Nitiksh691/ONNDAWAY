import useSWR from "swr";
import { MenuItem } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMenu() {
  const { data: menuItems = [], error, isLoading, mutate } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: false,      // Don't re-fetch every tab switch — menu rarely changes
    revalidateOnReconnect: true,   // Do re-fetch on network reconnect
    dedupingInterval: 60000,       // Cache for 60s
  });

  return {
    menuItems,
    isLoading,
    isError: error,
    mutate,
  };
}
