import useSWR from "swr";
import { MenuItem } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMenu() {
  const { data: menuItems = [], error, isLoading, mutate } = useSWR<MenuItem[]>("/api/menu", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000,
  });

  return {
    menuItems,
    isLoading,
    isError: error,
    mutate,
  };
}
