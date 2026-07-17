import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getExtendedProfile } from "@/lib/workspace.functions";

export function useProfile() {
  const get = useServerFn(getExtendedProfile);
  return useQuery({
    queryKey: ["ext-profile"],
    queryFn: () => get(),
    staleTime: 30_000,
  });
}
