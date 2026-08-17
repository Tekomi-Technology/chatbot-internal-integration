export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  value = value.replace(/:\d+$/, "");
  value = value.replace(/\.$/, "");

  const wildcard = value.startsWith("*.");
  let host = wildcard ? value.slice(2) : value;

  if (!wildcard && host.startsWith("www.") && host.split(".").length > 2) {
    host = host.slice(4);
  }

  const isLocalhost = host === "localhost";
  const isHostname = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/.test(
    host,
  );

  if (!isLocalhost && !isHostname) return null;
  return wildcard ? `*.${host}` : host;
}

export function hostnameFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isDomainAllowed(
  hostname: string | null,
  whitelist: readonly string[],
): boolean {
  if (!hostname || whitelist.length === 0) return false;
  const host = hostname.toLowerCase();

  return whitelist.some((entry) => {
    if (entry.startsWith("*.")) {
      const base = entry.slice(2);
      return host === base || host.endsWith(`.${base}`);
    }
    return host === entry || host === `www.${entry}`;
  });
}
